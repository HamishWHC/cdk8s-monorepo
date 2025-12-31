import { Chart, Helm } from "cdk8s";
import type { Construct } from "constructs";
import { EnvoyGatewayClass } from "../../constructs/envoy-gateway-class";
import type { DualAccess } from "../../utils/dual-access";
import type { NamespacedChartProps } from "../../utils/types";
import { addNamespace } from "./namespaces";

const URL = "oci://docker.io/envoyproxy/gateway-helm";
const CRDS_URL = "oci://docker.io/envoyproxy/gateway-crds-helm";
const VERSION = "v1.6.0";

export class EnvoyGatewayChart extends Chart {
	crds: Helm;
	release: Helm;

	classes: DualAccess<EnvoyGatewayClass>;

	constructor(scope: Construct, id: string, props: NamespacedChartProps) {
		super(scope, id, props);
		addNamespace(this, { name: props.namespace });

		this.crds = new Helm(this, "crds", {
			chart: CRDS_URL,
			version: VERSION,
			helmFlags: ["--include-crds"],
			namespace: props.namespace,
			values: {
				crds: { gatewayAPI: { enabled: true, channel: "experimental" }, envoyGateway: { enabled: true } },
			},
		});

		this.release = new Helm(this, "default", {
			chart: URL,
			version: VERSION,
			namespace: props.namespace,
			helmFlags: ["--skip-crds"],
			values: {},
		});

		this.classes = {
			internal: new EnvoyGatewayClass(this, "internal-gateway-class", { mode: "internal" }),
			external: new EnvoyGatewayClass(this, "external-gateway-class", { mode: "external" }),
		};
	}
}
