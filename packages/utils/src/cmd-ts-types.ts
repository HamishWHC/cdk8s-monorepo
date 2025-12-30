import type { ArgParser, ParsingInto } from "cmd-ts/dist/cjs/argparser";
import type { ProvidesHelp } from "cmd-ts/dist/cjs/helpdoc";

// Taken from cmd-ts's internal types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ArgTypes = Record<string, ArgParser<any> & Partial<ProvidesHelp>>;
export type Output<Args extends ArgTypes> = {
	[key in keyof Args]: ParsingInto<Args[key]>;
};
