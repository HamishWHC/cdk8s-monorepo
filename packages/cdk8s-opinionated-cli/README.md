# cdk8s-opinionated-cli

**TLDR: A function to wrap your cdk8s app with a CLI interface that allows for passing custom command line arguments.**

Whenever I use cdk8s, I find myself writing a simple CLI tool that runs a cdk8s synth but allows me to pass custom command line arguments to modify the behaviour of my app, such as passing a config file or environment name. So this package provides a function to do just that, with minimal boilerplate.

In addition, the CLI wrapper includes support for [`cdk8s-local`](../cdk8s-local/README.md) and [`cdk8s-kbld2`](../cdk8s-kbld2/README.md) out of the box, so you can easily run your cdk8s apps locally or run your manifests through `kbld` after synth automatically.

```sh
# Note: only bun is currently supported as I use `bun` to run shell commands (`kbld`) internally.
bun i cdk8s-opinionated-cli
```

```ts
import { App } from "cdk8s";
import { cdk8sOpinionatedCli } from "cdk8s-opinionated-cli";
import { option, optional, string } from "cmd-ts";
import { YourConstruct } from "./your-code";

await cdk8sOpinionatedCli({
	args: {
		someCustomArg: option({
			type: optional(string),
			long: "some-custom-arg",
			short: "a",
			description: "a custom argument you can use for whatever you want, i usually use one to select a config file.",
		}),
	},
	async synth({ args: { someCustomArg } }) {
		// In this function, construct your app as usual, and return the final app instance.
		const app = new App();

		new YourConstruct(app, {
			someCustomArg,
		});

		return app;
	},
});
```

You can then synthesise your cdk8s app like so:

```
bun cli.ts synth --some-custom-arg value
```

Or deploy it locally, with:

```
bun cli.ts local --some-custom-arg value
```

## cdk8s-kbld2 Integration

If a `KbldConfig` construct is detected in your app, `kbld` will be automatically run against your app's generated manifests, and the resulting manifests will be dumped to stdout.

## cdk8s-local Integration

You can specify `cdk8s-local` configuration under `subcommands.local`. The configuration is the same as `cdk8s-local`'s, except you can omit the `synth` function from the `local` config. Alternatively, you can specify a `synth` function that is only to be used for local development. See [`cdk8s-local`](../cdk8s-local/README.md) for documentation.
