import type { Construct } from "constructs";
import { getConfig, type Config } from "../schema/config";

export function canoniseHostname(scope: Construct, hostname: string) {
	const config = getConfig(scope);
	const domains = Object.values(config.domains).map((d) => d.domain);
	if (domains.some((d) => hostname === d)) {
		return {
			canonical: hostname,
		};
	}

	if (!domains.some((d) => hostname.endsWith(`.${d}`))) {
		throw new Error(`Hostname ${hostname} is not a subdomain of any configured domain: ${domains.join(", ")}`);
	}

	const segments = hostname.split(".");
	segments[0] = "*";
	return {
		canonical: segments.join("."),
		parent: segments.slice(1).join("."),
	};
}

export function hostnameToLabelPart(hostname: string) {
	return hostname.replace(/\*/g, "star").replace(/\./g, "-");
}

export function joinHostname(...segments: string[]) {
	return segments.filter((s) => s !== "" && s !== "@").join(".");
}

export function makeHostname(scope: Construct, name: string, domainKey: keyof Config["domains"]) {
	const config = getConfig(scope);
	const domainConfig = config.domains[domainKey];
	return joinHostname(name, domainConfig.domain);
}
