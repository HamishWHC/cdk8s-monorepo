import { Size } from "cdk8s";
import { ContainerProps, Cpu, ImagePullPolicy } from "cdk8s-plus-32";
import type { Construct } from "constructs";
import { isK3d } from "./environment";

export interface ContainerDefaultsOptions {}

export function containerDefaults(scope: Construct, options: ContainerDefaultsOptions = {}) {
	const k3d = isK3d(scope);

	return {
		imagePullPolicy: k3d ? ImagePullPolicy.IF_NOT_PRESENT : ImagePullPolicy.ALWAYS,
		resources: {
			cpu: {
				request: Cpu.millis(1),
				limit: Cpu.units(1),
			},
			memory: {
				request: Size.mebibytes(32),
				limit: Size.gibibytes(1),
			},
		},
	} as const satisfies Partial<ContainerProps>;
}

export function containerDefaultsString(scope: Construct, options: ContainerDefaultsOptions = {}) {
	const k3d = isK3d(scope);

	return {
		imagePullPolicy: k3d ? ImagePullPolicy.IF_NOT_PRESENT : ImagePullPolicy.ALWAYS,
		resources: {
			cpu: {
				request: "1m",
				limit: "1",
			},
			memory: {
				request: "32Mi",
				limit: "1Gi",
			},
		},
	} as const;
}
