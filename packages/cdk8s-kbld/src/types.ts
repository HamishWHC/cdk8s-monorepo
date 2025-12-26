export interface SearchRule {
	/**
	 * Identifies container image references based on an item's key.
	 */
	keyMatcher?: KeyMatcher;
	/**
	 * Identifies container image references based on an item's value.
	 */
	valueMatcher?: ValueMatcher;
	/**
	 * What kbld should do with the matched container image reference.
	 *
	 * @default {entireValue: {}}
	 */
	updateStrategy?: UpdateStrategy;
}

export type IndexingTactic = { allIndexes: true } | { index: number };

export interface KeyMatcher {
	/**
	 * Specifies the key name (e.g. `sidecarImage`).
	 */
	name: string;
	/**
	 * Specifies key path from the root of the YAML document.
	 *
	 * Each path part can be one of:
	 * - the literal key name. (e.g. `["data", "sidecarImage"]` maps to `data.sidecarImage`)
	 * - an array indexing tactic (choose one):
	 *   - `{index: int}` search one element in the array at the (zero-based) index given.
	 *   - `{allIndexes: true}` search all elements in the array.
	 */
	path: (string | IndexingTactic)[];
}

export type ValueMatcher = ImageValueMatcher | ImageRepoValueMatcher;

export interface ImageValueMatcher {
	/**
	 * Value to match exactly.
	 */
	image: string;
}

export interface ImageRepoValueMatcher {
	/**
	 * Of values in the format ([registry]repo[:tag]\[@sha256:...]), the value of the repo portion.
	 *
	 * e.g. `imageRepo: "gcr.io/project/app"` matches `gcr.io/project/app:v1.1` and `gcr.io/projects/app@sha256:f33e111...` but not `gcr.io/project/app_v1`.
	 */
	imageRepo: string;
}

export type UpdateStrategy = YamlUpdateStrategy | JsonUpdateStrategy | NoneUpdateStrategy | EntireValueUpdateStrategy;

export interface YamlUpdateStrategy {
	/**
	 * Parses YAML and identifies image refs by specified search rules.
	 */
	yaml: {
		/**
		 * One or more Search Rules, scoped to the parsed content.
		 */
		searchRules: SearchRule[];
	};
}

export interface JsonUpdateStrategy {
	/**
	 * Parses JSON and identifies image refs by specified search rules.
	 */
	json: {
		/**
		 * One or more Search Rules, scoped to the parsed content.
		 */
		searchRules: SearchRule[];
	};
}

export interface NoneUpdateStrategy {
	/**
	 * Excludes value from processing. (v0.22.0+)
	 */
	none: object;
}

export interface EntireValueUpdateStrategy {
	/**
	 * Uses the exact value as the image reference.
	 */
	entireValue: object;
}

export interface Override {
	/**
	 * Exact value found while searching for container image references.
	 */
	image: string;
	/**
	 * Value with which to replace/override. This ought to be an image reference in the format `[registry]repo[:tag]\[@sha256:...]`.
	 *
	 * @example "nginx"
	 * @example "quay.io/bitnami/nginx"
	 * @example "nginx:1.21.1"
	 * @example "nginx@sha256:a05b0cd..."
	 * @example "index.docker.io/library/nginx@sha256:a05b0cd..."
	 */
	newImage: string;
	/**
	 * Specifies if `newImage` should be used as is (rather than be [re]resolved to a digest reference).
	 */
	preresolved?: boolean;
	/**
	 * When `newImage` is being resolved, specifies how to select the tag part of the reference before resolving to a digest reference. (v0.28.0+)
	 *
	 * When provided, `newImage` must not have a tag or digest part (e.g. `gcr.io/my-corp/app`).
	 */
	tagSelection?: VersionSelection;
	/**
	 * Specifies a way to select particular image within an image index. (v0.35.0+)
	 */
	platformSelection?: PlatformSelection;
}

/**
 * See https://carvel.dev/vendir/docs/latest/versions/#versionselection-type
 */
export interface VersionSelection {
	semver: SemverVersionSelection;
}

export interface SemverVersionSelection {
	constraints?: string;
	prereleases?: { identifiers?: string[] };
}

export interface PlatformSelection {
	/**
	 * Selects via CPU architecture.
	 *
	 * @example "amd64"
	 */
	architecture: string;
	/**
	 * Selects via OS name.
	 *
	 * @example "linux"
	 */
	os: string;
	/**
	 * Selects via OS version (commonly used for Windows).
	 *
	 * @example "10.0.10586"
	 */
	"os.version": string;
	/**
	 * Selects via OS features (commonly used for Windows).
	 *
	 * @example ["win32k"]
	 */
	"os.features": string[];
	/**
	 * Selects via architecture variant.
	 *
	 * @example "armv6l"
	 */
	variant: string;
	/**
	 * Selects via architecture features.
	 *
	 * @example ["sse4"]
	 */
	features: string[];
}

export interface Source {
	/**
	 * Exact value found while searching for container image references.
	 */
	image: string;
	/**
	 * Filesystem path to the source for the to-be-built image. This path also acts as the container file context; therefore, any paths in the container file (when one is present) must be relative to the value of the field `path`.
	 */
	path: string;
	/**
	 * Name/configure a specific image builder tool.
	 *
	 * @default {docker: {}}
	 */
	builder?: Builder;
}

export type Builder = DockerBuilder | PackBuilder | KubectlBuildKitBuilder | KoBuilder | BazelBuilder;

