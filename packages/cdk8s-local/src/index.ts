import type { ArgTypes } from "@hamishwhc/cdk8s-monorepo-utils/cmd-ts-types";
import { logger } from "@hamishwhc/cdk8s-monorepo-utils/logger";
import { resolveThunk } from "@hamishwhc/cdk8s-monorepo-utils/thunk";
import { $ } from "bun";
import { KbldConfig } from "cdk8s-kbld2";
import { binary, command, run, type Runner } from "cmd-ts";
import type { ArgParser } from "cmd-ts/dist/cjs/argparser";
import type { Output } from "cmd-ts/dist/cjs/command";
import type { Aliased, Descriptive, Named, PrintHelp, ProvidesHelp, Versioned } from "cmd-ts/dist/cjs/helpdoc";
import { ConstructOrder } from "constructs";
import { rm } from "fs/promises";
import isWsl from "is-wsl";
import path from "path";
import type { Config } from "./config";
import { defaultArgs, type DefaultArgs } from "./default-args";
import { getK3dNodes } from "./get-k3d-nodes";
import { getRegistry } from "./get-registry";
import { resolveK3dConfig, type K3dConfigResolution } from "./k3d-config";
import { checkRequirements, DEFAULT_REQUIREMENTS, type CommonRequirements } from "./requirements";

type ManifestSource = { type: "directory"; path: string } | { type: "buffer"; buffer: ArrayBuffer };

export type {
	BindMountVolume,
	EnvironmentVariable,
	K3dConfig,
	K3dConfigResolution,
	K3dSimpleConfig,
	K3DSimpleConfigV1Alpha5,
	K3sArg,
	Port,
} from "./k3d-config";
export { CommonRequirements, Config, DefaultArgs, isWsl };

export type Command<Arguments extends ArgTypes> = ArgParser<Output<DefaultArgs & Arguments>> &
	PrintHelp &
	ProvidesHelp &
	Named &
	Runner<Output<DefaultArgs & Arguments>, Promise<number | undefined>> &
	Partial<Versioned & Descriptive & Aliased>;

/**
 * Creates a cdk8s-local CLI command based on the provided configuration.
 *
 * Unless you want to integrate a cdk8s-local command into an existing cmd-ts CLI, you probably want to use `cdk8sLocal` instead.
 */
