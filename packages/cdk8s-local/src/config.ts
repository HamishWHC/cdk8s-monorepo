import type { Awaitable } from "@repo/utils/awaitable";
import type { CommonContext, CommonStartupContext } from "@repo/utils/cli-contexts";
import type { ArgTypes, Output } from "@repo/utils/cmd-ts-types";
import type { App } from "cdk8s";
import type { DefaultArgs } from "./default-args";
import type { K3dConfig } from "./k3d-config";
import type { RequiredProgram } from "./requirements";

export interface StartupContext<Args> extends CommonStartupContext<Args, "local"> {}
export interface Context<Args, Data> extends CommonContext<Args, Data, "local"> {}

export interface SynthContext<Args, Data> extends Context<Args, Data> {
	/**
	 * Indicates whether the k3d cluster was created during this run.
	 */
	create: boolean;
	/**
	 * Information about the k3d local registry.
	 */
	registry: {
		name: string;
		port: number;
	} | null;
}

export interface Config<Arguments extends ArgTypes, Data, ParentArguments extends ArgTypes = {}> {
	/**
	 * `cmd-ts` argument definitions for the CLI. This will be merged with the default arguments provided by `cdk8s-local`,
	 * and passed to your hooks and synth function.
	 *
	 * You can use this to add your own CLI arguments to allow users to configure your CDK8s app generation.
	 */
	args?: Arguments;
	/**
	 * A function which synthesizes your CDK8s app. Is expected to return an `App` instance.
	 */
	synth: (ctx: SynthContext<Output<Arguments & ParentArguments & DefaultArgs>, Data>) => Awaitable<App>;

	/**
	 * Optional configuration for the generated `cmd-ts` command.
	 */
	command?: {
		/**
		 * @default "local"
		 */
		name?: string;
		/**
		 * @default "Synthesises, builds and deploys your CDK8s app to a local k3d cluster."
		 */
		description?: string;
	};

	/**
	 * The name of the k3d cluster to create/use.
	 *
	 * This is used during cluster creation and when checking for an existing cluster,
	 * so it is specified separately from the other k3d configuration.
	 * You can still dynamically generate it if you want.
	 *
	 * @default "cdk8s-local"
	 */
	clusterName?: string | ((ctx: Context<Output<Arguments & ParentArguments & DefaultArgs>, Data>) => Awaitable<string>);
	/**
	 * k3d configuration.
	 */
	k3d?: K3dConfig | ((ctx: Context<Output<Arguments & ParentArguments & DefaultArgs>, Data>) => Awaitable<K3dConfig>);

	/**
	 * Programs used under the hood by your CDK8s app which must be installed for the CLI to work.
	 * This is in addition to the default required programs used by `cdk8s-local`.
	 *
	 * e.g. If you are using `Helm` constructs in your app, you should add `helm` here.
	 */
	requirements?:
		| RequiredProgram[]
		| ((ctx: StartupContext<Output<Arguments & ParentArguments & DefaultArgs>>) => Awaitable<RequiredProgram[]>);

	/**
	 * These hooks run at various points and allow you to customize the CLI's behavior.
	 */
	hooks?: {
		/**
		 * A function that will run immediately on startup, but with access to the parsed CLI arguments.
		 *
		 * You can return an updated context if you want to modify the arguments or add custom data.
		 */
		startup?: (ctx: StartupContext<Output<Arguments & ParentArguments & DefaultArgs>>) => Awaitable<Data | void>;
		/**
		 * A function that will run just before synthesis. If you are using `cdk8s-local`, you probably don't need this,
		 * but you may want to use it with `cdk8s-opinionated-cli`, so you can use a common synth function.
		 *
		 * You can return an updated context if you want to modify the arguments or add custom data.
		 */
		preSynth?: (ctx: SynthContext<Output<Arguments & ParentArguments & DefaultArgs>, Data>) => Awaitable<Data | void>;
	};
}
