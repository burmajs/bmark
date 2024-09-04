import type { Converter } from "./converter.js";
import type { ShowdownExtension } from "./extensions.js";
export type GlobalConverter = {
	converter?: Converter;
	gDimensions: { [key: string]: { width: number; height: number } };
	gHtmlBlocks: string[];
	gHtmlSpans: string[];
	gHtmlMdBlocks?: string[];
	ghCodeBlocks: Array<{
		codeblock?: string | undefined;
		text?: string | undefined;
	}>;
	gUrls: { [key: string]: string };
	gTitles: { [key: string]: string };
	hashLinkCounts: { [key: string]: string | number };
	gListLevel?: number;
	langExtensions?: ShowdownExtension[];
	outputModifiers?: ShowdownExtension[];
};
