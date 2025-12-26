import { ApiObject, type GroupVersionKind } from "cdk8s";
import type { Construct } from "constructs";
import type { Destination, Override, SearchRule, Source } from "./types";

/* eslint @typescript-eslint/no-explicit-any: off */

/**
 * Configuration for kbld. See https://carvel.dev/kbld/docs/latest/config/
 */
export interface KbldConfigProps {
	/**
	 * The minimum required version of the kbld CLI.
	 */
	minimumRequiredVersion?: string;

	/**
	 * A list of Search Rules that kbld follows to locate container image references within the input files.
	 *
	 * Always has the default search rule below appended.
	 *
	 * @default [{keyMatcher: {name: "image"}, updateStrategy: {entireValue: {}}}]
	 */
	searchRules?: SearchRule[];

	/**
	 * A list of Overrides that kbld applies to found container image references before it attempts to resolve or build the actual image.
	 */
	overrides?: Override[];

	/**
	 * A list of Sources, each of which describes where to find the source that makes up the contents of a given image and which build tool to use to construct it.
	 */
	sources?: Source[];

	/**
	 * A list of Destinations, each of which describes where (i.e. to which container registry) to publish a given image.
	 */
	destinations?: Destination[];
}

export class KbldConfig extends ApiObject {
	public static readonly GVK: GroupVersionKind = {
		apiVersion: "kbld.k14s.io/v1alpha1",
		kind: "Config",
	};

	public static manifest(props: KbldConfigProps = {}): any {
		return {
			...KbldConfig.GVK,
			...props,
		};
	}

	public constructor(scope: Construct, id: string, props: KbldConfigProps = {}) {
		super(scope, id, {
			...KbldConfig.GVK,
			...omitUndefined(props),
		});
	}

	public override toJson(): any {
		const resolved = super.toJson();

		return {
			...KbldConfig.GVK,
			...omitUndefined(resolved),
		};
	}
}

const omitUndefined = (value: any): any => {
	if (value === null || typeof value !== "object") {
		return value;
	} else if (Array.isArray(value)) {
		return value.filter((v) => v !== undefined).map((el) => omitUndefined(el));
	} else {
		return Object.entries(value).reduce((acc, [k, v]) => {
			if (v === undefined) {
				return acc;
			} else {
				return { ...acc, [k]: omitUndefined(v) };
			}
		}, {});
	}
};
