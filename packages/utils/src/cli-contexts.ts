export type CommandKey = "local" | "synth";

export interface CommonStartupContext<Args> {
	/**
	 * Your parsed CLI arguments.
	 */
	args: Args;

	/**
	 * Indicates which command is being executed.
	 */
	command: CommandKey;
}

export interface CommonContext<Args, Data> extends CommonStartupContext<Args> {
	/**
	 * Your custom context data.
	 */
	data: Data;
}
