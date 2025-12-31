export type CommandKey = "local" | "synth";

export interface CommonStartupContext<Args, Key extends CommandKey = CommandKey> {
	/**
	 * Your parsed CLI arguments.
	 */
	args: Args;

	/**
	 * Indicates which command is being executed.
	 */
	command: CommandKey;
}

export interface CommonContext<Args, Data, Key extends CommandKey = CommandKey>
	extends CommonStartupContext<Args, Key> {
	/**
	 * Your custom context data.
	 */
	data: Data;
}
