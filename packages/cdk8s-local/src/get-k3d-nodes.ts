import { $ } from "bun";

export interface HostBinding {
	HostIp: string;
	HostPort: string;
}

export interface K3dNode {
	name: string;
	role: "server" | "agent" | "loadbalancer" | "registry";
	portMappings: Record<string, HostBinding[]>;
}

export async function getK3dNodes(clusterName: string): Promise<K3dNode[]> {
	const nodes: K3dNode[] = await $`k3d node list -o json`.json();
	return nodes;
}
