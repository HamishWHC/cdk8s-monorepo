/**
 * Returns a promise that resolves after `ms` milliseconds.
 */
export const delay = (ms: number) =>
	new Promise((res) => {
		setTimeout(res, ms);
	});
