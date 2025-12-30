import { assert } from "@repo/utils/assert";
import { logger } from "@repo/utils/logger";
import { cdk8sLocal } from "cdk8s-local";
import { option, optional } from "cmd-ts";
import path from "path";
import { synth } from ".";
import { Config, exportConfigJsonSchema, type RawConfig } from "./schema/config";
import { ConfigArg, findFirstConfig } from "./utils/config-arg";
import { joinHostname } from "./utils/hostnames";
import { APP_ROOT } from "./utils/paths";

await cdk8sLocal({
	clusterName: "homelab-dev",
	args: {
		env: option({
			type: optional(ConfigArg),
			long: "env",
			short: "e",
			description:
				"environment config to use during generation, config will be loaded from `config.<env>.<yaml|yml|json>`",
		}),
	},
	command: {
		name: "bun local",
		description: "CLI for locally running the homelab cluster.",
	},
	k3d: {
		servers: 3,
		configureCilium: true,
		disableTraefik: true,
		volumes: [
			{
				hostPath: path.join(APP_ROOT, ".k3d"),
				containerPath: "/var/lib/rancher/k3s/storage",
				deleteOnClusterCreate: true,
			},
			{
				hostPath: APP_ROOT,
				containerPath: "/workspace",
			},
		],
		ports: [
			{
				containerPort: 80,
				hostPort: 8080,
			},
			{
				containerPort: 443,
				hostPort: 8443,
			},
		],
	},
	hooks: {
		startup: async (ctx) => {
			await exportConfigJsonSchema();
			return { env: ctx.args.env ?? (await findFirstConfig()) };
		},
	},
	async synth({ data: { env }, registry }) {
		assert(registry !== null, "Registry information is required during synth");

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
				destination: `${registry.name}:${registry.port}`,
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
			throw new Error("Invalid local configuration");
		}

		return await synth({
			config: config.data,
			environment: {
				name: "local",
				isK3d: true,
			},
		});
	},
});
