import { defineConfig } from "tsdown";

export default defineConfig({
	entry: "src/**/*.ts",
	external: ["bun"],
	unbundle: true,
	sourcemap: true,
	dts: true,
});
