import type { Converter } from "./converter.js";
import type { ConverterOptions } from "./options.js";
type Extension = {
	type: "lang" | "output" | "listener";
	listeners?: { [event: string]: EventListener };
};

type RegexReplaceExtension = {
	regex?: string | RegExp;
	replace?: any; // string | Replace
};

type FilterExtension = {
	filter?: (
		text: string,
		converter: Converter,
		options?: ConverterOptions,
	) => string;
};

export type ShowdownExtension = Extension &
	RegexReplaceExtension &
	FilterExtension;
export type ShowdownExtensions = {
	[name: string]: ShowdownExtension[];
};
export type ConverterExtensions = {
	language: ShowdownExtension[];
	output: ShowdownExtension[];
};
