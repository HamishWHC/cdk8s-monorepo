import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/**/*.ts"],
	format: ["cjs", "esm"],
	target: "bun",
	packages: "external",
	noExternal: [/^@repo\/.*$/],
	dts: { inferTypes: true, resolve: false },
});
