import type { Awaitable } from "@hamishwhc/cdk8s-monorepo-utils/awaitable";
import type { CommonContext, CommonStartupContext } from "@hamishwhc/cdk8s-monorepo-utils/cli-contexts";
import type { ArgTypes, Output } from "@hamishwhc/cdk8s-monorepo-utils/cmd-ts-types";
import type { PickPartial } from "@hamishwhc/cdk8s-monorepo-utils/pick-partial";
import type { App } from "cdk8s";
import { Config as LocalConfig } from "cdk8s-local";

type FeatureToggle<T extends object> = { enabled: false } | ({ enabled: true } & T);

export interface SynthConfig {
	/**
	 * Optional configuration for the generated `cmd-ts` subcommand.
	 */
	command?: {
		/**
		 * @default "synth"
		 */
		name?: string;
		/**
		 * @default "Synthesize the CDK8s app into K8s manifests."
		 */
		description?: string;
	};
}

export interface Config<Arguments extends ArgTypes, Data, LocalArguments extends ArgTypes> {
	/**
	 * `cmd-ts` argument definitions for the CLI. This will be merged with the default arguments provided by `cdk8s-opinionated-cli`,
	 * and passed to your hooks and synth function.
	 *
	 * You can use this to add your own CLI arguments to allow users to configure your CDK8s app generation.
	 *
	 * This can be overridden for local development (in case you need to pass custom configuration for running locally).
	 */
	args?: Arguments;
	/**
	 * A function which synthesizes your CDK8s app. Is expected to return an `App` instance.
	 */
	synth: (ctx: CommonContext<Output<Arguments>, Data>) => Awaitable<App>;

	/**
	 * Optional configuration for the generated `cmd-ts` command.
	 */
	command?: {
		/**
		 * @default "cdk8s-opinionated-cli"
		 */
		name?: string;
		/**
		 * @default "CLI for running CDK8s apps with opinionated defaults."
		 */
		description?: string;
	};

	/**
	 * Configuration for the various subcommands of the CLI. All commands are enabled by default.
	 */
	subcommands: {
		/**
		 * Optional configuration for the `synth` subcommand.
		 */
		synth?: FeatureToggle<SynthConfig>;
		/**
		 * Optional configuration for the `local` command. `args` and `synth` are inherited from the main config,
		 * but can be extended here.
		 */
		local?: FeatureToggle<PickPartial<LocalConfig<LocalArguments, Data, Arguments>, "synth">>;
	};

	/**
	 * These hooks run at various points and allow you to customize the CLI's behavior.
	 *
	 * These will be _replaced_ by any hooks provided for individual subcommands.
	 */
	hooks?: {
		/**
		 * A function that will run immediately on startup, but with access to the parsed CLI arguments.
		 *
		 * You can return custom data that will be passed to subsequent hooks and the synth function.
		 */
		startup?: (ctx: CommonStartupContext<Output<Arguments>>) => Awaitable<Data | void>;
	};
}
