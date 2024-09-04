import type { GlobalConverter } from "../globals.js";
import type { ConverterOptions } from "../options.js";

/**
 * #### Unescapes special characters that were escaped by the escapeSpecialCharsWithinTagAttributes parser.
 *
 * This function is the inverse of escapeSpecialCharsWithinTagAttributes, and is called after all other
 * transformations have been completed. It unescapes all special characters that were escaped by
 * escapeSpecialCharsWithinTagAttributes, and returns the resulting string.
 *
 * @param text The text to unescape
 * @param options The conversion options
 * @param globals The global converter state
 * @returns The unescaped text
 */
export function unescapeSpecialChars(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	text = globals.converter
		?._dispatch("unescapeSpecialChars.before", text, options, globals)
		.getText() as string;

	text = text.replace(/¨E(\d+)E/g, (wholeMatch, m1) => {
		const charCodeToReplace = Number.parseInt(m1);
		return String.fromCharCode(charCodeToReplace);
	});

	text = globals.converter
		?._dispatch("unescapeSpecialChars.after", text, options, globals)
		.getText() as string;
	return text;
}
