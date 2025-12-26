import { regex } from "arktype";
import { $ } from "bun";
import { assert } from "./assert";

const PORT_MAPPING_REGEX = regex(
	"^(?<bind>.*):(?<hostPort>\\d+)->(?<containerPort>\\d+)/(?<protocol>tcp|udp)$|^(?<hostPort>(?<containerPort>\\d+))/(?<protocol>tcp|udp)$",
);

export async function getRegistryPort(containerName: string) {
	const runningDockerContainers = await $`docker ps --format json`.text();

	const containers = runningDockerContainers
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => {
			const parsed = JSON.parse(line);
			assert(typeof parsed == "object", "Docker ps did not return an object");
			assert("Names" in parsed, "Docker ps object missing Names field");
			assert(typeof parsed.Names == "string", "Docker ps Names field is not a string");
			assert("Ports" in parsed, "Docker ps object missing Ports field");
			assert(typeof parsed.Ports == "string", "Docker ps Ports field is not a string");
			return parsed as { Names: string; Ports: string };
		})
		.filter((container) => container.Names === "registry.k3d.hamishwhc.com");
	assert(containers.length === 1, "Could not find unique k3d registry container");

	const portMappings = containers[0]!.Ports.split(", ")
		.map((port) => {
			const match = PORT_MAPPING_REGEX.exec(port);
			assert(match, `Could not parse port mapping: ${port}`);
			return match.groups;
		})
		.filter((mapping) => mapping.containerPort === "5000" && mapping.protocol === "tcp");
	assert(portMappings.length === 1, "Could not find unique port mapping for k3d registry container port 5000/tcp");

	return portMappings[0]!.hostPort;
}
