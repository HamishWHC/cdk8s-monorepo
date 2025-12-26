import { z } from "zod";

export const Key = z.string().regex(/^[a-zA-Z0-9-_]+$/);
export const Port = z.number().int().min(1).max(65535);
export const EnvVarName = z.string().regex(/^[A-Z0-9_]+$/);

const rfc1123LabelRegex = /(?!.*-$)(?!^-)^[a-z0-9-]{1,63}$/;
export const RFC1123Label = z.string().refine((s) => rfc1123LabelRegex.test(s));

const rfc1035LabelRegex = /(?!.*-$)(?!^[-0-9])^[a-z0-9-]{1,63}$/;
export const RFC1035Label = z.string().refine((s) => rfc1035LabelRegex.test(s));

const dnsNameRegex = /(?!.*[-.]$)(?!^[-.])^[a-z0-9-.]{1,253}$/;
export const DNSName = z.string().refine((s) => dnsNameRegex.test(s));
export const DNSSubdomainName = DNSName.or(z.literal(""));
