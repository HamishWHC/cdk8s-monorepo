import { publishSourceCustomExports } from "@hamishwhc/cdk8s-monorepo-utils/publish-source-custom-export";
import { defineConfig } from "tsdown";

export default defineConfig({
	entry: "src/index.ts",
	external: ["bun"],
	unbundle: true,
	sourcemap: true,
	dts: true,
	exports: {
		customExports: publishSourceCustomExports,
	},
});
