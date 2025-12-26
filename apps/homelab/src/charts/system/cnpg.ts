import { Chart, Helm } from "cdk8s";
import { Construct } from "constructs";
import type { NamespacedChartProps } from "../../utils/types";
import { addNamespace } from "./namespaces";

const VERSION = "0.26.1";

export class CNPGChart extends Chart {
	release: Helm;

	constructor(scope: Construct, id: string, props: NamespacedChartProps) {
		super(scope, id, props);
		addNamespace(this, { name: props.namespace });

		this.release = new Helm(this, "default", {
			chart: "cnpg/cloudnative-pg",
			version: VERSION,
			namespace: props.namespace,
			helmFlags: ["--include-crds"],
			values: {},
		});
	}
}
