import { Cpu } from "cdk8s-plus-32";
import { z } from "zod";

const cpuRegex = /^([0-9]+) ?(m?)$/;
const parseCpu = (s: string) => {
	const result = cpuRegex.exec(s);
	if (result === null) {
		throw new Error(`Could not parse size: ${s}`);
	}

	if (result[2] === "m") {
		return Cpu.millis(Number(result[1]));
	} else {
		return Cpu.units(Number(result[1]));
	}
};

export const CpuFromString = z.string().regex(cpuRegex).transform(parseCpu);
