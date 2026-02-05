import { defineConfig } from "tsdown";

export default defineConfig({
	entry: "src/index.ts",
	external: [/^(?!@repo\/)[^./].*$/],
	unbundle: true,
	sourcemap: true,
	dts: true,
	exports: {
		devExports: "bun",
	},
});
