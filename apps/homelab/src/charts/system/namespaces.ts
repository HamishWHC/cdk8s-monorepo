import { Chart, type ApiObjectMetadata, type ChartProps } from "cdk8s";
import { Namespace } from "cdk8s-plus-32";
import type { Construct } from "constructs";
import { createContext } from "cdk-typed-context";

export interface NamespacesChartContextOptions {
	defaultNamespaceName: string;
}

export const NamespacesChartContext = createContext<{ chart: NamespacesChart | null } & NamespacesChartContextOptions>(
	"Namespaces",
	{
		errorOnMissing: "`NamespacesChart` has not been setup for this construct tree.",
	},
);

export function setupNamespacesChartContext(scope: Construct, options: NamespacesChartContextOptions) {
	NamespacesChartContext.set(scope, { chart: null, ...options });
}

export function addNamespace(scope: Construct, metadata: ApiObjectMetadata) {
	const ctx = NamespacesChartContext.get(scope);
	if (!ctx.chart) {
		throw new Error("`NamespacesChart` has not been setup for this construct tree.");
	}
	return ctx.chart.addNamespace(scope, metadata);
}

export function getDefaultNamespaceName(scope: Construct) {
	const ctx = NamespacesChartContext.get(scope);
	return ctx.defaultNamespaceName;
}

export class NamespacesChart extends Chart {
	namespaces: Record<string, Namespace> = {};

	constructor(scope: Construct, id: string, props: ChartProps) {
		super(scope, id, props);

		const ctx = NamespacesChartContext.get(scope);
		if (ctx.chart) {
			throw new Error("`NamespacesChart` has already been setup for this construct tree.");
		}

		ctx.chart = this;
	}

	addNamespace(scope: Construct, metadata: ApiObjectMetadata) {
		const ctx = NamespacesChartContext.get(scope);
		const name = metadata.name ?? ctx.defaultNamespaceName;

		if (!(name in this.namespaces) && name !== "default") {
			let chart: Chart | null;
			try {
				chart = Chart.of(scope);
			} catch (e) {
				chart = null;
			}

			this.namespaces[name] = new Namespace(this, name, {
				metadata: {
					...metadata,
					labels: {
						...chart?.labels,
						...metadata.labels,
					},
				},
			});
		}
	}
}
