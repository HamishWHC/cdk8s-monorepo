import { Chart } from "cdk8s";
import { Construct } from "constructs";
import {
	EnvoyProxy,
	EnvoyProxySpecProviderKubernetesEnvoyServiceType,
	EnvoyProxySpecProviderType,
	EnvoyProxySpecTelemetryAccessLogSettingsFormatType,
	EnvoyProxySpecTelemetryAccessLogSettingsSinksType,
} from "../imports/gateway.envoyproxy.io";
import { GatewayClass } from "../imports/gateway.networking.k8s.io";
import { generateName } from "../utils/generate-name";

export interface EnvoyGatewayClassProps {
	mode: "external" | "internal";
}
export class EnvoyGatewayClass extends Construct {
	deploymentRef: { name: string; namespace?: string };
	serviceRef: { name: string; namespace?: string };

	envoyProxyConfiguration: EnvoyProxy;
	gatewayClass: GatewayClass;

	constructor(scope: Construct, id: string, props: EnvoyGatewayClassProps) {
		super(scope, id);

		this.deploymentRef = this.serviceRef = { name: generateName(this, "default"), namespace: Chart.of(this).namespace };
		this.envoyProxyConfiguration = new EnvoyProxy(this, "envoy-proxy-configuration", {
			spec: {
				mergeGateways: true,
				provider: {
					type: EnvoyProxySpecProviderType.KUBERNETES,
					kubernetes: {
						envoyDeployment: {
							name: this.deploymentRef.name,
						},
						envoyService: {
							name: this.serviceRef.name,
							type:
								props.mode === "external"
									? EnvoyProxySpecProviderKubernetesEnvoyServiceType.LOAD_BALANCER
									: EnvoyProxySpecProviderKubernetesEnvoyServiceType.CLUSTER_IP,
						},
					},
				},
				telemetry: {
					accessLog: {
						settings: [
							{
								format: {
									type: EnvoyProxySpecTelemetryAccessLogSettingsFormatType.JSON,
									json: {
										// TODO: Add JSON fields for access logging.
									},
								},
								sinks: [
									{
										type: EnvoyProxySpecTelemetryAccessLogSettingsSinksType.FILE,
										file: {
											path: "/dev/stdout",
										},
									},
								],
							},
						],
					},
					metrics: {
						enableRequestResponseSizesStats: true,
						enableVirtualHostStats: true,
					},
					// tracing: {
					// 	samplingRate: 10, // %
					// 	provider: {
					// 		type: EnvoyProxySpecTelemetryTracingProviderType.OPEN_TELEMETRY,
					// 		serviceName: "core-gateway",
					// 		backendRefs: [
					// 			// TODO: Add otel-collector backend ref.
					// 		],
					// 		backendSettings: {
					// 			// TODO: Add settings for otel-collector.
					// 		},
					// 	},
					// 	// TODO: Determine if requestHeader tags are added *after* modifications made by middleware/extensions.
					// 	// customTags: [
					// 	//     {
					// 	//         type: EnvoyProxySpecTelemetryTracingCustomTagsType.ENVIRONMENT,
					// 	//         requestHeader: {
					// 	//             name: ""
					// 	//         }
					// 	//     }
					// 	// ],
					// },
				},
			},
		});

		this.gatewayClass = new GatewayClass(this, "default", {
			spec: {
				controllerName: "gateway.envoyproxy.io/gatewayclass-controller",
				parametersRef: {
					name: this.envoyProxyConfiguration.name,
					kind: this.envoyProxyConfiguration.kind,
					group: this.envoyProxyConfiguration.apiGroup,
					namespace: Chart.of(this).namespace,
				},
			},
		});
	}
}
