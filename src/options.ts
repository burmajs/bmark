import type { ShowdownExtension } from "./extensions.js";
type ExtType = Array<
	| (() => ShowdownExtension[] | ShowdownExtension)
	| ShowdownExtension[]
	| ShowdownExtension
	| string
>;
export type CoverterOptsValues =
	| boolean
	| string
	| ExtType
	| number
	| undefined;

export type OptionsName =
	| "anchorLinkTarget"
	| "underscores"
	| "underline"
	| "jsx"
	| "ghMentionsLink"
	| "classNmae"
	| "extensions";
export type ConverterObjects =
	| {
			name: "anchorLinkTarget";
			value: "_blank" | "_parent" | "_self" | "_top";
	  }
	| { name: "underscores"; value: boolean }
	| { name: "underline"; value: boolean }
	| { name: "jsx"; value: boolean }
	| { name: "ghMentionsLink"; value: string }
	| { name: "classNmae"; value: string }
	| { name: "extensions"; value: ExtType };
export type ConverterOptions = {
	[key: string]: CoverterOptsValues;
	anchorLinkTarget?: "_blank" | "_parent" | "_self" | "_top";
	underscores?: boolean;
	underline?: boolean;
	jsx?: boolean;
	ghMentionsLink?: string;
	classNmae?: string;
	extensions?: ExtType;
};

const defaultOptions: ConverterOptions = {
	ghMentionsLink: "https://github.com/{u}",
	classNmae: "bmark-markdown",
	anchorLinkTarget: "_self",
	underscores: false,
	underline: true,
	extensions: [],
	jsx: false,
};
export function getDefaultOptions(): ConverterOptions {
	return defaultOptions;
}

export function setDefaultOptions(options: ConverterOptions): ConverterOptions {
	const opts = getDefaultOptions();
	return (options = opts);
}
