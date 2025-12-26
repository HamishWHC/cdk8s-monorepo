import { z } from "zod";
import { DNSName } from "../common";
import { featureToggle } from "./utils";

export const ACMEConfig = featureToggle({
	email: z.email().describe("Email to sign up to the ACME provider with."),
	server: z
		.url()
		.default("https://acme-v02.api.letsencrypt.org/directory")
		.describe("ACME server URL. Defaults to Lets Encrypt."),
});
export type ACMEConfig = z.output<typeof ACMEConfig>;

export const CloudflareCredentials = z.object({
	provider: z.literal("cloudflare"),
	zoneId: z.string(),
	apiToken: z.string(),
});
export type CloudflareCredentials = z.infer<typeof CloudflareCredentials>;

export const DNSCredentials = z
	.discriminatedUnion("provider", [CloudflareCredentials])
	.describe("Credentials for your preferred DNS provider.");
export type DNSCredentials = z.output<typeof DNSCredentials>;

export const DNSProvider = z.literal(["cloudflare"]);
export type DNSProvider = z.output<typeof DNSProvider>;

export const DomainConfig = z.object({
	domain: DNSName,
	credentials: DNSCredentials.nullable(),
});
