# cdk8s-local

**TLDR: A function to wrap your cdk8s app with a CLI interface that enables quick deploying to a local k3d cluster.**

Whenever I use cdk8s, I find myself writing a simple CLI tool that synthesises my app, builds the container images and deploys it to a local k3d cluster, so I can test my changes quickly. So this package provides a function to do just that, with minimal boilerplate.

In addition, the CLI wrapper includes support for [`cdk8s-kbld2`](../cdk8s-kbld2/README.md) out of the box, so you can easily run your manifests through `kbld` after synth automatically.

```sh
# Note: only bun is currently supported as I use `bun` to run shell commands (`kbld`, `kapp`, `k3d`, etc) internally.
bun i cdk8s-local
```

```ts
import { App } from "cdk8s";
import { cdk8sLocal } from "cdk8s-local";
import { option, optional, string } from "cmd-ts";
import { YourConstruct } from "./your-code";

await cdk8sLocal({
	args: {
		someCustomArg: option({
			type: optional(string),
			long: "some-custom-arg",
			short: "a",
			description: "a custom argument you can use for whatever you want, i usually use one to select a config file.",
		}),
	},
	async synth({ args: { someCustomArg }, registry }) {
		// In this function, construct your app as usual, and return the final app instance.
		const app = new App();

		new YourConstruct(app, {
			someCustomArg,
			registry,
		});

		return app;
	},
	k3d: {
		// k3d cluster configuration can be customised here:
		servers: 3,
		ports: [
			{
				containerPort: 80,
				hostPort: 8080,
			},
			{
				containerPort: 443,
				hostPort: 8443,
			},
		],
		// Some convenience options I find useful have been added:
		configureCilium: true,
		disableTraefik: true,
	},
});
```

You can then deploy your app locally with:

```
bun local.ts --some-custom-arg value
```

> The wrapper depends on some CLI tools being available on your PATH, primarily `k3d`, `kapp`, `kbld` (even if you don't use `cdk8s-kbld2` or the image build step, sorry), `kubectl` and `docker`. The wrapper will check for these and throw an error if they are not found.

## cdk8s-kbld2 Integration

If a `KbldConfig` construct is detected in your app, `kbld` will be automatically run against your app's generated manifests, and the resulting manifests will be dumped to stdout.

## Local Registry

By default, a local registry will be created by k3d for you to push your images to. This registry is passed to your `synth` function so you can push images to it (e.g. with `cdk8s-kbld2` - or `cdk8s-image` if you really want to).

> Security note: This package uses a subdomain of `k3d.hamishwhc.com`, which resolves to localhost, as the name of the local registry. There _is_ potential here for me to swap the DNS record out from under you in a DNS rebinding attack - if you are concerned, you can set up your own DNS entry that resolves to localhost and pass that in via `k3d.registryName`. See [the related k3d documentation](https://k3d.io/v5.1.0/usage/registries/#preface-referencing-local-registries) - this is a method of achieving option 2 here, without needing to modify `/etc/hosts`.

## Configuration

All configuration options include documentation within the property descriptions, so you can hover over them in your IDE to see what they do.

Some convenience options have been added to the `k3d` configuration to make local development easier. The most notable is `configureCilium`, which sets up k3d as compatible with Cilium by disabling the default CNI and network policies, and then running some ✨ magic ✨ `docker` commands (note that magic here means that I do not understand what the f\*ck they are doing but they do seem to work for me). This option may be rather brittle, so if you run into issues please open an issue or PR!
