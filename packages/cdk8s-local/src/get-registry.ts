import { getK3dNodes } from "./get-k3d-nodes";

export async function getRegistry(clusterName: string) {
	const nodes = await getK3dNodes(clusterName);
	const registryNode = nodes.find((node) => node.role === "registry");
	if (!registryNode) {
		return null;
	}

	const registryBindings = registryNode.portMappings["5000/tcp"];
	if (!registryBindings || registryBindings.length === 0) {
		return null;
	}

	return {
		name: registryNode.name,
		port: parseInt(registryBindings[0]!.HostPort),
	};
}
