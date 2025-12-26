import { Chart, type ChartProps } from "cdk8s";
import { Deployment, Service, ServiceType } from "cdk8s-plus-32";
import type { Construct } from "constructs";
import { HTTPGateway } from "../../constructs/http-gateway";
import { HttpRoute } from "../../imports/gateway.networking.k8s.io";
import { containerDefaults } from "../../utils/container-defaults";
import { makeHostname } from "../../utils/hostnames";
import { workloadDefaults } from "../../utils/pod-defaults";
import { addNamespace } from "../system/namespaces";

export interface PHPLDAPAdminChartProps extends ChartProps {
	ldapService: Service;
}

export class PHPLDAPAdminChart extends Chart {
	deployment: Deployment;
	service: Service;
	gateway: HTTPGateway;
	httpRoute: HttpRoute;

	constructor(scope: Construct, id: string, props: PHPLDAPAdminChartProps) {
		super(scope, id, props);
		addNamespace(this, { name: props.namespace });

		this.deployment = new Deployment(this, "default", {
			replicas: 1,
			containers: [
				{
					image: "phpldapadmin/phpldapadmin:2.3.7",
					ports: [{ number: 8080, name: "http" }],
					envVariables: {
						LDAP_HOST: { value: props.ldapService.name },
						LDAP_CACHE: { value: "true" },
					},
					securityContext: {
						ensureNonRoot: false,
						readOnlyRootFilesystem: false,
					},
					...containerDefaults(this),
				},
			],
			...workloadDefaults(this),
		});

		this.service = new Service(this, "service", {
			selector: this.deployment,
			type: ServiceType.CLUSTER_IP,
			ports: [{ port: 80, targetPort: 8080, name: "http" }],
		});

		this.gateway = new HTTPGateway(this, "gateway", {
			hostnames: [makeHostname(this, "ldapadmin", "main")],
		});

		this.httpRoute = new HttpRoute(this, "route", {
			spec: {
				parentRefs: this.gateway.refs.https,
				rules: [{ backendRefs: [{ name: this.service.name, port: 80 }] }],
			},
		});
	}
}
