import { MD5 } from "bun";
import { ConfigMap, Volume } from "cdk8s-plus-32";
import { Construct } from "constructs";
import { readFileSync } from "fs";
import { join } from "path";

export type VolumeDirProps = {
	/**
	 * Path to directory to turn into a volume. Should be an absolute path or relative to repo root.
	 */
	dir: string;
	/**
	 * Glob pattern to match files on. Doesn't follow symlinks.
	 * @default "**" (all files in directory, recursively)
	 */
	glob?: string;
	/**
	 * Allow matching hidden files (files with names starting with a dot).
	 */
	dot?: boolean;
};

export class VolumeDir extends Construct {
	configMap: ConfigMap;
	volume: Volume;
	hash: string;

	/**
	 * A construct that takes a directory and turns it into a config map and volume.
	 * Handles subdirectories using projection.
	 */
	constructor(scope: Construct, id: string, props: VolumeDirProps) {
		super(scope, id);

		const glob = new Bun.Glob(props.glob ?? "**");
		const files = Array.from(glob.scanSync({ cwd: props.dir, dot: props.dot ?? false })).map((path) => ({
			key: MD5.hash(path, "hex"),
			path,
		}));

		this.configMap = new ConfigMap(this, "map", {
			data: Object.fromEntries(files.map(({ key, path }) => [key, readFileSync(join(props.dir, path), "utf-8")])),
		});
		this.volume = Volume.fromConfigMap(this, "volume", this.configMap, {
			items: Object.fromEntries(files.map(({ key, path }) => [key, { path }])),
		});

		this.hash = MD5.hash(JSON.stringify(this.configMap.data), "hex");
	}
}
