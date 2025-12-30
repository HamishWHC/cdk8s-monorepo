import type { ArgTypes } from "@repo/utils/cmd-ts-types";
import { binary, run, type Runner, subcommands } from "cmd-ts";
import type { Named } from "cmd-ts/dist/cjs/helpdoc";
import type { Config } from "./config";

export async function cdk8sOpinionatedCliCommand<Arguments extends ArgTypes, Data, LocalArguments extends ArgTypes>(
	config: Config<Arguments, Data, LocalArguments>,
) {
	const cmds: Record<string, Runner<unknown, unknown> & Named> = {};

	if (config.local?.enabled) {
		const { cdk8sLocalCommand } = await import("cdk8s-local");
		cdk8sLocalCommand<Arguments & LocalArguments, Data>({
			synth: config.synth,
			args: {
				...config.args!,
				...config.local.args!,
			},
			...config.local,
		});
	}

	return subcommands({
		name: config.command?.name ?? "cdk8s-opinionated-cli",
		description: config.command?.description ?? "CLI for running CDK8s apps with opinionated defaults.",
		cmds,
	});
}

export async function cdk8sOpinionatedCli<Arguments extends ArgTypes, Data, LocalArguments extends ArgTypes>(
	config: Config<Arguments, Data, LocalArguments>,
) {
	const cmd = await cdk8sOpinionatedCliCommand(config);
	return await run(binary(cmd), process.argv.slice(2));
}
