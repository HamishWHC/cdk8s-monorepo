import type { Type } from "cmd-ts";
import { exists } from "fs/promises";
import path from "path";
import { type Config, readConfig } from "../schema/config";
import { APP_ROOT } from "./paths";

export const COMMON_ENVIRONMENT_NAMES = ["local", "prod", "production", "stg", "staging", "dev", "development"];
export type ConfigArg = { config: Config; name: string };

export const ConfigArg: Type<string, ConfigArg> = {
	async from(name) {
		const files = [`config.${name}.yaml`, `config.${name}.yml`, `config.${name}.json`].map((fn) =>
			path.join(APP_ROOT, fn),
		);

		const filename = (
			await Promise.all(
				files.map(async (filename) => ({
					filename,
					exists: await exists(filename),
				})),
			)
		).find(({ exists }) => exists)?.filename;
		if (filename === undefined) {
			throw new Error(`Could not find configuration file for environment "${name}".`);
		}

		return { config: readConfig(filename), name };
	},
};

export const findFirstConfig = async (): Promise<ConfigArg> => {
	for (const env of COMMON_ENVIRONMENT_NAMES) {
		try {
			return await ConfigArg.from(env);
		} catch (e) {
			if (!(e instanceof Error && e.message.startsWith("Could not find configuration file for environment"))) {
				throw e;
			}
		}
	}
	throw new Error(`No available configs from common environment names (${COMMON_ENVIRONMENT_NAMES.join(", ")}).`);
};
