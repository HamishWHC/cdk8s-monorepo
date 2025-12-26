import { Secret } from "cdk8s-plus-32";
import type { Construct } from "constructs";
import type { ClusterIssuerSpecAcmeSolversDns01 } from "../imports/cert-manager.io";
import type { DNSCredentials } from "../schema/config/dns";

const DNS_PROVIDERS = {
	cloudflare: {
		solver: (scope, { apiToken }) => {
			const secret = new Secret(scope, "cloudflare-credentials", {
				type: "Opaque",
				stringData: {
					apiToken,
				},
			});

			return {
				cloudflare: {
					apiTokenSecretRef: {
						name: secret.name,
						key: "apiToken",
					},
				},
			};
		},
		externalDNS: (_scope, { apiToken }) => {
			return { env: [{ name: "CF_API_TOKEN", value: apiToken }], volumes: [], mounts: [], extraArgs: [] };
		},
	},
} satisfies {
	[P in DNSCredentials as P["provider"]]: {
		solver(scope: Construct, credentials: P): ClusterIssuerSpecAcmeSolversDns01;
		externalDNS(
			scope: Construct,
			credentials: P,
		): { env: { name: string; value: string }[]; volumes: unknown[]; mounts: unknown[]; extraArgs: string[] };
	};
};

export const makeSolver = (scope: Construct, credentials: DNSCredentials) => {
	// The never cast here is annoying, but correlated union types are not handled well by TS.
	return DNS_PROVIDERS[credentials.provider].solver(scope, credentials as never);
};

export const makeExternalDNS = (scope: Construct, credentials: DNSCredentials) => {
	// The never cast here is annoying, but correlated union types are not handled well by TS.
	return {
		...DNS_PROVIDERS[credentials.provider].externalDNS(scope, credentials as never),
		provider: credentials.provider,
	};
};
