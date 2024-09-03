import type { GlobalConverter } from "../globals.js";
import { helpers } from "../helpers.js";
import type { ConverterOptions } from "../options.js";

/**
 * #### Encode special characters that are magic in Markdown, or that are not suitable as-is for inclusion in an HTML `<code>` span.
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
export function encodeCode(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	text = globals.converter
		?._dispatch("encodeCode.before", text, options, globals)
		.getText() as string;

	// Encode all ampersands; HTML entities are not
	// entities within a Markdown code span.
	text = text
		.replace(/&/g, "&amp;")
		// Do the angle bracket song and dance:
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		// Now, escape characters that are magic in Markdown:
		.replace(/([*_{}\[\]\\=~-])/g, helpers.escapeCharactersCallback);
	text = globals.converter
		?._dispatch("encodeCode.after", text, options, globals)
		.getText() as string;

	return text;
}
