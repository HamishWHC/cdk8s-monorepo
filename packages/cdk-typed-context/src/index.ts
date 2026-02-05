import type { Construct } from "constructs";

export class MissingContextError extends Error {
	constructor(
		public key: string,
		public uniqueKey: string,
		message: string,
		options?: ErrorOptions,
	) {
		super(message, options);
	}
}

export function createContext<T>(key: string, options?: { errorOnMissing?: string }) {
	// We use a unique key internally to avoid naming conflicts.
	const uniqueKey = `${key}:${crypto.randomUUID()}`;

	return {
		get(scope: Construct): T {
			try {
				return scope.node.getContext(uniqueKey);
			} catch (e) {
				if (!(e instanceof Error)) {
					throw e;
				}

				// We replace the unique key with the user-provided key to improve error messages.
				throw new MissingContextError(key, uniqueKey, options?.errorOnMissing ?? e.message.replaceAll(uniqueKey, key), {
					cause: e,
				});
			}
		},
		tryGet(scope: Construct): T | null {
			try {
				return scope.node.getContext(uniqueKey);
			} catch {
				return null;
			}
		},
		set(scope: Construct, value: T): void {
			scope.node.setContext(uniqueKey, value);
		},
	};
}
