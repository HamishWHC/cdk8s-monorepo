import { config } from "@repo/eslint-config/base";

/** @type {import("eslint").Linter.Config} */
export default [
	...config,
	{
		files: ["src/k3d-config/v*.ts"],
		linterOptions: {
			reportUnusedDisableDirectives: false,
		},
	},
];
