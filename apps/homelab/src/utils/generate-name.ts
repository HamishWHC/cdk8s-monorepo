import { Names, type NameOptions } from "cdk8s";
import type { Construct } from "constructs";

export function generateName(scope: Construct, name: string, options: Omit<NameOptions, "extra"> = {}) {
	return Names.toDnsLabel(scope, {
		extra: [name],
		...options,
	});
}
