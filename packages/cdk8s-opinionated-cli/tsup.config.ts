import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/**/*.ts"],
	format: ["cjs", "esm"],
	external: ["bun", "../utils/package.json"],
	noExternal: ["@repo/utils"],
	// dts: {},
	experimentalDts: {},
	clean: true,
});
