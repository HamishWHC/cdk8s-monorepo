import { $ } from "bun";

export const HELM_REPOS = [
	{ repo: "jetstack", url: "https://charts.jetstack.io" },
	{
		repo: "external-dns",
		url: "https://kubernetes-sigs.github.io/external-dns/",
	},
	{ repo: "cilium", url: "https://helm.cilium.io/" },
	{ repo: "cnpg", url: "https://cloudnative-pg.github.io/charts" },
	{ repo: "authelia", url: "https://charts.authelia.com" },
	{ repo: "openebs", url: "https://openebs.github.io/openebs" },
];

export const addHelmRepos = async () => {
	for (const { repo, url } of HELM_REPOS) {
		await $`helm repo add ${repo} ${url}`.quiet();
	}
};
