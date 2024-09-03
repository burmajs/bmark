import type { GlobalConverter } from "../globals.js";
import type { ConverterOptions } from "../options.js";

/**
 * Encode special characters that are magic in HTML, or that are not
 * suitable as-is for inclusion in an HTML document.
 *
 * Replaces:
 * - Ampersands (`&`) with `&amp;`
 * - Less-than signs (`<`) with `&lt;`
 * - Greater-than signs (`>`) with `&gt;`
 * - Magic characters in Markdown with their escaped form, e.g. `*` with `\*`
 *
 * @param text The text to encode
 * @param options The conversion options
 * @param globals The global converter state
 * @returns The encoded text
 */
export function encodeAmpsAndAngles(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	text = globals.converter
		?._dispatch("encodeAmpsAndAngles.before", text, options, globals)
		.getText() as string;

	// Ampersand-encoding based entirely on Nat Irons's Amputator MT plugin:
	// http://bumppo.net/projects/amputator/
	text = text.replace(/&(?!#?[xX]?(?:[0-9a-fA-F]+|\w+);)/g, "&amp;");

	// Encode naked <'s
	text = text.replace(/<(?![a-z\/?$!])/gi, "&lt;");

	// Encode <
	text = text.replace(/</g, "&lt;");

	// Encode >
	text = text.replace(/>/g, "&gt;");

	text = globals.converter
		?._dispatch("encodeAmpsAndAngles.after", text, options, globals)
		.getText() as string;
	return text;
}
