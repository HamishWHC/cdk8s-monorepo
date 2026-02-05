import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/**/*.ts"],
	format: ["cjs", "esm"],
	external: ["*"],
	noExternal: [/^@repo\/.*$/],
	dts: {},
	clean: true,
});
