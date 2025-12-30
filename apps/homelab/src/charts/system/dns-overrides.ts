import { createContext } from "cdk-typed-context";
import { Chart, type ChartProps } from "cdk8s";
import { ConfigMap } from "cdk8s-plus-32";
import type { Construct } from "constructs";
import type { HTTPGateway } from "../../constructs/http-gateway";
import { getServiceHostname } from "../../utils/service";

export const DNSOverridesChartContext = createContext<{ chart: DNSOverridesChart | null }>("DNSOverrides", {
	errorOnMissing: "`DNSOverridesChart` has not been setup for this construct tree.",
});

export function setupDNSOverridesChartContext(scope: Construct) {
	DNSOverridesChartContext.set(scope, { chart: null });
}

export function addDNSOverride(scope: Construct, hostname: string, gateway: HTTPGateway) {
	const ctx = DNSOverridesChartContext.get(scope);
	if (!ctx.chart) {
		throw new Error("`DNSOverridesChart` has not been setup for this construct tree.");
	}
	return ctx.chart.addDNSOverride(hostname, gateway);
}

export class DNSOverridesChart extends Chart {
	configMap: ConfigMap;
	overrides: Set<string> = new Set();

	constructor(scope: Construct, id: string, props: Exclude<ChartProps, "namespace">) {
		super(scope, id, { ...props, namespace: "kube-system" });

		const ctx = DNSOverridesChartContext.get(scope);
		if (ctx.chart) {
			throw new Error("`DNSOverridesChart` has already been setup for this construct tree.");
		}

		ctx.chart = this;

		this.configMap = new ConfigMap(this, "default", {
			metadata: {
				name: "coredns-custom",
				namespace: "kube-system",
			},
		});
	}

	addDNSOverride(hostname: string, gateway: HTTPGateway) {
		if (this.overrides.has(hostname)) {
			return;
		}

		this.overrides.add(hostname);
		this.configMap.addData(
			`${hostname}.override`,
			`rewrite name regex ${hostname.replaceAll(".", "\\.")} ${getServiceHostname(gateway.classes.internal.serviceRef)} answer auto`,
		);
	}
}
