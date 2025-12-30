export function randomRegistryName() {
	const randomHex = crypto
		.getRandomValues(new Uint8Array(2))
		.reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");
	return `registry-${randomHex}.k3d.hamishwhc.com`;
}
