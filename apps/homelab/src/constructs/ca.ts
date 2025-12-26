import type { Duration } from "cdk8s";
import { Secret, type ISecret } from "cdk8s-plus-32";
import { Construct } from "constructs";
import {
	Certificate,
	CertificateSpecAdditionalOutputFormatsType,
	CertificateSpecUsages,
	ClusterIssuer,
	type CertificateSpecSubject,
} from "../imports/cert-manager.io";
import { generateName } from "../utils/generate-name";

export interface CAProps {
	commonName: string;
	subject?: CertificateSpecSubject;
	issuer: ClusterIssuer;
	duration: Duration;
}

export class CA extends Construct {
	certificate: Certificate;
	secret: ISecret;
	issuer: ClusterIssuer;

	constructor(scope: Construct, id: string, { commonName, subject, ...props }: CAProps) {
		super(scope, id);

		const secretName = generateName(this, "secret");
		this.secret = Secret.fromSecretName(this, "secret-ref", secretName);

		this.certificate = new Certificate(this, "certificate", {
			spec: {
				isCa: true,
				commonName,
				subject,
				secretName: this.secret.name,
				duration: `${props.duration.toSeconds()}s`,
				issuerRef: {
					name: props.issuer.name,
					kind: props.issuer.kind,
				},
				usages: [CertificateSpecUsages.CRL_SIGN, CertificateSpecUsages.CERT_SIGN],
				additionalOutputFormats: [
					{
						type: CertificateSpecAdditionalOutputFormatsType.COMBINED_PEM,
					},
				],
			},
		});

		this.issuer = new ClusterIssuer(this, "issuer", {
			spec: {
				ca: {
					secretName: this.secret.name,
				},
			},
		});
	}
}
