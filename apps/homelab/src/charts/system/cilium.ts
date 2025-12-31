import { Chart, Helm, type ChartProps } from "cdk8s";
import { Construct } from "constructs";
import type { EnvoyGatewayClass } from "../../constructs/envoy-gateway-class";
import { HTTPGateway } from "../../constructs/http-gateway";
import { HttpRoute } from "../../imports/gateway.networking.k8s.io";
import { getConfig } from "../../schema/config";
import { makeHostname } from "../../utils/hostnames";
import { addNamespace } from "./namespaces";
import type { DualAccess } from "../../utils/dual-access";

const VERSION = "1.18.3";

export class CiliumChart extends Chart {
	release: Helm;
	gateway?: HTTPGateway;
	route?: HttpRoute;

	constructor(scope: Construct, id: string, props_: Omit<ChartProps, "namespace">) {
		const props = { ...props_, namespace: "kube-system" };
		super(scope, id, props);
		addNamespace(this, { name: props.namespace });

		const {
			features: { monitoring },
		} = getConfig(this);

		this.release = new Helm(this, "default", {
			chart: "cilium/cilium",
			version: VERSION,
			namespace: "kube-system",
			helmFlags: ["--include-crds"],
			values: {
				// TODO: Review this.
				nodeIPAM: {
					enabled: true,
				},
				dashboards: {
					enabled: monitoring.enable,
					annotations: {
						grafana_folder: "cilium",
					},
				},
				prometheus: {
					enabled: monitoring.enable,
					serviceMonitor: {
						enabled: monitoring.enable,
						trustCRDsExist: true,
					},
				},
				operator: {
					replicas: 1,
					dashboards: {
						enabled: monitoring.enable,
						annotations: {
							grafana_folder: "cilium-operator",
						},
					},
					prometheus: {
						enabled: monitoring.enable,
						serviceMonitor: {
							enabled: monitoring.enable,
						},
					},
				},
				hubble: {
					enabled: monitoring.enable,
					ui: {
						enabled: monitoring.enable,
					},
					relay: {
						enabled: monitoring.enable,
						prometheus: {
							enabled: monitoring.enable,
							serviceMonitor: {
								enabled: monitoring.enable,
							},
						},
					},
					metrics: {
						enabled: monitoring.enable
							? [
									"dns",
									"drop",
									"tcp",
									"flow",
									"port-distribution",
									"icmp",
									"httpV2:exemplars=true;labelsContext=source_ip,source_namespace,source_workload,destination_ip,destination_namespace,destination_workload,traffic_direction",
								]
							: null,
						dashboards: {
							enabled: monitoring.enable,
							annotations: {
								grafana_folder: "cilium-hubble",
							},
						},
						serviceMonitor: {
							enabled: monitoring.enable,
						},
					},
				},
			},
		});
	}

	addGatewayAndRoute(gatewayClasses?: DualAccess<EnvoyGatewayClass>) {
		const config = getConfig(this);
		if (config.features.monitoring.enable) {
			this.gateway = new HTTPGateway(this, "hubble-ui-gateway", {
				hostnames: [makeHostname(this, "hubble", "main")],
				gatewayClasses,
			});
			this.route = new HttpRoute(this, "hubble-ui-route", {
				spec: {
					parentRefs: this.gateway.refs.https,
					rules: [
						{
							backendRefs: [
								{
									name: "hubble-ui",
									kind: "Service",
									port: 80,
								},
							],
						},
					],
				},
			});
		}
	}
}
