import type { ChartProps } from "cdk8s";
import { Construct } from "constructs";
import { DebugChart } from "./debug";

export interface AppsChartsConstructProps {
	defaultChartProps?: ChartProps;
}

export class AppsChartsConstruct extends Construct {
	debug: DebugChart;

	constructor(scope: Construct, id: string, props: AppsChartsConstructProps) {
		super(scope, id);

		this.debug = new DebugChart(this, "debug", { ...props.defaultChartProps });
	}
}
