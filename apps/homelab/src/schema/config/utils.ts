import { z, type ZodRawShape } from "zod";

export const featureToggle = <T extends ZodRawShape>(shape: T) =>
	z
		.discriminatedUnion("enable", [
			z.object({
				enable: z.literal(false),
			}),
			z.object(shape).extend({ enable: z.literal(true) }),
		])
		.default({ enable: false });
