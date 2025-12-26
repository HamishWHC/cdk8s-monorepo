import { App, Chart } from "cdk8s";
import { Deployment } from "cdk8s-plus-32";
import { KbldConfig } from "../../src";

const app = new App();

const chart = new Chart(app, "simple-example");

new Deployment(chart, "deployment", {
	containers: [
		{
			image: "some-image-name",
			// ...
		},
		{
			image: "nginx:latest",
			// ...
		},
	],
});

new KbldConfig(chart, "kbld", {
	sources: [
		{
			image: "some-image-name",
			path: "/path/to/build/context",
		},
	],
	destinations: [
		{
			image: "some-image-name",
			newImage: "ghcr.io/your-username/some-image-name",
		},
	],
});

app.synth();
