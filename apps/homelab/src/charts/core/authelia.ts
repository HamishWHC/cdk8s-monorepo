import { Chart, Helm } from "cdk8s";
import type { Construct } from "constructs";
import type { NamespacedChartProps } from "../../utils/types";
import { addNamespace } from "../system/namespaces";

export const VERSION = "0.10.49";

export class AutheliaChart extends Chart {
	release: Helm;

	constructor(scope: Construct, id: string, props: NamespacedChartProps) {
		super(scope, id, props);
		addNamespace(this, { name: props.namespace });

		this.release = new Helm(this, "default", {
			chart: "authelia/authelia",
			version: VERSION,
			namespace: props.namespace,
			helmFlags: ["--include-crds"],
		});
	}
}
