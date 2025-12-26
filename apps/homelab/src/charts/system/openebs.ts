import { Chart, Helm, type ChartProps } from "cdk8s";
import type { Construct } from "constructs";
import { addNamespace } from "./namespaces";

const VERSION = "4.4.0";

export class OpenEBSChart extends Chart {
	release: Helm;

	constructor(scope: Construct, id: string, props_: Omit<ChartProps, "namespace">) {
		const props = { ...props_, namespace: "openebs" };
		super(scope, id, props);
		addNamespace(this, { name: props.namespace });

		this.release = new Helm(this, "default", {
			chart: "openebs/openebs",
			version: VERSION,
			namespace: props.namespace,
			helmFlags: ["--include-crds"],
			values: {
				engines: {
					local: {
						lvm: {
							enabled: false,
						},
						zfs: {
							enabled: false,
						},
					},
					replicated: {
						mayastor: {
							enabled: false,
						},
					},
				},
				loki: {
					enabled: false,
				},
				alloy: {
					enabled: false,
				},
				"openebs-crds": {
					csi: {
						volumeSnapshots: {
							enabled: false,
						},
					},
				},
			},
		});
	}
}
