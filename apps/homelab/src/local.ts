import { $ } from "bun";
import { binary, boolean, command, flag, option, optional, run } from "cmd-ts";
import { rm } from "fs/promises";
import isWsl from "is-wsl";
import path from "path";
import { synth } from ".";
import { Config, exportConfigJsonSchema, type RawConfig } from "./schema/config";
import { ConfigArg, findFirstConfig } from "./utils/config-arg";
import { getRegistryPort } from "./utils/get-registry-ports";
import { joinHostname } from "./utils/hostnames";
import { logger } from "./utils/logging";
import { APP_ROOT, OUT_DIR } from "./utils/paths";
import { checkRequirements, LOCAL_DEV_REQUIRED_PROGRAMS } from "./utils/requirements";

const CLUSTER_NAME = "homelab-dev";
const REGISTRY_NAME = "registry.k3d.hamishwhc.com";

const cli = command({
	name: "bun local",
	description: "CLI for locally running the homelab cluster.",
	args: {
		recreate: flag({
			type: boolean,
			long: "recreate",
			short: "r",
			description: "recreate the local cluster",
		}),
		env: option({
			type: optional(ConfigArg),
			long: "env",
			short: "e",
			description:
				"environment config to use during generation, config will be loaded from `config.<env>.<yaml|yml|json>`",
		}),
	},
	handler: async ({ recreate, env }) => {
		await exportConfigJsonSchema();

		if (!env) {
			env = await findFirstConfig();
		}

		await checkRequirements(LOCAL_DEV_REQUIRED_PROGRAMS);

		const clusters = await $`k3d cluster get ${CLUSTER_NAME}`.throws(false).quiet();
		let create = true;
		if (clusters.exitCode === 0) {
			if (recreate) {
				logger.info("Deleting existing k3d cluster...");
				await $`k3d cluster delete ${CLUSTER_NAME}`.quiet();
			} else {
				create = false;
			}
		}

		if (create) {
			const dataPath = path.join(APP_ROOT, ".k3d");
			const dataMount = `${dataPath}:/var/lib/rancher/k3s/storage@all`;
			await rm(dataPath, { recursive: true, force: true });
			await $`mkdir -p ${dataPath}`;

			const hostMount = `${APP_ROOT}:/workspace@all`;

			logger.info(`Creating k3d cluster (${CLUSTER_NAME})...`);
			const ciliumArgs = !isWsl
				? ["--k3s-arg", "--flannel-backend=none@all", "--k3s-arg", "--disable-network-policy@all"]
				: [];
			await $`k3d cluster create ${CLUSTER_NAME} \
                --servers 3 \
                --volume ${dataMount} \
                --volume ${hostMount} \
                --port 8080:80@loadbalancer \
                --port 8443:443@loadbalancer \
                --registry-create ${REGISTRY_NAME} \
                --k3s-arg '--disable=traefik@all' \
                ${ciliumArgs}`;

			if (!isWsl) {
				// TODO: Get from `k3d node list -o json`
				const containerName = `k3d-${CLUSTER_NAME}-server-0`;
				// Magic to make Cilium work on MacOS Docker Desktop/OrbStack:
				// - https://sandstorm.de/blog/posts/running-cilium-in-k3s-and-k3d-lightweight-kubernetes-on-mac-os-for-development
				// - https://github.com/cilium/cilium/issues/10516
				// - https://github.com/k3d-io/k3d/issues/363
				// - https://docs.cilium.io/en/v1.14/installation/rancher-desktop/#rancher-desktop-install
				// - https://github.com/istio/istio/issues/54865
				await $`docker exec -it ${containerName} mount bpffs /sys/fs/bpf -t bpf`;
				await $`docker exec -it ${containerName} mount --make-shared /sys/fs/bpf`;
				await $`docker exec -it ${containerName} mkdir -p /run/cilium/cgroupv2`;
				await $`docker exec -it ${containerName} mount -t cgroup2 none /run/cilium/cgroupv2`;
				await $`docker exec -it ${containerName} mount --make-shared /run/cilium/cgroupv2`;
				await $`docker exec -it ${containerName} mount --make-rshared /var/run`;
			}
		}

		const registryPort = await getRegistryPort(REGISTRY_NAME);

		const base = env.config;
		const config = Config.safeParse({
			...base,
			domains: {
				main: {
					...base.domains.main,
					domain: joinHostname(base.domains.main.domain, "k3d.hamishwhc.com"),
				},
			},
			dns: { enable: false },
			acme: { enable: false },
			images: {
				...base.images,
				destination: `${REGISTRY_NAME}:${registryPort}`,
			},
			features: {
				...base.features,
				monitoring: { enable: false },
			},
		} satisfies RawConfig);
		if (!config.success) {
			logger.fatal("Failed to parse local configuration:", {
				error: config.error,
			});
			return 1;
		}

		logger.info("Generating manifests...");
		await synth({
			config: config.data,
			environment: {
				name: "local",
				isK3d: true,
			},
		});
		logger.info("Building images...");
		let manifests: ArrayBuffer;
		try {
			manifests = await $`kbld -f ${OUT_DIR}`.arrayBuffer();
		} catch (e) {
			if (e instanceof $.ShellError) {
				logger.error(e.stderr.toString("utf-8"));
				logger.fatal("Failed to build images from manifests.");
				return 1;
			}
			throw e;
		}

		logger.info("Applying manifests to local cluster...");

		const context = (await $`kubectl config current-context`.text()).trim();
		if (context !== `k3d-${CLUSTER_NAME}`) {
			logger.fatal(`Will not deploy local environment to context: ${context}`);
			return 1;
		}

		const filterJson = {
			not: { and: [{ ops: ["delete"] }, { existingResource: { kinds: ["CustomResourceDefinition"] } }] },
		};
		const filter = `--diff-filter=${JSON.stringify(filterJson)}`;
		try {
			await $`kapp deploy ${filter} -y -a homelab -f - < ${manifests}`;
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

await run(binary(cli), process.argv);
