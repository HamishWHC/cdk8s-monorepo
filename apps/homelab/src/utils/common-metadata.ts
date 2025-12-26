// export const getDNSHostname = (scope: Construct) => {
// 	const config = getContext(scope, "config");
// 	return `ingress.internal.${config.domains[0].domain}`;
// };
// export const getDNSNameserverHostnames = (scope: Construct) => {
// 	const config = getContext(scope, "config");
// 	return config.domains.flatMap((d) => [`ns.${d.domain}`, `ns1.${d.domain}`, `ns2.${d.domain}`]);
// };

// export const commonAnnotations = {
//     dns: (scope: Construct, domains: string[]): Record<string, string> => {
//         const config = getContext(scope, "config");
//         if (!config.dns.enable) return {};
//         return {
//             "external-dns.alpha.kubernetes.io/hostname": domains.join(","),
//             "external-dns.alpha.kubernetes.io/target": config.dns.externalIP,
//             "external-dns.alpha.kubernetes.io/ttl": "60",
//         };
//     },
// };

const LABEL_BASE = "kube.homelab.hamishwhc.com";

export const commonLabels = {
	cdk: () => ({ [`${LABEL_BASE}/cdk8s-managed`]: "true" as const }),
	// layer: <T extends string>(layer: T) => ({ [`${LABEL_BASE}/layer`]: layer }),
	// metrics: <T extends string>(name: T) => ({ [`${LABEL_BASE}/metrics`]: name }),
};