export interface DockerBuilder {
	docker:
		| {
				/**
				 * Using this integration requires:
				 *
				 * - Docker - https://docs.docker.com/get-docker
				 *
				 * The Docker CLI must be on the `$PATH`.
				 */
				build?: DockerBuildOptions;
		  }
		| {
				/**
				 * Available as of v0.34.0+
				 *
				 * Using this integration requires:
				 *
				 * - Docker - https://docs.docker.com/get-docker
				 * - Docker buildx plugin
				 *
				 * The Docker CLI must be on the `$PATH`.
				 */
				buildx?: DockerBuildxOptions;
		  };
}

export interface DockerBuildOptions {
	/**
	 * The target build stage to build
	 */
	target?: string;
	/**
	 * Always attempt to pull a newer version of the image.
	 *
	 * @default false
	 */
	pull?: boolean;
	/**
	 * Do not use cache when building the image.
	 *
	 * @default false
	 */
	noCache?: boolean;
	/**
	 * Name of the Dockerfile.
	 *
	 * @default "Dockerfile"
	 */
	file?: string;
	/**
	 * Enable BuildKit for this build.
	 *
	 * @default false
	 */
	buildkit?: boolean;
	/**
	 * Refer to `docker build` reference for all available options
	 *
	 * @default []
	 */
	rawOptions?: string[];
}

export interface DockerBuildxOptions {
	/**
	 * The target build stage to build.
	 */
	target?: string;
	/**
	 * Always attempt to pull a newer version of the image.
	 *
	 * @default false
	 */
	pull?: boolean;
	/**
	 * Do not use cache when building the image.
	 *
	 * @default false
	 */
	noCache?: boolean;
	/**
	 * Name of the Dockerfile.
	 *
	 * @default "Dockerfile"
	 */
	file?: string;
	/**
	 * Refer to `docker buildx build` reference for all available options
	 *
	 * @default []
	 */
	rawOptions?: string[];
}

export interface PackBuilder {
	/**
	 * Using this integration requires:
	 *
	 * - Docker - https://docs.docker.com/get-docker
	 * - Pack - https://buildpacks.io/docs/tools/pack/
	 *
	 * The Pack CLI must be on the `$PATH`.
	 */
	pack: {
		build: {
			/**
			 * Set builder image.
			 */
			builder: string;
			/**
			 * Set list of buildpacks to be used.
			 */
			buildpacks?: string[];
			/**
			 * Clear cache before building image.
			 *
			 * @default false
			 */
			clearCache?: boolean;
			/**
			 * Refer to `pack build -h` for all available flags.
			 *
			 * @default []
			 */
			rawOptions?: string[];
		};
	};
}

export interface KubectlBuildKitBuilder {
	/**
	 * Available as of v0.28.0+
	 *
	 * Using this integration requires:
	 *
	 * - kubectl - https://kubernetes.io/docs/tasks/tools/
	 * - Buildkit for kubectl - https://github.com/vmware-tanzu/buildkit-cli-for-kubectl#installing-the-tarball (kbld v0.28.0+ is tested with buildkit-for-kubectl v0.1.0, but may work well with other versions.)
	 *
	 * The `kubectl` CLI must be on the `$PATH`.
	 */
	kubectlBuildkit: {
		build?: {
			/**
			 * Set the target build stage to build.
			 */
			target?: string;
			/**
			 * Always attempt to pull a newer version of the image.
			 *
			 * @default false
			 */
			pull?: boolean;
			/**
			 * Do not use cache when building the image.
			 *
			 * @default false
			 */
			noCache?: boolean;
			/**
			 * Name of the Dockerfile.
			 *
			 * @default "Dockerfile"
			 */
			file?: string;
			/**
			 * Refer to `kubectl buildkit build -h` for all available options.
			 *
			 * @default []
			 */
			rawOptions?: string[];
		};
	};
}

export interface KoBuilder {
	/**
	 * Available as of v0.28.0+
	 *
	 * Using this integration requires:
	 *
	 * - ko - https://github.com/google/ko (kbld v0.28.0+ is tested with ko v0.8.0, but may work well with other versions.)
	 *
	 * The `ko` CLI must be on the `$PATH`.
	 */
	ko: {
		build?: {
			/**
			 * Refer to `kubectl buildkit build -h` for all available options.
			 *
			 * @default []
			 */
			rawOptions?: string[];
		};
	};
}

export interface BazelBuilder {
	/**
	 * Available as of v0.31.0+
	 *
	 * Using this integration requires:
	 *
	 * - Docker - https://docs.docker.com/get-docker
	 * - Bazel - https://docs.bazel.build/versions/main/install.html (kbld v0.31.0+ is tested with Bazel v4.2.0 and Container Image Rules v0.18.0, but may work well with other versions.)
	 *
	 * The `bazel` CLI must be on the `$PATH`.
	 */
	bazel: {
		build: {
			/**
			 * Bazel build target; when passed to `bazel run` will build and load the desired image.
			 */
			target: string;
			/**
			 * Refer to https://docs.bazel.build/versions/main/user-manual.html for all available options.
			 *
			 * @default []
			 */
			rawOptions?: string[];
		};
	};
}

export interface Destination {
	/**
	 * Exact value found while searching for container image references.
	 */
	image: string;
	/**
	 * Image destination (i.e. fully qualified registry location for the image).
	 */
	newImage: string;
	/**
	 * Tags to apply to pushed images. (v0.26.0+)
	 *
	 * @default []
	 */
	tags?: string[];
}
