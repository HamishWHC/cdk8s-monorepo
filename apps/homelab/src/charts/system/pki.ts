import { Chart, Duration } from "cdk8s";
import type { Construct } from "constructs";
import { CA } from "../../constructs/ca";
import { ClusterIssuer, Issuer } from "../../imports/cert-manager.io";
import { getEnvironmentName } from "../../utils/environment";
import { addNamespace } from "./namespaces";
import type { NamespacedChartProps } from "../../utils/types";

export class PKIChart extends Chart {
	selfSignedIssuer: ClusterIssuer;
	rootCA: CA;

	constructor(scope: Construct, id: string, props: NamespacedChartProps) {
		super(scope, id, props);
		addNamespace(this, { name: props.namespace });

		this.selfSignedIssuer = new Issuer(this, "self-signed-issuer", {
			spec: {
				selfSigned: {},
			},
		});

		const environment = getEnvironmentName(this);
		this.rootCA = new CA(this, "root-ca", {
			commonName: `Homelab Root CA (${environment})`,
			duration: Duration.days(3650),
			issuer: this.selfSignedIssuer,
		});
	}
}
