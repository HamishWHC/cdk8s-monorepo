import type { ArgTypes } from "@hamishwhc/cdk8s-monorepo-utils/cmd-ts-types";
import { cdk8sLocalCommand } from "cdk8s-local";
import type { Config } from "./config";

export type { Command as LocalCommand } from "cdk8s-local";

export async function localCommand<Arguments extends ArgTypes, Data, LocalArguments extends ArgTypes>(
	config: Config<Arguments, Data, LocalArguments, { local: true; synth: boolean }>,
) {
	return cdk8sLocalCommand<Arguments & LocalArguments, Data>({
		synth: config.synth,
		...config.subcommands.local,
		args: {
			// Spreading `undefined` is safe and results in no additional arguments, which is the expected behaviour.
			...config.args!,
			// eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
			...config.subcommands.local?.args!,
		},
		hooks: {
			...config.hooks,
			...config.subcommands.local?.hooks,
		},
	});
}
