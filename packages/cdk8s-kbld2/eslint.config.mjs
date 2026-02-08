import { config } from "@hamishwhc/cdk8s-monorepo-eslint-config/base";

/** @type {import("eslint").Linter.Config} */
export default [
	...config,
	{
		rules: {
			// The cdk8s contract doesn't provide more detailed types for toJson() and manifest()
			"@typescript-eslint/no-explicit-any": "off",
		},
	},
];
