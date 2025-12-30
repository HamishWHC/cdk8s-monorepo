import { createContext } from "cdk-typed-context";
import { Chart } from "cdk8s";
import { Secret, type ISecret } from "cdk8s-plus-32";
import type { Construct } from "constructs";
import { getRootConstruct } from "..";
import { Certificate } from "../../imports/cert-manager.io";
import { ReferenceGrant, type GatewaySpecListenersTlsCertificateRefs } from "../../imports/gateway.networking.k8s.io";
import { generateName } from "../../utils/generate-name";
import { canoniseHostname, hostnameToLabelPart } from "../../utils/hostnames";
import type { NamespacedChartProps } from "../../utils/types";

export const CertificateStoreChartContext = createContext<{ chart: CertificateStoreChart | null }>(
	"CertificateStoreChart",
	{
		errorOnMissing: "`CertificateStoreChart` has not been setup for this construct tree.",
	},
);

export function setupCertificateStoreChartContext(scope: Construct) {
	CertificateStoreChartContext.set(scope, { chart: null });
}

export function getOrCreateCertificate(scope: Construct, hostname: string) {
	const ctx = CertificateStoreChartContext.get(scope);
	if (!ctx.chart) {
		throw new Error("`CertificateStoreChart` has not been setup for this construct tree.");
	}
	return ctx.chart.getOrCreateCertificate(scope, hostname);
}

interface CertificateStoreEntry {
	names: ReturnType<typeof canoniseHostname>;
	secret: ISecret;
	secretRef: GatewaySpecListenersTlsCertificateRefs;
	certificate: Certificate;
	namespaces: string[];
	referenceGrants: ReferenceGrant[];
}

export class CertificateStoreChart extends Chart {
	certificates: Map<string, CertificateStoreEntry> = new Map();

	constructor(scope: Construct, id: string, props: NamespacedChartProps) {
		super(scope, id, props);

		const ctx = CertificateStoreChartContext.get(scope);
		if (ctx.chart) {
			throw new Error("`CertificateStoreChart` has already been setup for this construct tree.");
		}

		ctx.chart = this;
	}

	public addReferenceGrant(entry: CertificateStoreEntry, namespace: string) {
		const grant = new ReferenceGrant(this, `${namespace}-${hostnameToLabelPart(entry.names.canonical)}`, {
			spec: {
				from: [{ group: "gateway.networking.k8s.io", kind: "Gateway", namespace }],
				to: [{ group: "", kind: "Secret", name: entry.secret.name }],
			},
		});
		entry.referenceGrants.push(grant);
		entry.namespaces.push(namespace);
	}

	public getOrCreateCertificate(scope: Construct, hostname: string) {
		const namespace = Chart.of(scope).namespace ?? "default";
		const root = getRootConstruct(this);
		const names = canoniseHostname(this, hostname);
		let entry = this.certificates.get(names.canonical);
		if (entry) {
			if (!entry.namespaces.includes(namespace)) {
				this.addReferenceGrant(entry, namespace);
			}

			return entry;
		}

		const label = hostnameToLabelPart(names.canonical);
		const secretName = generateName(this, `${label}-certificate-secret`);
		const secret = Secret.fromSecretName(this, `${label}-certificate-secret`, secretName);
		const certificate = new Certificate(this, `${label}-certificate`, {
			spec: {
				issuerRef: {
					name: root.system.acme.issuer.name,
					kind: root.system.acme.issuer.kind,
				},
				secretName,
				commonName: names.parent ?? names.canonical,
				dnsNames: [names.canonical],
			},
		});

		entry = {
			names,
			secret,
			certificate,
			secretRef: { name: secret.name, namespace: Chart.of(this).namespace, group: secret.apiGroup, kind: secret.kind },
			namespaces: [],
			referenceGrants: [],
		};
		this.addReferenceGrant(entry, namespace);
		this.certificates.set(names.canonical, entry);

		return entry;
	}
}
