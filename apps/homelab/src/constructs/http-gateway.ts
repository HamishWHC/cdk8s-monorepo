import { Construct } from "constructs";
import { getRootConstruct } from "../charts";
import { getOrCreateCertificate } from "../charts/system/certificate-store";
import { addDNSOverride } from "../charts/system/dns-overrides";
import {
	Gateway,
	GatewaySpecListenersTlsMode,
	HttpRoute,
	HttpRouteSpecRulesFiltersRequestRedirectScheme,
	HttpRouteSpecRulesFiltersRequestRedirectStatusCode,
	HttpRouteSpecRulesFiltersType,
	type GatewaySpecListeners,
	type HttpRouteSpecParentRefs,
} from "../imports/gateway.networking.k8s.io";
import type { DualAccess } from "../utils/dual-access";
import type { EnvoyGatewayClass } from "./envoy-gateway-class";

export interface HTTPGatewayProps {
	hostnames: string[];
	gatewayClasses?: DualAccess<EnvoyGatewayClass>;
	/**
	 * @default true
	 */
	redirectHttpToHttps?: boolean;
	ports?: {
		http?: number;
		https?: number;
	};
}

export class HTTPGateway extends Construct {
	gateways: DualAccess<Gateway>;
	classes: DualAccess<EnvoyGatewayClass>;

	refs: Record<"gateways" | "http" | "https", HttpRouteSpecParentRefs[]>;
	httpRedirectorRoute?: HttpRoute;

	constructor(scope: Construct, id: string, props: HTTPGatewayProps) {
		super(scope, id);

		const httpListeners: GatewaySpecListeners[] = props.hostnames.map((hostname) => ({
			name: `http-${hostname}`,
			hostname,
			port: props.ports?.http ?? 80,
			protocol: "HTTP",
		}));
		const httpsListeners: GatewaySpecListeners[] = props.hostnames.map((hostname) => {
			const entry = getOrCreateCertificate(this, hostname);
			return {
				name: `https-${hostname}`,
				hostname,
				port: props.ports?.https ?? 443,
				protocol: "HTTPS",
				tls: {
					mode: GatewaySpecListenersTlsMode.TERMINATE,
					certificateRefs: [entry.secretRef],
				},
			};
		});

		const root = getRootConstruct(this);
		this.classes = props.gatewayClasses ?? root.system.envoyGateway.classes;

		this.gateways = {
			external: new Gateway(this, "external", {
				spec: {
					gatewayClassName: this.classes.external.gatewayClass.name,
					listeners: [...httpListeners, ...httpsListeners],
				},
			}),
			internal: new Gateway(this, "internal", {
				spec: {
					gatewayClassName: this.classes.internal.gatewayClass.name,
					listeners: [...httpListeners, ...httpsListeners],
				},
			}),
		};

		const gatewayRefs = [
			{
				name: this.gateways.external.name,
				kind: this.gateways.external.kind,
				group: this.gateways.external.apiGroup,
			},
			{
				name: this.gateways.internal.name,
				kind: this.gateways.internal.kind,
				group: this.gateways.internal.apiGroup,
			},
		];
		this.refs = {
			gateways: gatewayRefs,
			http: gatewayRefs.flatMap((gatewayRef) =>
				httpListeners.map((listener) => ({
					...gatewayRef,
					sectionName: listener.name,
				})),
			),
			https: gatewayRefs.flatMap((gatewayRef) =>
				httpsListeners.map((listener) => ({
					...gatewayRef,
					sectionName: listener.name,
				})),
			),
		};

		if (props.redirectHttpToHttps ?? true) {
			this.httpRedirectorRoute = new HttpRoute(this, "http-redirector-route", {
				spec: {
					parentRefs: this.refs.http,
					rules: [
						{
							filters: [
								{
									type: HttpRouteSpecRulesFiltersType.REQUEST_REDIRECT,
									requestRedirect: {
										scheme: HttpRouteSpecRulesFiltersRequestRedirectScheme.HTTPS,
										statusCode: HttpRouteSpecRulesFiltersRequestRedirectStatusCode.VALUE_301,
									},
								},
							],
						},
					],
				},
			});
		}

		for (const hostname of props.hostnames) {
			addDNSOverride(this, hostname, this);
		}
	}
}
