import type { ArgTypes } from "@repo/utils/cmd-ts-types";
import { logger } from "@repo/utils/logger";
import { resolveThunk } from "@repo/utils/thunk";
import { $ } from "bun";
import { KbldConfig } from "cdk8s-kbld";
import { binary, command, run } from "cmd-ts";
import { ConstructOrder } from "constructs";
import { rm } from "fs/promises";
import isWsl from "is-wsl";
import type { Config } from "./config";
import { defaultArgs } from "./default-args";
import { getK3dNodes } from "./get-k3d-nodes";
import { getRegistry } from "./get-registry";
import { resolveK3dConfig } from "./k3d-config";
import { checkRequirements, DEFAULT_REQUIREMENTS } from "./requirements";

type ManifestSource = { type: "directory"; path: string } | { type: "buffer"; buffer: ArrayBuffer };

/**
 * Creates a cdk8s-local CLI command based on the provided configuration.
 *
 * Unless you want to integrate a cdk8s-local command into an existing cmd-ts CLI, you probably want to use `cdk8sLocal` instead.
 */
export function cdk8sLocalCommand<Arguments extends ArgTypes, Data>(config: Config<Arguments, Data>) {
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

			if (create) {
				const k3dConfig = await resolveThunk(config.k3d, ctx);

				logger.info(`Creating k3d cluster (${clusterName})...`);
				if (k3dConfig?.configureCilium && isWsl) {
					logger.warn("Cilium configuration is not supported on WSL, skipping Cilium setup for k3d.");
					k3dConfig.configureCilium = false;
				}

				for (const volume of k3dConfig?.volumes ?? []) {
					if (volume.deleteOnClusterCreate) {
						await rm(volume.hostPath, { recursive: true, force: true });
					}
					await $`mkdir -p ${volume.hostPath}`;
				}

				const resolvedConfig = await resolveK3dConfig(clusterName, k3dConfig);
				const configBuffer = Buffer.from(resolvedConfig, "utf-8");
				await $`k3d cluster create -c - < ${configBuffer}`;

				if (k3dConfig?.configureCilium) {
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

			logger.info("Running synth (generating manifests)...");
			const app = await config.synth({
				...ctx,
				create,
				registry: await getRegistry(clusterName),
			});
			await rm(app.outdir, { recursive: true, force: true });
			app.synth();

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
			}

			logger.info("Applying manifests to local cluster...");

			// TODO: Set KUBECONFIG for kapp to use the k3d cluster config directly, rather than relying on k3d setting current-context.
			const context = (await $`kubectl config current-context`.text()).trim();
			if (context !== `k3d-${clusterName}`) {
				logger.fatal(`Will not deploy local environment to context: ${context}`);
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

export { isWsl };