export function cdk8sLocalCommand<Arguments extends ArgTypes, Data>(
	config: Config<Arguments, Data>,
): Command<Arguments> {
	return command({
		name: config.command?.name ?? "local",
		description:
			config.command?.description ?? "Synthesises, builds and deploys your CDK8s app to a local k3d cluster.",
		args: {
			...config.args!,
			...defaultArgs,
		},
		handler: async (args) => {
			const startupCtx = { args, command: "local" as const };
			const additionalRequirements = (await resolveThunk(config.requirements, startupCtx)) ?? [];
			await checkRequirements([...DEFAULT_REQUIREMENTS, ...additionalRequirements]);

			const ctx = {
				...startupCtx,
				data: (await config.hooks?.startup?.(startupCtx)) ?? ({} as Data),
			};

			const clusterName = (await resolveThunk(config.clusterName, ctx)) ?? "cdk8s-local";

			const clusterGetProc = await $`k3d cluster get ${clusterName}`.throws(false).quiet();
			let create = true;
			if (clusterGetProc.exitCode === 0) {
				if (args.recreate) {
					logger.info("Deleting existing k3d cluster...");
					await $`k3d cluster delete ${clusterName}`.quiet();
				} else {
					create = false;
				}
			}

			let registry = create ? null : await getRegistry(clusterName);
			let k3dConfigResolution: K3dConfigResolution | null = null;

			if (create) {
				const k3dConfig = await resolveThunk(config.k3d, ctx);
				k3dConfigResolution = await resolveK3dConfig(clusterName, k3dConfig);
				registry = k3dConfigResolution.registry;
			}

			const synthCtx = {
				...ctx,
				create,
				registry,
			};
			synthCtx.data = (await config.hooks?.preSynth?.(synthCtx)) ?? synthCtx.data;

			logger.info("Running synth (generating manifests)...");
			const app = await config.synth(synthCtx);
			await rm(app.outdir, { recursive: true, force: true });
			app.synth();

			if (args.synth) {
				logger.info(
					"Synth complete, skipping build and deploy, find manifests in " + path.relative(process.cwd(), app.outdir),
				);
				return;
			}

			if (k3dConfigResolution) {
				logger.info(`Creating k3d cluster (${clusterName})...`);
				if (k3dConfigResolution.originalConfig?.configureCilium && isWsl) {
					logger.warn("Cilium configuration is not supported on WSL, skipping Cilium setup for k3d.");
					k3dConfigResolution.originalConfig.configureCilium = false;
				}

				for (const volume of k3dConfigResolution.originalConfig?.volumes ?? []) {
					if (volume.deleteOnClusterCreate) {
						await rm(volume.hostPath, { recursive: true, force: true });
					}
					await $`mkdir -p ${volume.hostPath}`;
				}

				const configBuffer = Buffer.from(k3dConfigResolution.resolvedConfig, "utf-8");
				await $`k3d cluster create -c - < ${configBuffer}`;

				if (k3dConfigResolution.originalConfig?.configureCilium) {
					const nodes = await getK3dNodes(clusterName);
					for (const { name, role } of nodes) {
						if (role !== "server" && role !== "agent") {
							continue;
						}

						// Magic to make Cilium work on MacOS (and hopefully Linux) Docker Desktop/OrbStack:
						// - https://sandstorm.de/blog/posts/running-cilium-in-k3s-and-k3d-lightweight-kubernetes-on-mac-os-for-development
						// - https://github.com/cilium/cilium/issues/10516
						// - https://github.com/k3d-io/k3d/issues/363
						// - https://docs.cilium.io/en/v1.14/installation/rancher-desktop/#rancher-desktop-install
						// - https://github.com/istio/istio/issues/54865
						await $`docker exec -it ${name} mount bpffs /sys/fs/bpf -t bpf`;
						await $`docker exec -it ${name} mount --make-shared /sys/fs/bpf`;
						await $`docker exec -it ${name} mkdir -p /run/cilium/cgroupv2`;
						await $`docker exec -it ${name} mount -t cgroup2 none /run/cilium/cgroupv2`;
						await $`docker exec -it ${name} mount --make-shared /run/cilium/cgroupv2`;
						await $`docker exec -it ${name} mount --make-rshared /var/run`;
					}
				}
			}

			let manifestSource: ManifestSource = { type: "directory" as const, path: app.outdir };
			if (app.node.findAll(ConstructOrder.POSTORDER).find((c) => c instanceof KbldConfig)) {
				logger.info("Detected kbld config construct, running kbld...");
				try {
					manifestSource = { type: "buffer" as const, buffer: await $`kbld -f ${app.outdir}`.arrayBuffer() };
				} catch (e) {
					if (e instanceof $.ShellError) {
						logger.error(e.stderr.toString("utf-8"));
						logger.fatal("Failed to build images from manifests.");
						return 1;
					}
					throw e;
				}
			} else if (args.build) {
				logger.warn(
					"The --build flag was set but no kbld config was found in the app. Skipping build step - no manifests will be emitted on stdout.",
				);
			}

			if (args.build) {
				if (manifestSource.type === "buffer") {
					process.stdout.write(Buffer.from(manifestSource.buffer));
				}
				return;
			}

			logger.info("Applying manifests to local cluster...");

			// TODO: Set KUBECONFIG for kapp to use the k3d cluster config directly, rather than relying on k3d setting current-context.
			const context = (await $`kubectl config current-context`.text()).trim();
			if (context !== `k3d-${clusterName}`) {
				logger.fatal(`Will not deploy local environment to context: ${context}`);
				// throw new CliError("Current kubectl context does not match k3d cluster context.");
				return 1;
			}

			// TODO: Re-evaluate if this is needed in general - it was originally added as I used to only include CRDs when creating a cluster.
			// const filterJson = {
			// 	not: { and: [{ ops: ["delete"] }, { existingResource: { kinds: ["CustomResourceDefinition"] } }] },
			// };
			// const filter = `--diff-filter=${JSON.stringify(filterJson)}`;
			try {
				const commonArguments = ["-y", "-a", clusterName];
				if (manifestSource.type === "directory") {
					await $`kapp deploy ${commonArguments} -f ${manifestSource.path}`;
				} else {
					await $`kapp deploy ${commonArguments} -f - < ${manifestSource.buffer}`;
				}
			} catch (e) {
				if (e instanceof $.ShellError) {
					logger.fatal("Failed to deploy manifests to local cluster.");
					return 1;
				}
				throw e;
			}

			logger.info("Local deployment successful.");
		},
	});
}

export async function cdk8sLocal<Arguments extends ArgTypes, Data>(config: Config<Arguments, Data>) {
	const cmd = cdk8sLocalCommand(config);
	await run(binary(cmd), process.argv);
}
