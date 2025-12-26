import { $ } from "bun";
import { OUT_DIR } from "./paths";

export const build = async () => {
	await $`kbld -f ${OUT_DIR}`;
};
