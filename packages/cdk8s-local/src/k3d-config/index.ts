import type { Awaitable } from "@repo/utils/awaitable";
import { YAML } from "bun";
import { randomRegistryName } from "../random-registry-name";
import type { K3DSimpleConfigV1Alpha5, NodeFilters } from "./v1alpha5";

export type K3dSimpleConfig = K3DSimpleConfigV1Alpha5;

export interface BindMountVolume {
	hostPath: string;
	containerPath: string;
	/**
	 * If enabled, the host path will be deleted similarly to `rm -rf` on cluster creation.
	 * @default false
	 */
	deleteOnClusterCreate?: boolean;
	/**
	 * Node filters to determine which cluster nodes this volume applies to.
	 * @example ["server:0", "agent:*"]
	 * @default ["all"]
	 */
	nodeFilters?: NodeFilters;
}

export interface Port {
	hostPort: number;
	containerPort: number;
	/**
	 * Node filters to determine which cluster nodes this port mapping applies to.
	 * Note that the default for port mappings is different to other items, as typically
	 * port mappings are only needed on the loadbalancer node.
	 *
	 * @example ["server:0", "agent:*"]
	 * @default ["loadbalancer"]
	 */
	nodeFilters?: NodeFilters;
}

export interface EnvironmentVariable {
	name: string;
	value: string;
	/**
	 * Node filters to determine which cluster nodes this environment variable applies to.
	 * @example ["server:0", "agent:*"]
	 * @default ["all"]
	 */
	nodeFilters?: NodeFilters;
}

export interface K3sArg {
	arg: string;
	/**
	 * Node filters to determine which cluster nodes this k3s arg applies to.
	 * @example ["server:0", "agent:*"]
	 * @default ["all"]
	 */
	nodeFilters?: NodeFilters;
}

export interface K3dConfig {
	/**
	 * Number of server nodes in the k3d cluster.
	 * Note that the default of 1 disables etcd and the ability to add additional servers later.
	 * See https://k3d.io/stable/usage/multiserver/#adding-server-nodes-to-a-running-cluster.
	 * @default 1
	 */
	servers?: number;
	/**
	 * Number of agent nodes in the k3d cluster.
	 * @default undefined
	 */
	agents?: number;

	/**
	 * Bind mount volumes to add to the k3d cluster on creation.
	 *
	 * Useful for inspecting PVCs and enabling code reloading by mounting source code into pods.
	 *
	 * @example
	 * - Inspecting PVCs when using the built-in local-path provisioner:
	 *   ```ts
	 *   {
	 *     hostPath: path.join(YOUR_REPO_DIR, ".k3d"),
	 *     containerPath: "/var/lib/rancher/k3s/storage",
	 *     deleteOnClusterCreate: true,
	 *   }
	 *   ```
	 * - Mounting source code into pods for code reloading:
	 *   ```ts
	 *   {
	 *     hostPath: YOUR_REPO_DIR,
	 *     containerPath: "/workspace",
	 *   }
	 *   ```
	 *   You can then use `hostPath` mounts to mount sub-directories of `/workspace` into your pods as needed.
	 *
	 * @default []
	 */
	volumes?: BindMountVolume[];
	/**
	 * Port mappings to add to the k3d cluster nodes on creation.
	 */
	ports?: Port[];
	/**
	 * Environment variables to add to the k3d cluster nodes on creation.
	 */
	env?: EnvironmentVariable[];

	/**
	 * The name of the k3d registry container.
	 * The default will resolve to localhost, allowing `kbld` (or yourself) to
	 * `docker push` images to it from your local machine without host file or other configuration changes.
	 * See https://k3d.io/stable/usage/registries/#secure-registries for more information.
	 *
	 * If you want to use a more complicated registry configuration (e.g. using an existing registry, a proxy or mirrors)
	 * or simply don't want to run a local registry, you can set this to `null`
	 * and instead use `config` to provide custom k3d registry settings.
	 *
	 * Security note: consider setting up your own DNS A wildcard record on your own domain (e.g. `*.k3d.example.com`)
	 * pointing to 127.0.0.1, to avoid DNS rebinding attacks.
	 *
	 * @default "registry-${random-hex}.k3d.hamishwhc.com"
	 */
	// TODO: Consider persisting a k3d-managed registry between runs instead of creating a new one per cluster.
	registryName?: string | null;

