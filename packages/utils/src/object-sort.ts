export function objectSort<T extends object, U>(
	obj: T,
	fn: (a: [keyof T, T[keyof T]], b: [keyof T, T[keyof T]]) => number,
): { [K in keyof T]: T[keyof T] } {
	const entries = [] as [keyof T, T[keyof T]][];
	for (const key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			entries.push([key, obj[key]]);
		}
	}

	entries.sort(fn);

	const result = {} as { [K in keyof T]: T[keyof T] };
	for (const [key, value] of entries) {
		result[key] = value;
	}
	return result;
}
