---
"cdk8s-opinionated-cli": minor
"cdk8s-local": patch
---

Changed `cdk8sOpinionatedCliCommand` to return the command object, so that it can be integrated into a `cmd-ts` `subcommands` function alongside other commands.
