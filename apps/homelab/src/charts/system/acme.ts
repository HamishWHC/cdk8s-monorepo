import { assert } from "@repo/utils/assert";
import { Chart, Duration } from "cdk8s";
import { Secret, type ISecret } from "cdk8s-plus-32";
import { Construct } from "constructs";
import { CA } from "../../constructs/ca";
import { ClusterIssuer } from "../../imports/cert-manager.io";
import { getConfig } from "../../schema/config";
import { makeSolver } from "../../utils/dns";
import { getEnvironment } from "../../utils/environment";
import { generateName } from "../../utils/generate-name";
import type { NamespacedChartProps } from "../../utils/types";
import { addNamespace } from "./namespaces";
import type { PKIChart } from "./pki";

export interface ACMEChartProps extends NamespacedChartProps {
	pki: PKIChart;
}

export class ACMEChart extends Chart {
	issuer: ClusterIssuer;

	privateDomainCA?: CA;
	privateKeySecret?: ISecret;

	constructor(scope: Construct, id: string, props: ACMEChartProps) {
		super(scope, id, props);
		addNamespace(this, { name: props.namespace });

		const config = getConfig(this);

		if (config.acme.enable) {
			assert(config.dns.enable, "DNS must be enabled in order to use ACME.");

			const { email, server } = config.acme;
			const privateKeySecretName = generateName(this, "private-key");
			this.privateKeySecret = Secret.fromSecretName(this, "private-key", privateKeySecretName);
			this.issuer = new ClusterIssuer(this, "issuer", {
				spec: {
					acme: {
						email,
						server,
						privateKeySecretRef: {
							name: this.privateKeySecret.name,
						},
						solvers: Object.values(config.domains).map((d) => {
							const scope = new Construct(this, `solver-${d.domain}`);
							assert(d.credentials, `DNS credentials must be provided for domain ${d.domain} when ACME is enabled.`);
							return {
								dns01: makeSolver(scope, d.credentials),
							};
						}),
					},
				},
			});
		} else {
			const environment = getEnvironment(this);
			this.privateDomainCA = new CA(this, "private-domain-ca", {
				commonName: `Homelab Intermediate Domain CA (${environment})`,
				duration: Duration.days(90),
				issuer: props.pki.rootCA.issuer,
			});
			this.issuer = this.privateDomainCA.issuer;
		}
	}
}
