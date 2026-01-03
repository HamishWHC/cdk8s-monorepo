import type { Awaitable } from "@repo/utils/awaitable";
import type { CommonContext, CommonStartupContext } from "@repo/utils/cli-contexts";
import type { ArgTypes, Output } from "@repo/utils/cmd-ts-types";
import type { PickPartial } from "@repo/utils/pick-partial";
import type { App } from "cdk8s";
import { Config as LocalConfig } from "cdk8s-local/config";

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
	 */
	hooks?: {
		/**
		 * A function that will run immediately on startup, but with access to the parsed CLI arguments.
		 *
		 * You can return an updated context if you want to modify the arguments or add custom data.
		 */
		startup?: (ctx: CommonStartupContext<Output<Arguments>>) => Awaitable<Data | void>;
	};
}
