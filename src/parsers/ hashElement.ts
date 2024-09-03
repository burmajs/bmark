import type { GlobalConverter } from "../globals.js";
import type { ConverterOptions } from "../options.js";

/**
 * #### This function is used by the hashHTMLBlocks and hashHTMLSpans functions as a replacement function.
 *
 * It takes a string of text and returns a function which takes a whole match and
 * a first match as arguments. The function returns a string which is the first
 * match with:
 * 1. Double lines removed (i.e. collapse multiple newlines into a single one)
 * 2. Leading and trailing blank lines removed
 * 3. A marker ("¨KxK" where x is its key) inserted instead of the first match
 *
 * The purpose of this function is to temporarily replace HTML blocks and spans
 * with a marker, so that they can be safely processed by the rest of the
 * Markdown parser.
 *
 * @param {string} text - The text to be processed.
 * @param {ConverterOptions} options - The Markdown options.
 * @param {GlobalConverter} globals - The global Markdown converter.
 *
 * @returns {(wholeMatch: string, m1: string) => string} - A function which takes
 * a whole match and a first match as arguments and returns a string which is the
 * first match with double lines removed, leading and trailing blank lines
 * removed, and a marker inserted instead of the first match.
 */
export function hashElement(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): (wholeMatch: string, m1: string) => string {
	return (wholeMatch: string, m1: string) => {
		let blockText: string = m1;

		// Undo double lines
		// Collapse multiple newlines into a single one
		blockText = blockText.replace(/\n\n/g, "\n");

		// strip leading blank lines
		// remove all leading newlines
		blockText = blockText.replace(/^\n+/, "");

		// strip trailing blank lines
		// remove all trailing newlines
		blockText = blockText.replace(/\n+$/g, "");

		// Replace the element text with a marker ("¨KxK" where x is its key)
		// Push the blockText onto the gHtmlBlocks array and get its index
		// Then use that index to create a marker which we can use to replace the
		// blockText with
		blockText = `\n\n¨K${globals.gHtmlBlocks.push(blockText) - 1}K\n\n`;

		return blockText;
	};
}
// npx biome check --write src/parsers
