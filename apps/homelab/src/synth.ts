import { checkRequirements, DEFAULT_REQUIREMENTS } from "cdk8s-local/requirements";
import { binary, command, option, optional, run } from "cmd-ts";
import { synth } from ".";
import { exportConfigJsonSchema } from "./schema/config";
import { ConfigArg, findFirstConfig } from "./utils/config-arg";

const cli = command({
	name: "bun synth",
	description: "CLI for generation of CTF infrastructure manifests.",
	args: {
		env: option({
			type: optional(ConfigArg),
			long: "env",
			short: "e",
			description:
				"environment config to use during generation, config will be loaded from `config.<env>.<yaml|yml|json>`",
		}),
	},
	handler: async ({ env }) => {
		await exportConfigJsonSchema();

		if (!env) {
			env = await findFirstConfig();
		}
		const { name, config } = env;

		await checkRequirements(DEFAULT_REQUIREMENTS);

		synth({
			config,
			environment: {
				name,
				isK3d: false,
			},
		});
	},
});

await run(binary(cli), process.argv);
