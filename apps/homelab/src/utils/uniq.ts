/**
 * Returns a list of strings with duplicates removed.
 * @param a Array of strings, may be a subtype (e.g. string literal union).
 * @returns New deduplicated array.
 */
export const uniq = <T extends string>(a: T[]) => {
	const seen: Partial<Record<string, true>> = {};
	return a.filter((item) => (item in seen ? false : (seen[item] = true)));
};
