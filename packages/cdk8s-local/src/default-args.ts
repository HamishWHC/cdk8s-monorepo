import { boolean, flag } from "cmd-ts";

export const defaultArgs = {
	recreate: flag({
		type: boolean,
		long: "recreate",
		short: "r",
		description: "delete and recreate the local cluster",
	}),
};
export type DefaultArgs = typeof defaultArgs;
