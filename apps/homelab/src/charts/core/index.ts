import type { ChartProps } from "cdk8s";
import { Construct } from "constructs";
import { OpenLDAPChart } from "./openldap";
import { PHPLDAPAdminChart } from "./phpldapadmin";

export interface CoreChartsConstructProps {
	defaultChartProps?: ChartProps;
}

export class CoreChartsConstruct extends Construct {
	openLDAP: OpenLDAPChart;
	phpLDAPAdmin: PHPLDAPAdminChart;
	// authelia: AutheliaChart;

	constructor(scope: Construct, id: string, props: CoreChartsConstructProps) {
		super(scope, id);

		this.openLDAP = new OpenLDAPChart(this, "openldap", {
			...props.defaultChartProps,
			namespace: "auth",
		});
		this.phpLDAPAdmin = new PHPLDAPAdminChart(this, "phpldapadmin", {
			...props.defaultChartProps,
			namespace: "auth",
			ldapService: this.openLDAP.statefulSet.service,
		});
		// this.authelia = new AutheliaChart(this, "authelia", {
		// 	...props.defaultChartProps,
		// 	namespace: "auth",
		// });
	}
}
