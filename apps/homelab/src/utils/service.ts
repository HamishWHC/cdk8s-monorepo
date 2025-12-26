import { Service } from "cdk8s-plus-32";

export const getServiceHostname = (service: { name: string; namespace?: string } | Service) =>
	`${service.name}.${(service instanceof Service ? service.metadata.namespace : service.namespace) ?? "default"}.svc.cluster.local`;
