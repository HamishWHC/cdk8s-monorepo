import { App, YamlOutputType } from "cdk8s";
import { RootConstruct } from "./charts";
import type { Config } from "./schema/config";
import type { Environment } from "./utils/environment";
import { addHelmRepos } from "./utils/helm";
import { OUT_DIR } from "./utils/paths";

export interface SynthOptions {
	config: Config;
	environment: Environment;
}

export const synth = async (options: SynthOptions) => {
	await addHelmRepos();

	const app = new App({
		outdir: OUT_DIR,
		yamlOutputType: YamlOutputType.FILE_PER_CHART,
		outputFileExtension: ".yaml",
		resolvers: [],
	});

	new RootConstruct(app, {
		...options,
		defaultChartProps: {
			disableResourceNameHashes: true,
		},
	});

	return app;
};
