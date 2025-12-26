import { Size } from "cdk8s";
import { z } from "zod";
import { inKeyof } from "../utils/in-keyof";

const sizeRegex = /^([0-9]+) ?(K|M|G|T|P)i?$/;
const parseSize = (s: string) => {
	const result = sizeRegex.exec(s);
	if (result === null) {
		throw new Error(`Could not parse size: ${s}`);
	}

	const num = result[1];
	if (num === undefined || isNaN(Number(num))) {
		throw new Error(`Invalid number in size: ${s}`);
	}

	const sizes = {
		K: Size.kibibytes(Number(num)),
		M: Size.mebibytes(Number(num)),
		G: Size.gibibytes(Number(num)),
		T: Size.tebibytes(Number(num)),
		P: Size.pebibyte(Number(num)),
	};

	const unit = result[2];
	if (unit === undefined || !inKeyof(sizes, unit)) {
		throw new Error(`Invalid unit in size: ${s}`);
	}

	if (["T", "P"].includes(unit)) {
		throw new Error(`ARE YOU SURE ABOUT THAT?! (${s})`);
	}

	return sizes[unit];
};

export const SizeFromString = z.string().regex(sizeRegex).transform(parseSize);
