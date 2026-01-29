import { Chart, Size, type ChartProps } from "cdk8s";
import { Deployment, Service } from "cdk8s-plus-32";
import type { Construct } from "constructs";
import { PersistentVolume } from "../../constructs/persistent-volume";
import { getConfig } from "../../schema/config";
import { containerDefaults } from "../../utils/container-defaults";
import { workloadDefaults } from "../../utils/pod-defaults";
import { addNamespace } from "../system/namespaces";

export class OpenLDAPChart extends Chart {
	pvc: PersistentVolume;
	deployment: Deployment;
	service: Service;

	constructor(scope: Construct, id: string, props?: ChartProps) {
		super(scope, id, props);
		addNamespace(this, { name: props?.namespace });

		const config = getConfig(this);

		this.pvc = new PersistentVolume(this, "pvc", {
			size: Size.gibibytes(1),
		});

		const pvc2 = new PersistentVolume(this, "pvc2", {
			size: Size.gibibytes(1),
		});

		this.deployment = new Deployment(this, "default", {
			replicas: 1,
			containers: [
				{
					image: "osixia/openldap:1.5.0",
					ports: [
						{ number: 389, name: "ldap" },
						{ number: 636, name: "ldaps" },
					],
					// envVariables: {
					// 	LDAP_ORGANISATION: { value: "Homelab" },
					// 	LDAP_DOMAIN: { value: config.domains.main.domain },
					// 	LDAP_ADMIN_PASSWORD: { value: "admin" },
					// },
					volumeMounts: [
						{
							path: "/var/lib/ldap",
							volume: this.pvc.volume,
						},
						{
							path: "/etc/ldap/slapd.d",
							volume: pvc2.volume,
						},
					],
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
			ports: [
				{ port: 389, targetPort: 389, name: "ldap" },
				{ port: 636, targetPort: 636, name: "ldaps" },
			],
		});
	}
}
