import { createContext } from "cdk-typed-context";
import type { Construct } from "constructs";
import { readFileSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { z } from "zod";
import { APP_ROOT } from "../../utils/paths";
import { ACMEConfig, DomainConfig } from "./dns";
import { featureToggle } from "./utils";

export const Config = z.object({
	dns: featureToggle({}),
	acme: ACMEConfig,
	domains: z.object({
		main: DomainConfig,
	}),
	images: z.object({
		destination: z.string().describe("Destination for built images, e.g. 'docker.io/username' or 'ghcr.io/username'"),
		pull: z.boolean().default(false),
		noCache: z.boolean().default(false),
	}),
	features: z
		.object({
			monitoring: featureToggle({}),
		})
		.default({ monitoring: { enable: false } }),
});

export type RawConfig = z.input<typeof Config>;
export type Config = z.output<typeof Config>;

export function readConfig(filename: string) {
	const text = readFileSync(filename, { encoding: "utf-8" });

	let unvalidatedConfig;
	try {
		unvalidatedConfig = Bun.YAML.parse(text);
	} catch {
		throw new Error(`Could not parse YAML config from file ${filename}.`);
	}

	const parseResult = Config.safeParse(unvalidatedConfig ?? {});
	if (!parseResult.success) {
		throw new Error(z.prettifyError(parseResult.error));
	}

	return parseResult.data;
}

export const configJsonSchema = z.toJSONSchema(Config, {
	io: "input",
	cycles: "ref",
	reused: "ref",
});

export async function exportConfigJsonSchema() {
	await mkdir(path.join(APP_ROOT, ".schema"), { recursive: true });
	await writeFile(path.join(APP_ROOT, ".schema", "config.schema.json"), JSON.stringify(configJsonSchema, undefined, 4));
}

const ConfigContext = createContext<Config>("Config");

export function setupConfigContext(scope: Construct, config: Config) {
	ConfigContext.set(scope, config);
}

export function getConfig(scope: Construct) {
	return ConfigContext.get(scope);
}
