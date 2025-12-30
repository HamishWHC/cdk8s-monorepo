import type { Construct } from "constructs";

export function createContext<T>(key: string, options?: { errorOnMissing?: string }) {
	return {
		get(scope: Construct): T {
			try {
				return scope.node.getContext(key);
			} catch (e) {
				if (options?.errorOnMissing) {
					throw new Error(options.errorOnMissing, { cause: e });
				}
				throw e;
			}
		},
		tryGet(scope: Construct): T | null {
			try {
				return scope.node.getContext(key);
			} catch {
				return null;
			}
		},
		set(scope: Construct, value: T) {
			scope.node.setContext(key, value);
		},
	};
}
