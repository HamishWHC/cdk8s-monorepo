import { logger } from "@repo/utils/logger";
import { $ } from "bun";

export const CommonRequirements = {
	HELM: { name: "helm", url: "https://helm.sh/docs/intro/install/" },
};

export const DEFAULT_REQUIREMENTS = [
	// Local dev.
	{ name: "k3d", url: "https://k3d.io/stable/#releases" },
	// Image building.
	{ name: "kbld", url: "https://carvel.dev/kbld/" },
	{
		name: "docker",
		url: "https://docs.docker.com/desktop/install/mac-install/",
	},
	// Deployment.
	{
		name: "kubectl",
		url: "https://kubernetes.io/docs/tasks/tools/#kubectl",
	},
	{ name: "kapp", url: "https://carvel.dev/kapp/" },
];

const isInstalled = async (name: string) => (await $`which ${name}`.throws(false).quiet()).exitCode === 0;

export interface RequiredProgram {
	name: string;
	url: string;
}

export const checkRequirements = async (requirements: RequiredProgram[]) => {
	let hasPrereqs = true;
	for (const { name, url } of requirements) {
		if (!(await isInstalled(name))) {
			logger.error(`Missing ${name}. You can install it from ${url}.`);
			hasPrereqs = false;
		}
	}

	if (!hasPrereqs) {
		logger.error("Please install the missing programs and try again.");
		throw new Error("Missing required programs");
	}
};
