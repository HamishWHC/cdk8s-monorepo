# My CDK8s Monorepo

This repository is my monorepo for my projects (currently just my homelab) using [CDK8s](https://cdk8s.io/).
I'm using this to develop a series of opinionated tools and libraries around CDK8s that I continually find myself re-creating for each project.

> I currently exclusively use Bun for these projects as it allows the use of TypeScript without the headaches I get from Node.js, tsx, etc, especially when I want to be able to use workspace dependencies without needing to run build steps before changes are reflected in dependents.
> This works well for CDK8s projects as they typically only run locally or in CI/CD/GitOps environments, so we can (typically) use whatever runtime we like.
> Feel free to submit PRs if you need support for other JS engines/runtimes, but my focus is on Bun.

## Public Packages

- [cdk-typed-context](./packages/cdk-typed-context) - A library for any `constructs` based project for strongly typed contexts. I use this in all my CDK8s/AWS CDK projects to provide type-safe context values, like global configuration, environment context, parent constructs, etc.
- [cdk8s-kbld2](./packages/cdk8s-kbld2) - A CDK8s construct for [kbld](https://carvel.dev/kbld/) to enable emitting a `kbld` configuration alongside your CDK8s manifests, so you can pipe your output directly into `kbld` for image locking and building. This avoids the need for building images _during_ the CDK8s synthesis step, like in `cdk8s-image`.
- [cdk8s-local](./packages/cdk8s-local) - A library for wrapping your CDK8s app with local development tooling, enabling deploying your app to a [`k3d`](https://k3d.io/) cluster with automatic image building with `kbld`, pushing to local registry, and deploying to the local cluster with [`kapp`](https://carvel.dev/kapp/).
- [cdk8s-opinionated-cli](./packages/cdk8s-opinionated-cli) - A library for wrapping your CDK8s apps with an opinionated CLI for synthesis, image building, deploying. It also includes `cdk8s-local` for local development support.

## Private Packages

- [@repo/utils](./packages/utils) - A collection of utilities used throughout this repository.
- [@repo/typescript-config](./packages/typescript-config) - Shared TypeScript configuration for all packages in this monorepo.
- [@repo/eslint-config](./packages/eslint-config) - Shared ESLint configuration for all packages in this monorepo.
