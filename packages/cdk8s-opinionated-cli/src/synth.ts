import type { ArgTypes } from "@hamishwhc/cdk8s-monorepo-utils/cmd-ts-types";
import { logger } from "@hamishwhc/cdk8s-monorepo-utils/logger";
import { $ } from "bun";
import { KbldConfig } from "cdk8s-kbld2";
import { boolean, command, flag, type Runner } from "cmd-ts";
import type { ArgParser } from "cmd-ts/dist/cjs/argparser";
import type { Output } from "cmd-ts/dist/cjs/command";
import type { Aliased, Descriptive, Named, PrintHelp, ProvidesHelp, Versioned } from "cmd-ts/dist/cjs/helpdoc";
import { ConstructOrder } from "constructs";
import { rm } from "fs/promises";
import path from "path";
import type { Config } from "./config";

export const defaultArgs = {
	noBuild: flag({
		type: boolean,
		long: "no-build",
		description: "only synthesise the manifests, do not build resulting manifests with kbld",
	}),
};
export type SynthDefaultArgs = typeof defaultArgs;

export type SynthCommand<Arguments extends ArgTypes> = ArgParser<Output<SynthDefaultArgs & Arguments>> &
	PrintHelp &
	ProvidesHelp &
	Named &
	Runner<Output<SynthDefaultArgs & Arguments>, Promise<number | undefined>> &
	Partial<Versioned & Descriptive & Aliased>;

export async function synthCommand<Arguments extends ArgTypes, Data, LocalArguments extends ArgTypes>(
	config: Config<Arguments, Data, LocalArguments, { local: boolean; synth: true }>,
): Promise<SynthCommand<Arguments>> {
	return command({
		name: config.subcommands.synth?.command?.name ?? "synth",
		description: config.subcommands.synth?.command?.description ?? "Synthesize the CDK8s app into K8s manifests.",
		args: {
			noBuild: flag({
				type: boolean,
				long: "no-build",
				description: "only synthesise the manifests, do not build resulting manifests with kbld",
			}),
			...config.args!,
		},
		async handler(args) {
			const startupCtx = { args, command: "synth" as const };
			const ctx = {
				...startupCtx,
				data: (await config.hooks?.startup?.(startupCtx)) ?? ({} as Data),
			};

			logger.info("Running synth (generating manifests)...");

			const app = await config.synth(ctx);
			await rm(app.outdir, { recursive: true, force: true });
			app.synth();

			if (args.noBuild) {
				logger.info("Synth complete, skipping build, find manifests in " + path.relative(process.cwd(), app.outdir));
				return;
			}

			if (app.node.findAll(ConstructOrder.POSTORDER).find((c) => c instanceof KbldConfig)) {
				logger.info("Detected kbld config construct, running kbld...");
				try {
					const buffer = await $`kbld -f ${app.outdir}`.arrayBuffer();
					process.stdout.write(Buffer.from(buffer));
				} catch (e) {
					if (e instanceof $.ShellError) {
						logger.error(e.stderr.toString("utf-8"));
						logger.fatal("Failed to build images from manifests.");
						return 1;
					}
					throw e;
				}
			}
		},
	});
}
