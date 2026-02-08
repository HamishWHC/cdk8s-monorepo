import { publishSourceCustomExports } from "@repo/utils/publish-source-custom-export";
import { defineConfig } from "tsdown";

export default defineConfig({
	entry: "src/index.ts",
	external: [/^(?!@repo\/)[^./].*$/],
	unbundle: true,
	sourcemap: true,
	dts: true,
	exports: {
		customExports: publishSourceCustomExports,
	},
});