	/**
	 * If enabled, k3d will be configured in a way that is compatible with Cilium networking.
	 * This involves disabling the default flannel network plugin and network policy engine,
	 * and pre-configuring some volumes required by Cilium within the k3d docker containers.
	 * More information can be found in source code comments.
	 *
	 * Once the cluster is created, your CDK8s app is still responsible for installing and configuring Cilium itself.
	 *
	 * This is not supported on Windows Subsystem for Linux (WSL) at this time and a warning
	 * will be logged if set to true on WSL.
	 * The warning can be silenced by using the `isWsl` variable exported from this package
	 * to conditionally set this value to false on WSL environments.
	 *
	 * @default false
	 */
	configureCilium?: boolean;

	/**
	 * If enabled, Traefik will be disabled in the K3s cluster using the K3s argument `--disable=traefik`.
	 */
	disableTraefik?: boolean;
	/**
	 * If enabled, ServiceLB will be disabled in the K3s cluster using the K3s argument `--disable=servicelb`.
	 */
	disableServiceLB?: boolean;
	/**
	 * Additional K3s arguments to pass to each k3d cluster node on creation.
	 */
	k3sExtraArgs?: (string | K3sArg)[];

	/**
	 * In the event you want to set other k3d cluster options, you can read/add to/modify/override any and all of the k3d config here.
	 * This function receives the config generated by `cdk8s-local` and you can modify (or replace) it as needed.
	 * This is only used during cluster creation.
	 * I make no guarantees that your custom config will work with `cdk8s-local`, so use this with caution.
	 * Note that the current config version supported by the types is `k3d.io/v1alpha5`.
	 *
	 * Generally, would recommend using only for adding k3d/K3s options not covered by the convenience options available in this package.
	 */
	config?: (c: K3DSimpleConfigV1Alpha5) => Awaitable<string | K3dSimpleConfig>;
}

export async function resolveK3dConfig(name: string, config: K3dConfig | undefined): Promise<string> {
	const configFile: K3DSimpleConfigV1Alpha5 = {
		apiVersion: "k3d.io/v1alpha5",
		kind: "Simple",
		metadata: { name },
		servers: config?.servers ?? 1,
		agents: config?.agents ?? undefined,
		volumes:
			config?.volumes?.map(({ hostPath, containerPath, nodeFilters }) => ({
				volume: `${hostPath}:${containerPath}`,
				nodeFilters: nodeFilters ?? ["all"],
			})) ?? [],
		ports:
			config?.ports?.map(({ hostPort, containerPort, nodeFilters }) => ({
				port: `${hostPort}:${containerPort}`,
				nodeFilters: nodeFilters ?? ["loadbalancer"],
			})) ?? [],
		registries:
			config?.registryName !== null
				? {
						create: {
							name: config?.registryName || randomRegistryName(),
						},
					}
				: undefined,
		env: config?.env?.map(({ name, value, nodeFilters }) => ({ envVar: `${name}=${value}`, nodeFilters })) ?? [],
		options: {
			k3s: {
				extraArgs: [
					...(config?.configureCilium ? ["--flannel-backend=none", "--disable-network-policy"] : []),
					...(config?.k3sExtraArgs ?? []),
					...(config?.disableTraefik ? ["--disable=traefik"] : []),
					...(config?.disableServiceLB ? ["--disable=servicelb"] : []),
				].map((arg) =>
					typeof arg === "string" ? { arg, nodeFilters: ["all"] } : { ...arg, nodeFilters: arg.nodeFilters ?? ["all"] },
				),
			},
		},
	};

	let resolvedConfig = config?.config ? await config?.config(configFile) : configFile;
	if (typeof resolvedConfig !== "string") {
		resolvedConfig = YAML.stringify(resolvedConfig, null, 2);
	}

	return resolvedConfig;
}
