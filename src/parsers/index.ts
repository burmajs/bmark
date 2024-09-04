import type { ShowdownExtension } from "../extensions.js";
import type { GlobalConverter } from "../globals.js";
import { helpers } from "../helpers.js";
import type { ConverterOptions } from "../options.js";
import {
	githubCodeBlocks,
	hashCodeTags,
	hashPreCodeTags,
} from "./codeBlocks.js";
import { detab } from "./detab.js";
import { unhashHTMLSpans } from "./hashHTMLSpans.js";
import { blockGamut, hashHTMLBlocks } from "./htmlElements.js";
import { runExtension } from "./runExtension.js";
import { stripLinkDefinitions } from "./stripLinkDefinitions.js";
import { unescapeSpecialChars } from "./unescapeSpecialChars.js";
import { wrapper } from "./wrapper.js";

/**
 * Trims leading whitespace from the input text.
 * @param text - The text to trim.
 * @returns The text with leading whitespace removed.
 */
function rTrimInputText(text: string): string {
	const leadingWhitespaceMatch = text.match(/^\s*/) as RegExpMatchArray;
	const rsp = leadingWhitespaceMatch[0].length;
	const rgx = new RegExp(`^\\s{0,${rsp}}`, "gm");
	return text.replace(rgx, "");
}
/**
 * Main entry point for the parser.
 * @param text - The text to parse.
 * @param options - The conversion options.
 * @param globals - The globals object.
 * @param langExtensions - An array of language extensions to run.
 * @returns The parsed text.
 */
export function markdownParser(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
	langExtensions?: ShowdownExtension[],
	outputModifiers?: GlobalConverter["outputModifiers"],
): string {
	text = text.replace(/¨/g, "¨T");
	text = text.replace(/\$/g, "¨D");
	text = text.replace(/\r\n/g, "\n");
	text = text.replace(/\r/g, "\n");
	text = text.replace(/\u00A0/g, "&nbsp;");
	text = rTrimInputText(text);
	text = `\n\n${text}\n\n`;
	text = detab(text, options, globals);
	text = text.replace(/^[ \t]+$/gm, "");
	helpers.forEach(langExtensions, (ext: any) => {
		text = runExtension(text, options, globals, ext);
	});
	text = hashPreCodeTags(text, options, globals);
	text = githubCodeBlocks(text, options, globals);
	text = hashHTMLBlocks(text, options, globals);
	text = hashCodeTags(text, options, globals);
	text = stripLinkDefinitions(text, options, globals);
	text = blockGamut(text, options, globals);
	text = unhashHTMLSpans(text, options, globals);
	text = unescapeSpecialChars(text, options, globals);
	text = text.replace(/¨D/g, "$$");
	text = text.replace(/¨T/g, "¨");
	text = wrapper(text, options, globals);
	helpers.forEach(outputModifiers, (ext: any) => {
		text = runExtension(text, options, globals, ext);
	});
	return text;
}
