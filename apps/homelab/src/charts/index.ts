import { type ChartProps } from "cdk8s";
import { Construct } from "constructs";
import { ImageBuilder, setupImageBuilderContext } from "../constructs/image-builder";
import { setupConfigContext, type Config } from "../schema/config";
import { commonLabels } from "../utils/common-metadata";
import { createContext } from "../utils/contexts";
import { setupEnvironmentContext, type Environment } from "../utils/environment";
import { AppsChartsConstruct } from "./apps";
import { CoreChartsConstruct } from "./core";
import { SystemChartsConstruct } from "./system";
import { setupCertificateStoreChartContext } from "./system/certificate-store";
import { setupDNSOverridesChartContext } from "./system/dns-overrides";
import { setupNamespacesChartContext } from "./system/namespaces";

const RootConstructContext = createContext<RootConstruct>("RootConstruct");
export function getRootConstruct(scope: Construct): RootConstruct {
	return RootConstructContext.get(scope);
}

export interface RootConstructProps {
	config: Config;
	environment: Environment;
	defaultChartProps: ChartProps;
	defaultNamespaceName: string;
}

export class RootConstruct extends Construct {
	system: SystemChartsConstruct;
	core: CoreChartsConstruct;
	apps: AppsChartsConstruct;

	imageBuilder: ImageBuilder;

	constructor(scope: Construct, { config, environment, defaultNamespaceName, defaultChartProps }: RootConstructProps) {
		super(scope, "default");

		defaultChartProps = {
			...defaultChartProps,
			labels: { ...commonLabels.cdk(), ...defaultChartProps.labels },
		};

		RootConstructContext.set(this, this);

		setupConfigContext(this, config);
		setupEnvironmentContext(this, environment);
		setupImageBuilderContext(this);
		setupNamespacesChartContext(this, { defaultNamespaceName });
		setupDNSOverridesChartContext(this);
		setupCertificateStoreChartContext(this);

		this.system = new SystemChartsConstruct(this, "sys", { defaultChartProps });
		this.core = new CoreChartsConstruct(this, "core", { defaultChartProps });
		this.apps = new AppsChartsConstruct(this, "apps", { defaultChartProps });

		this.imageBuilder = new ImageBuilder(this, "kbld-config", defaultChartProps);
	}
}
