import { Logger, type IMeta, type IPrettyLogStyles } from "tslog";

export const logger = new Logger({
	type: "pretty",
	prettyLogTemplate: "{{fourLetterLogLevelName}} ",
	prettyLogStyles: {
		fourLetterLogLevelName: {
			"*": ["bold", "black", "bgWhiteBright", "dim"],
			SILY: ["bold", "white"],
			TRCE: ["bold", "whiteBright"],
			DBUG: ["bold", "green"],
			INFO: ["bold", "blue"],
			WARN: ["bold", "yellow"],
			EROR: ["bold", "red"],
			FATL: ["bold", "redBright"],
		},
	} as IPrettyLogStyles,
	overwrite: {
		addPlaceholders: (logObjMeta: IMeta, placeholderValues: Record<string, string | number>) => {
			placeholderValues["fourLetterLogLevelName"] =
				{
					SILLY: "SILY",
					TRACE: "TRCE",
					DEBUG: "DBUG",
					INFO: "INFO",
					WARN: "WARN",
					ERROR: "EROR",
					FATAL: "FATL",
				}[logObjMeta.logLevelName] ?? logObjMeta.logLevelName.slice(0, 4);
		},
		transportFormatted: (logMetaMarkup, logArgs, logErrors, logMeta) => {
			const logLevel = logMetaMarkup.trim();
			process.stderr.write(`${logLevel} ${logArgs.join(" ")}\n`);
		},
	},
});
