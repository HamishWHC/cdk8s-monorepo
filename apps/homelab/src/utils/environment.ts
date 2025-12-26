import type { Construct } from "constructs";
import { createContext } from "./contexts";

export interface Environment {
	name: string;
	isK3d: boolean;
}

export const EnvironmentContext = createContext<Environment>("Environment", {
	errorOnMissing: "`setupEnvironmentContext` has not been called for this construct tree.",
});

export function setupEnvironmentContext(scope: Construct, environment: Environment) {
	EnvironmentContext.set(scope, environment);
}

export function getEnvironment(scope: Construct) {
	return EnvironmentContext.get(scope);
}

export function isK3d(scope: Construct) {
	return EnvironmentContext.get(scope).isK3d;
}

export function getEnvironmentName(scope: Construct) {
	return EnvironmentContext.get(scope).name;
}
