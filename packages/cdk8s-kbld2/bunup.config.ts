import { defineConfig } from "bunup";

export default defineConfig({
	entry: ["src/**/*.ts"],
	format: ["cjs", "esm"],
	packages: "external",
	noExternal: [/^@repo\/.*$/],
	dts: { inferTypes: true, resolve: false },
});
