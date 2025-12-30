import { createContext } from "cdk-typed-context";
import { Chart, type ChartProps } from "cdk8s";
import { KbldConfig, type KbldConfigProps } from "cdk8s-kbld";
import type { Destination, Source } from "cdk8s-kbld/types";
import { Construct } from "constructs";
import { getConfig } from "../schema/config";

export interface ImageBuildOptions {
	name: string;
	context: string;
	dockerfile?: string;
	target?: string;
	args?: string[];
	noCache?: boolean;
	pull?: boolean;
}

export interface ImageBuildInfo {
	source: Source;
	destination: Destination;
}

const ImageBuilderContext = createContext<ImageBuildInfo[]>("ImageBuilder", {
	errorOnMissing: "`ImageBuilder` has not been setup for this construct tree.",
});

export function setupImageBuilderContext(scope: Construct) {
	ImageBuilderContext.set(scope, []);
}

export const image = (scope: Construct, options: ImageBuildOptions) => {
	const config = getConfig(scope);
	const images = ImageBuilderContext.get(scope);

	const dest = config.images.destination;
	if (dest.endsWith("/")) {
		dest.substring(0, dest.length - 1);
	}

	images.push({
		source: {
			image: options.name,
			path: options.context,
			builder: {
				docker: {
					buildx: {
						file: options.dockerfile,
						target: options.target,
						rawOptions: options.args,
						noCache: options.noCache ?? config.images.noCache,
						pull: options.pull ?? config.images.pull,
					},
				},
			},
		},
		destination: {
			image: options.name,
			newImage: `${config.images.destination}/${options.name}`,
		},
	});

	return { name: options.name };
};

export interface ImageBuilderProps extends ChartProps {
	additionalOptions?: KbldConfigProps;
}

export class ImageBuilder extends Chart {
	kbldConfig: KbldConfig;

	constructor(scope: Construct, id: string, props: ImageBuilderProps = {}) {
		super(scope, id);

		const images = ImageBuilderContext.get(scope);
		this.kbldConfig = new KbldConfig(this, "default", {
			...props.additionalOptions,
			sources: [...(props.additionalOptions?.sources ?? []), ...images.map((i) => i.source)],
			destinations: [...(props.additionalOptions?.destinations ?? []), ...images.map((i) => i.destination)],
		});
	}
}
