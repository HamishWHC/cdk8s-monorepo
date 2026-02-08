import { publishSourceCustomExports } from "@hamishwhc/cdk8s-monorepo-utils/publish-source-custom-export";
import { defineConfig } from "tsdown";

export default defineConfig({
	entry: "src/index.ts",
	unbundle: true,
	sourcemap: true,
	dts: true,
	exports: {
		customExports: publishSourceCustomExports,
	},
});
