import { Chart, Helm, Include } from "cdk8s";
import { Construct } from "constructs";
import type { NamespacedChartProps } from "../../utils/types";
import { addNamespace } from "./namespaces";

const VERSION = "v1.17.2";
const CRDS_URL = `https://github.com/cert-manager/cert-manager/releases/download/${VERSION}/cert-manager.crds.yaml`;

export class CertManagerChart extends Chart {
	CRDs: Include;
	release: Helm;

	constructor(scope: Construct, id: string, props: NamespacedChartProps) {
		super(scope, id, props);
		addNamespace(this, { name: props.namespace });

		this.CRDs = new Include(this, "crds", {
			url: CRDS_URL,
		});

		this.release = new Helm(this, "default", {
			chart: "jetstack/cert-manager",
			version: VERSION,
			namespace: props.namespace,
			helmFlags: ["--include-crds"],
			values: {
				extraArgs: [
					`--cluster-resource-namespace=${props.namespace}`,
					"--feature-gates=AdditionalCertificateOutputFormats=true",
					"--enable-certificate-owner-ref",
				],
				webhook: {
					extraArgs: ["--feature-gates=AdditionalCertificateOutputFormats=true"],
				},
			},
		});
	}
}
