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
		return text;
	}

	text = globals.converter
		?._dispatch("underline.before", text, options, globals)
		.getText() as string;

	if (options.underscores) {
		text = text.replace(
			/\b___(\S[\s\S]*?)___\b/g,
			(wm, txt) => `<u>${txt}</u>`,
		);
		text = text.replace(/\b__(\S[\s\S]*?)__\b/g, (wm, txt) => `<u>${txt}</u>`);
	} else {
		text = text.replace(/___(\S[\s\S]*?)___/g, (wm, m) =>
			/\S$/.test(m) ? `<u>${m}</u>` : wm,
		);
		text = text.replace(/__(\S[\s\S]*?)__/g, (wm, m) =>
			/\S$/.test(m) ? `<u>${m}</u>` : wm,
		);
	}

	// escape remaining underscores to prevent them being parsed by italic and bold
	text = text.replace(/(_)/g, helpers.escapeCharactersCallback);

	text = globals.converter
		?._dispatch("underline.after", text, options, globals)
		.getText() as string;

	return text;
}
