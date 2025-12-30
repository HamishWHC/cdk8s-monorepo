export function stopwatch() {
	const start = performance.now();
	return () => performance.now() - start;
}
