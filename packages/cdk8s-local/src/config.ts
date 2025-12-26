import type { App } from "cdk8s";

export interface Config {
	synth: () => App;
}
