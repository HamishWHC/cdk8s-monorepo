import { boolean, flag } from "cmd-ts";

export const defaultArgs = {
	recreate: flag({
		type: boolean,
		short: "r",
		long: "recreate",
		description: "delete and recreate the local cluster",
	}),
	synth: flag({
		type: boolean,
		short: "s",
		long: "synth",
		description: "only run the synth step, skip build and deploy steps (will skip cluster creation)",
	}),
	build: flag({
		type: boolean,
		short: "b",
		long: "build",
		description: "only run the synth and build (and push) steps, skip deploy step (will NOT skip cluster creation)",
	}),
};
export type DefaultArgs = typeof defaultArgs;
