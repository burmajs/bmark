import type { GlobalConverter } from "../globals.js";
import type { ConverterOptions } from "../options.js";

/**
 * #### Parses strikethrough text.
 *
 * @param {string} text - the text to parse
 * @param {ConverterOptions} options - the conversion options
 * @param {GlobalConverter} globals - the global converter
 * @returns {string} the parsed text
 */
export function strikethrough(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	text = globals.converter
		?._dispatch("strikethrough.before", text, options, globals)
		.getText() as string;
	text = text.replace(
		/(?:~){2}([\s\S]+?)(?:~){2}/g,
		(wm, txt) => `<del>${txt}</del>`,
	);
	text = globals.converter
		?._dispatch("strikethrough.after", text, options, globals)
		.getText() as string;

	return text;
}
