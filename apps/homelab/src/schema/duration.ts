import { Duration } from "cdk8s";
import { z } from "zod";

const durationRegex = /^((?<days>[0-9]+)d)?((?<hours>[0-9]+)h)?((?<minutes>[0-9]+)m)?((?<seconds>[0-9]+)s)?$/;
export const parseDuration = (s: string) => {
	const result = durationRegex.exec(s);
	if (result === null) {
		throw new Error(`Could not parse duration: ${s}`);
	}

	return Duration.seconds(
		[
			86400 * Number(result.groups?.["days"] ?? "0"),
			3600 * Number(result.groups?.["hours"] ?? "0"),
			60 * Number(result.groups?.["minutes"] ?? "0"),
			// sad this line isn't one char longer.
			1 * Number(result.groups?.["seconds"] ?? "0"),
		].reduce((a, b) => a + b, 0),
	);
};

export const DurationFromString = z.string().regex(durationRegex).transform(parseDuration);

export const formatDuration = (d: Duration) => {
	return `${d.toMilliseconds()}ms`;
};
