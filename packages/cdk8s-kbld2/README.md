# cdk8s-kbld2

**TLDR: A cdk8s construct for `kbld` configurations.**

Whenever I use cdk8s, I always need to build and push my container images to a registry. Currently, [`cdk8s-image`](https://github.com/cdk8s-team/cdk8s-image) enables building and pushing images _while generating manifests_. This causes side effects while generating configuration, which I've never been a massive fan of, but it is also limited by cdk8s' non-concurrent model, preventing building and/or pushing images in parallel (or using build tools other than Docker!).

There's a tool that does all this already (plus resolving and locking to digests, among other benefits): [`kbld`](https://github.com/carvel-dev/kbld)

`kbld` allows you to, with a single configuration file, find, build, push and resolve all the image references in your manifests. But that would require me to write a config file: ridiculous! So here's a cdk8s construct for `kbld` configurations that I can produce alongside all my other manifests.

```bash
# or bun, yarn, pnpm, etc.
npm i cdk8s-kbld2
```

```ts
import { KbldConfig } from "cdk8s-kbld2";

// ...

new Deployment(this, "example-deployment", {
	containers: [
		{
			image: "some-image-name",
			// ...
		},
		{
			image: "nginx:latest",
			// ...
		},
	],
});

new KbldConfig(this, "kbld", {
	sources: [
		{
			image: "some-image-name",
			path: "/path/to/build/context",
		},
	],
	destinations: [
		{
			image: "some-image-name",
			newImage: "ghcr.io/your-username/some-image-name",
		},
	],
});
```

<details>
<summary>Expand to see what the above produces...</summary>

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: simple-example-deployment-c81d9144
spec:
  minReadySeconds: 0
  progressDeadlineSeconds: 600
  replicas: 2
  selector:
    matchLabels:
      cdk8s.io/metadata.addr: simple-example-deployment-c8904b4a
  strategy:
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 25%
    type: RollingUpdate
  template:
    metadata:
      labels:
        cdk8s.io/metadata.addr: simple-example-deployment-c8904b4a
    spec:
      automountServiceAccountToken: false
      containers:
        - image: some-image-name
          imagePullPolicy: Always
          name: main
          resources:
            limits:
              cpu: 1500m
              memory: 2048Mi
            requests:
              cpu: 1000m
              memory: 512Mi
          securityContext:
            allowPrivilegeEscalation: false
            privileged: false
            readOnlyRootFilesystem: true
            runAsNonRoot: true
        - image: nginx:latest
          imagePullPolicy: Always
          name: main
          resources:
            limits:
              cpu: 1500m
              memory: 2048Mi
            requests:
              cpu: 1000m
              memory: 512Mi
          securityContext:
            allowPrivilegeEscalation: false
            privileged: false
            readOnlyRootFilesystem: true
            runAsNonRoot: true
      dnsPolicy: ClusterFirst
      hostNetwork: false
      restartPolicy: Always
      securityContext:
        fsGroupChangePolicy: Always
        runAsNonRoot: true
      setHostnameAsFQDN: false
      shareProcessNamespace: false
      terminationGracePeriodSeconds: 30
---
apiVersion: kbld.k14s.io/v1alpha1
kind: Config
metadata:
  name: simple-example-kbld-c80df986
destinations:
  - image: some-image-name
    newImage: ghcr.io/your-username/some-image-name
sources:
  - image: some-image-name
    path: /path/to/build/context
```

</details>

## Contributions and Roadmap

If you find a bug (fairly likely given the type definitions were translated from the `kbld` docs - carvel team, _please_ use JSON schema, ty) please do post an issue or make a PR.

I have plans to add a resolver and/or a higher-level construct to avoid the need to even think much about the `kbld` config, but will be experimenting with this on my homelab manifests before beginning on that.

## Why is there a 2?

During a [CTF competition](<https://en.wikipedia.org/wiki/Capture_the_flag_(cybersecurity)>), I published a package containing code to exploit a CSP vulnerability to my NPM account as part of a solution. The original `cdk8s-kbld2` was under the same account. My NPM account was soon banned (and _every_ package under my account removed). In hindsight, should've used a throwaway account, but oh well. I could re-register the account name but the package name is forever taken :/
