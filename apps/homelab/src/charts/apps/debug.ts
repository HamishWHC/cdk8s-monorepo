import { Chart, Duration, type ChartProps } from "cdk8s";
import { Deployment, Probe, Protocol, Service } from "cdk8s-plus-32";
import type { Construct } from "constructs";
import { HTTPGateway } from "../../constructs/http-gateway";
import { HttpRoute } from "../../imports/gateway.networking.k8s.io";
import { containerDefaults } from "../../utils/container-defaults";
import { makeHostname } from "../../utils/hostnames";
import { workloadDefaults } from "../../utils/pod-defaults";
import { addNamespace } from "../system/namespaces";

export class DebugChart extends Chart {
	deployment: Deployment;
	gateway: HTTPGateway;
	service: Service;
	route: HttpRoute;

	constructor(scope: Construct, id: string, props?: ChartProps) {
		super(scope, id, props);
		addNamespace(this, { name: props?.namespace });

		this.deployment = new Deployment(this, "deployment", {
			containers: [
				{
					image: "traefik/whoami",
					ports: [
						{
							name: "http",
							number: 80,
							protocol: Protocol.TCP,
						},
					],
					startup: Probe.fromHttpGet("/health", {
						periodSeconds: Duration.seconds(3),
						failureThreshold: 10,
					}),
					readiness: Probe.fromHttpGet("/health", {
						failureThreshold: 3,
					}),
					liveness: Probe.fromHttpGet("/health", {
						failureThreshold: 30,
					}),
					securityContext: {
						ensureNonRoot: false,
					},
					...containerDefaults(this),
				},
			],
			...workloadDefaults(this),
		});

		this.service = new Service(this, "service", {
			selector: this.deployment,
			ports: [{ port: 80, targetPort: 80 }],
		});

		this.gateway = new HTTPGateway(this, "gateway", {
			hostnames: [makeHostname(this, "debug", "main")],
		});

		this.route = new HttpRoute(this, "route", {
			spec: {
				parentRefs: this.gateway.refs.https,
				rules: [{ backendRefs: [{ name: this.service.name, port: 80 }] }],
			},
		});
	}
}
