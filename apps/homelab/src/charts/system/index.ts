import type { ChartProps } from "cdk8s";
import { Construct } from "constructs";
import { getEnvironment } from "../../utils/environment";
import { ACMEChart } from "./acme";
import { CertManagerChart } from "./cert-manager";
import { CertificateStoreChart } from "./certificate-store";
import { CiliumChart } from "./cilium";
import { CNPGChart } from "./cnpg";
import { DNSOverridesChart } from "./dns-overrides";
import { EnvoyGatewayChart } from "./envoy-gateway";
import { NamespacesChart } from "./namespaces";
import { OpenEBSChart } from "./openebs";
import { PKIChart } from "./pki";

export interface SystemChartsConstructProps {
	defaultChartProps?: ChartProps;
}

export class SystemChartsConstruct extends Construct {
	namespaces: NamespacesChart;
	dnsOverrides: DNSOverridesChart;
	cilium: CiliumChart;
	openebs?: OpenEBSChart;

	certManager: CertManagerChart;
	pki: PKIChart;
	acme: ACMEChart;
	certificateStore: CertificateStoreChart;

	envoyGateway: EnvoyGatewayChart;

	cnpg: CNPGChart;

	constructor(scope: Construct, id: string, props: SystemChartsConstructProps) {
		super(scope, id);

		const environment = getEnvironment(this);

		this.namespaces = new NamespacesChart(this, "namespaces", props.defaultChartProps ?? {});
		this.dnsOverrides = new DNSOverridesChart(this, "dns-overrides", { ...props.defaultChartProps });
		this.cilium = new CiliumChart(this, "cilium", { ...props.defaultChartProps });
		if (!environment.isK3d) {
			console.log("Adding OpenEBS chart as environment is not k3d");
			this.openebs = new OpenEBSChart(this, "openebs", { ...props.defaultChartProps });
		}

		this.certManager = new CertManagerChart(this, "cert-manager", {
			...props.defaultChartProps,
			namespace: "cert-manager",
		});
		this.pki = new PKIChart(this, "pki", { ...props.defaultChartProps, namespace: "cert-manager" });
		this.acme = new ACMEChart(this, "acme", { ...props.defaultChartProps, namespace: "cert-manager", pki: this.pki });
		this.certificateStore = new CertificateStoreChart(this, "certificate-store", {
			...props.defaultChartProps,
			namespace: "cert-manager",
			acme: this.acme,
		});

		this.envoyGateway = new EnvoyGatewayChart(this, "envoy-gateway", {
			...props.defaultChartProps,
			namespace: "envoy-gateway-system",
		});

		this.cilium.addGatewayAndRoute(this.envoyGateway.classes);

		this.cnpg = new CNPGChart(this, "cnpg", {
			...props.defaultChartProps,
			namespace: "kube-system",
		});
	}
}
