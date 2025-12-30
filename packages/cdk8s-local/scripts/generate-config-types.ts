import { compileFromFile } from "json-schema-to-typescript";
import path from "path";

const tsFile = await compileFromFile(path.join(import.meta.dir, "../src/k3d-config/v1alpha5.json"), {
	style: {
		bracketSpacing: true,
		useTabs: true,
		trailingComma: "all",
	},
	customName: (s, n) => (s.title === "SimpleConfig" ? "K3dSimpleConfigV1Alpha5" : n),
});

await Bun.write(path.join(import.meta.dir, "../src/k3d-config/v1alpha5.ts"), tsFile);
