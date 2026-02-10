import type { ArgTypes } from "@hamishwhc/cdk8s-monorepo-utils/cmd-ts-types";
import { binary, run, subcommands } from "cmd-ts";
import type { AnyEnabledCommands, Config } from "./config";
import { localCommand, type LocalCommand } from "./local";
import { synthCommand, type SynthCommand } from "./synth";

export type { Config } from "./config";

export type Commands<
	Arguments extends ArgTypes,
	LocalArguments extends ArgTypes,
	EnabledCommands extends AnyEnabledCommands,
> = {
	[K in keyof EnabledCommands as EnabledCommands[K] extends false ? never : K]: K extends "local"
		? LocalCommand<Arguments & LocalArguments>
		: K extends "synth"
			? SynthCommand<Arguments>
			: never;
};

export async function cdk8sOpinionatedCliCommands<
	Arguments extends ArgTypes,
	Data,
	LocalArguments extends ArgTypes,
	EnabledCommands extends AnyEnabledCommands,
>(
	config: Config<Arguments, Data, LocalArguments, EnabledCommands>,
): Promise<Commands<Arguments, LocalArguments, EnabledCommands>> {
	return {
		...(config.subcommands.local?.enabled === true
			? {
					local: await localCommand(config as Config<Arguments, Data, LocalArguments, { local: true }>),
				}
			: {}),
		...(config.subcommands.synth?.enabled !== false
			? {
					synth: await synthCommand(config as Config<Arguments, Data, LocalArguments, { synth: true }>),
				}
			: {}),
	} as Commands<Arguments, LocalArguments, EnabledCommands>;
}

export async function cdk8sOpinionatedCli<
	Arguments extends ArgTypes,
	Data,
	LocalArguments extends ArgTypes,
	EnabledCommands extends { local: boolean; synth: boolean },
>(config: Config<Arguments, Data, LocalArguments, EnabledCommands>) {
	const cmd = subcommands({
		name: config.command?.name ?? "cdk8s-opinionated-cli",
		description: config.command?.description ?? "CLI for running CDK8s apps with opinionated defaults.",
		cmds: await cdk8sOpinionatedCliCommands(config),
	});
	return await run(binary(cmd), process.argv);
}
