import { Secret } from "cdk8s-plus-32";
import { Construct } from "constructs";
import { Cluster } from "../imports/postgresql.cnpg.io";

export interface PostgresClusterProps {
	appUserPassword?: string;
	postgresUserPassword?: string;
}

export type PostgresServiceKey = "rw" | "r" | "ro";
export interface PostgresServiceRef {
	name: string;
	kind: string;
	group: string;
}

export class PostgresCluster extends Construct {
	cluster: Cluster;

	appUserPassword: string;
	appUserCredentialsSecret: Secret;
	postgresUserPassword: string;
	postgresUserCredentialsSecret: Secret;

	serviceRefs: Record<PostgresServiceKey, PostgresServiceRef>;

	// backup: ScheduledBackup;

	constructor(scope: Construct, id: string, props: PostgresClusterProps) {
		super(scope, id);

		this.appUserPassword = props.appUserPassword ?? "Verysecure2025";
		this.appUserCredentialsSecret = new Secret(this, "app-credentials", {
			stringData: {
				username: "app",
				password: this.appUserPassword,
			},
		});

		this.postgresUserPassword = props.postgresUserPassword ?? "Verysecure2025";
		this.postgresUserCredentialsSecret = new Secret(this, "postgres-credentials", {
			stringData: {
				username: "postgres",
				password: this.postgresUserPassword,
			},
		});

		this.cluster = new Cluster(this, "default", {
			metadata: {},
			spec: {
				imageName: "ghcr.io/cloudnative-pg/postgresql:17-minimal-trixie",
				instances: 1,
				storage: {
					size: "1Gi",
				},
				enableSuperuserAccess: true,
				superuserSecret: {
					name: this.postgresUserCredentialsSecret.name,
				},
				bootstrap: {
					initdb: {
						secret: {
							name: this.appUserCredentialsSecret.name,
						},
					},
				},
				// backup: {
				//     retentionPolicy: "4w",
				//     barmanObjectStore: {

				//     }
				// }
			},
		});

		this.serviceRefs = {
			rw: {
				name: `${this.cluster.name}-rw`,
				kind: "Service",
				group: "",
			},
			r: {
				name: `${this.cluster.name}-r`,
				kind: "Service",
				group: "",
			},
			ro: {
				name: `${this.cluster.name}-ro`,
				kind: "Service",
				group: "",
			},
		};

		// this.backup = new ScheduledBackup(this, "backup", {
		// 	metadata: {},
		// 	spec: {
		// 		schedule: "@weekly",
		// 		backupOwnerReference: ScheduledBackupSpecBackupOwnerReference.SELF,
		// 		cluster: {
		// 			name: this.cluster.name,
		// 		},
		// 	},
		// });
	}
}
