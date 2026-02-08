import { objectMap } from "./object-map";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function publishSourceCustomExports(exports: Record<string, any>) {
	return objectMap(exports, (key, value) => {
		const obj = typeof value === "string" ? { default: value } : value;
		delete obj["bun"];
		const bun = obj["default"].replaceAll(/.\/dist\//g, "./src/").replaceAll(/\.mjs/g, ".ts");
		return bun !== obj["default"] ? { bun, ...obj } : value;
	});
}
