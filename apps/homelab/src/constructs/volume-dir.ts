import { MD5 } from "bun";
import { ConfigMap, Volume } from "cdk8s-plus-32";
import { Construct } from "constructs";
import { readFileSync } from "fs";
import { join } from "path";

export interface VolumeDirProps {
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
	/**
	 * If enabled, the name of the config map will include part of the hash of the contents.
	 * This is useful to ensure that when the contents change, pods using the volume will be
	 * restarted to pick up the new contents.
	 */
	includeHash?: boolean;
}

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

		const data = Object.fromEntries(files.map(({ key, path }) => [key, readFileSync(join(props.dir, path), "utf-8")]));
		this.hash = MD5.hash(JSON.stringify(data), "hex");

		const cmName = props.includeHash ? `configmap-${this.hash.substring(0, 4)}` : "configmap";
		this.configMap = new ConfigMap(this, cmName, {
			data,
		});
		this.volume = Volume.fromConfigMap(this, "volume", this.configMap, {
			items: Object.fromEntries(files.map(({ key, path }) => [key, { path }])),
		});
	}
}
