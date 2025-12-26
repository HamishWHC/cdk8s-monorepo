export const sanitiseRFC1123Label = (s: string) =>
	s
		.toLowerCase()
		.replaceAll(/[/_.]/g, "-")
		.replaceAll(/[^a-z0-9-]/g, "");
