import { type WorkloadProps } from "cdk8s-plus-32";
import type { Construct } from "constructs";

export interface WorkloadDefaultsOptions {}

export function workloadDefaults(scope: Construct, options: WorkloadDefaultsOptions = {}) {
	return {
		automountServiceAccountToken: false,
		enableServiceLinks: false,
	} as const satisfies Partial<WorkloadProps>;
}
