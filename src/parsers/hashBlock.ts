import type { GlobalConverter } from "../globals.js";
import type { ConverterOptions } from "../options.js";

/**
 * Hashes a block of text. This is used to temporarily replace HTML blocks
 * and spans with a marker, so that we can safely process the rest of the
 * Markdown parser.
 *
 * @param text - The text block to be hashed
 * @param options - The Markdown options
 * @param globals - The global Markdown converter
 *
 * @returns The hashed text block
 */
export function hashBlock(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	// Before we start, give the converter a chance to modify the text
	text = globals.converter
		?._dispatch("hashBlock.before", text, options, globals)
		.getText() as string;

	// Remove leading and trailing whitespace
	text = text.replace(/(^\n+|\n+$)/g, "");

	// Push the block text onto the gHtmlBlocks array and get its index
	const index = globals.gHtmlBlocks.push(text) - 1;

	// Replace the block text with a marker ("¨KxK" where x is its index)
	// This allows us to temporarily replace the block with a marker, so that
	// we can safely process the rest of the Markdown parser.
	text = `\n\n¨K${index}K\n\n`;

	// After we've done our work, give the converter a chance to modify the text again
	text = globals.converter
		?._dispatch("hashBlock.after", text, options, globals)
		.getText() as string;

	return text;
}
