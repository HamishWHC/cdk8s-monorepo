export function objectMap<T extends object, U>(
	obj: T,
	fn: (key: keyof T, value: T[keyof T]) => U,
): { [K in keyof T]: U } {
	const result = {} as { [K in keyof T]: U };
	for (const key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			result[key] = fn(key, obj[key]);
		}
	}
	return result;
}
