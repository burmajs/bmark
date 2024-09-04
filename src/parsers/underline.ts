import type { GlobalConverter } from "../globals.js";
import { helpers } from "../helpers.js";
import type { ConverterOptions } from "../options.js";
/**
 * #### This function is used by the `Converter` to parse underscores and tilde
 * characters into underline HTML.
 *
 * It takes a string of text and returns a string with the underscores and tilde
 * characters replaced with `<u>` and `</u>`.
 *
 * If `options.underline` is `false`, this function will return the input string.
 *
 * If `options.underscores` is `true`, this function will parse double and triple
 * underscores as underlines. Otherwise, it will parse double and triple tilde
 * characters as underlines.
 *
 * The regular expressions used here are designed to only match whole words, so
 * that underscores within words are not replaced with `<u>` tags.
 *
 * After the replacement, any remaining underscores are escaped to prevent them
 * being parsed by italic and bold.
 *
 * @param text The text to parse
 * @param options The conversion options
 * @param globals The global converter state
 * @returns The parsed text
 */
export function underline(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	if (!options.underline) {
		// If underline parsing is disabled, return the input string
		return text;
	}

	// Get the text after any pre-processing
	text = globals.converter
		?._dispatch("underline.before", text, options, globals)
		.getText() as string;

	// If underscores should be parsed as underlines
	if (options.underscores) {
		// Double and triple underscores are parsed as underlines
		text = text.replace(
			/\b___(\S[\s\S]*?)___\b/g,
			(wm, txt) => `<u>${txt}</u>`,
		);
		text = text.replace(/\b__(\S[\s\S]*?)__\b/g, (wm, txt) => `<u>${txt}</u>`);
	} else {
		// Double and triple tilde characters are parsed as underlines
		text = text.replace(/___(\S[\s\S]*?)___/g, (wm, m) =>
			/\S$/.test(m) ? `<u>${m}</u>` : wm,
		);
		text = text.replace(/__(\S[\s\S]*?)__/g, (wm, m) =>
			/\S$/.test(m) ? `<u>${m}</u>` : wm,
		);
	}

	// Escape any remaining underscores to prevent them being parsed by italic and bold
	text = text.replace(/(_)/g, helpers.escapeCharactersCallback);

	// Get the text after any post-processing
	text = globals.converter
		?._dispatch("underline.after", text, options, globals)
		.getText() as string;

	return text;
}
