import { $ } from "bun";
import { logger } from "./logging";

export const SYNTH_REQUIRED_PROGRAMS = [{ program: "helm", install: "https://helm.sh/docs/intro/install/" }];

const BUILD_REQUIRED_PROGRAMS = [
	{
		program: "docker",
		install: "https://docs.docker.com/desktop/install/mac-install/",
	},
];

const DEPLOY_REQUIRED_PROGRAMS = [
	{
		program: "kubectl",
		install: "https://kubernetes.io/docs/tasks/tools/#kubectl",
	},
	{ program: "kbld", install: "https://carvel.dev/kbld/" },
	{ program: "kapp", install: "https://carvel.dev/kapp/" },
	{ program: "yq", install: "https://mikefarah.github.io/yq/#install" },
];

export const LOCAL_DEV_REQUIRED_PROGRAMS = [
	{ program: "k3d", install: "https://k3d.io/stable/#releases" },
	...SYNTH_REQUIRED_PROGRAMS,
	...BUILD_REQUIRED_PROGRAMS,
	...DEPLOY_REQUIRED_PROGRAMS,
];

const isInstalled = async (program: string) => (await $`which ${program}`.throws(false).quiet()).exitCode === 0;

export const checkRequirements = async (programs: { program: string; install: string }[]) => {
	let hasPrereqs = true;
	for (const { program, install } of programs) {
		if (!(await isInstalled(program))) {
			logger.error(`Missing ${program}. You can install it from ${install}.`);
			hasPrereqs = false;
		}
	}

	if (!hasPrereqs) {
		logger.error("Please install the missing programs and try again.");
		throw new Error("Missing required programs");
	}
};
