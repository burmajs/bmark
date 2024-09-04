import type { Converter } from "../converter.js";
import type { ShowdownExtension } from "../extensions.js";
import type { GlobalConverter } from "../globals.js";
import type { ConverterOptions } from "../options.js";
/**
 * Run a single extension.
 * @param {string} text The text to be processed by the extension.
 * @param {ConverterOptions} options The conversion options.
 * @param {GlobalConverter} globals The globals object.
 * @param {ShowdownExtension} ext The extension.
 * @returns {string} The processed text.
 */
export function runExtension(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
	ext: ShowdownExtension,
): string {
	if (ext?.filter) {
		text = ext.filter(text, globals.converter as Converter, options);
	} else if (ext?.regex) {
		// TODO remove this when old extension loading mechanism is deprecated
		let re = ext.regex;
		if (!(re instanceof RegExp)) {
			re = new RegExp(re, "g");
		}
		text = text.replace(re, ext.replace);
	}

	return text;
}
