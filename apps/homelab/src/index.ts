import { App, YamlOutputType } from "cdk8s";
import { rm } from "node:fs/promises";
import { RootConstruct } from "./charts";
import type { Config } from "./schema/config";
import type { Environment } from "./utils/environment";
import { OUT_DIR } from "./utils/paths";

export interface SynthOptions {
	config: Config;
	environment: Environment;
}

export const synth = async (options: SynthOptions) => {
	const app = new App({
		outdir: OUT_DIR,
		yamlOutputType: YamlOutputType.FILE_PER_CHART,
		outputFileExtension: ".yaml",
		resolvers: [],
	});

	new RootConstruct(app, {
		...options,
		defaultNamespaceName: "default",
		defaultChartProps: {
			disableResourceNameHashes: true,
		},
	});

	await rm(OUT_DIR, { recursive: true, force: true });
	app.synth();

	return app;
};
