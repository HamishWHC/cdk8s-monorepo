import type { ArgTypes } from "@repo/utils/cmd-ts-types";
import { logger } from "@repo/utils/logger";
import { $ } from "bun";
import { KbldConfig } from "cdk8s-kbld2";
import { binary, boolean, command, flag, run, type Runner, subcommands } from "cmd-ts";
import type { ArgParser } from "cmd-ts/dist/cjs/argparser";
import type { Aliased, Descriptive } from "cmd-ts/dist/cjs/helpdoc";
import { ConstructOrder } from "constructs";
import { rm } from "fs/promises";
import path from "path";
import type { Config } from "./config";

export async function cdk8sOpinionatedCliCommand<Arguments extends ArgTypes, Data, LocalArguments extends ArgTypes>(
	config: Config<Arguments, Data, LocalArguments>,
) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const cmds: Record<string, ArgParser<any> & Runner<any, any> & Partial<Descriptive & Aliased>> = {};

	if (config.subcommands.local?.enabled !== false) {
		const { cdk8sLocalCommand } = await import("cdk8s-local");
		const cmd = cdk8sLocalCommand<Arguments & LocalArguments, Data>({
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
		cmds["local"] = cmd;
	}

	if (config.subcommands.synth?.enabled !== false) {
		cmds["synth"] = command({
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
	return await run(binary(cmd), process.argv);
}
