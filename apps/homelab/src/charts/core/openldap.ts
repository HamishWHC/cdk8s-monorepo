import { Chart, Size, type ChartProps } from "cdk8s";
import { PersistentVolumeAccessMode, StatefulSet, Volume } from "cdk8s-plus-32";
import type { Construct } from "constructs";
import { PersistentVolume } from "../../constructs/persistent-volume";
import { getConfig } from "../../schema/config";
import { containerDefaults } from "../../utils/container-defaults";
import { workloadDefaults } from "../../utils/pod-defaults";
import { addNamespace } from "../system/namespaces";

export class OpenLDAPChart extends Chart {
	pvc: PersistentVolume;
	statefulSet: StatefulSet;

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

		this.statefulSet = new StatefulSet(this, "default", {
			replicas: 1,
			containers: [
				{
					image: "osixia/openldap:1.5.0",
					ports: [
						{ number: 389, name: "ldap" },
						{ number: 636, name: "ldaps" },
					],
					envVariables: {
						LDAP_ORGANISATION: { value: "Homelab" },
						LDAP_DOMAIN: { value: config.domains.main.domain },
						LDAP_ADMIN_PASSWORD: { value: "admin" },
					},
					volumeMounts: [
						{
							path: "/var/lib/ldap",
							volume: Volume.fromName(this, "data-volume", "data-volume"),
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
			volumeClaimTemplates: [
				{
					name: "data-volume",
					storage: Size.gibibytes(1),
					accessModes: [PersistentVolumeAccessMode.READ_WRITE_ONCE],
					storageClassName: "openebs-hostpath",
				},
			],
			...workloadDefaults(this),
		});
	}
}
