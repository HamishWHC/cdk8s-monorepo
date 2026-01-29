# cdk-typed-context

**TLDR: A package that adds strongly typed contexts to `constructs`.**

Whenever I use cdk8s, I use `getContext`/`setContext` to manage a lot of global configuration and other contexts. Unfortunately, these context values are by default all untyped, so this package adds a lightweight wrapper around `constructs`' `Node` context methods to provide strongly typed contexts.

```bash
# or bun, yarn, pnpm, etc.
npm i cdk-typed-context
```

```ts
// env-context.ts
import { createContext } from "cdk-typed-context";

export const EnvContext = createContext<{ region: string; accountId: string }>("env", {
    errorOnMissing: "An environment has not been provided.",
});

// app.ts
EnvContext.set(this, {
    region: "us-east-1",
    accountId: "123456789012",
});

// some-child-construct.ts
const env = EnvContext.get(this)

new Deployment(this, "example-deployment", {
    containers: [
        {
            image: "some-image",
            envVariables: {
                REGION: { value: env.region },
                ACCOUNT_ID: { value: env.accountId },
            }
        },
    ]
})
```