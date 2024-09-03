import type { GlobalConverter } from "../globals.js";
import { helpers } from "../helpers.js";
import type { ConverterOptions } from "../options.js";

/**
 * Replaces all occurrences of `\` with `\\`, and all occurrences of
 * backslash-escaped special characters with their escaped form, e.g. `\\*` with
 * `\\*`.
 *
 * @param text The text to escape
 * @param options The options object
 * @param globals The global converter state
 * @returns The escaped text
 */
export function encodeBackslashEscapes(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	text = globals.converter
		?._dispatch("encodeBackslashEscapes.before", text, options, globals)
		.getText() as string;

	text = text.replace(/\\(\\)/g, helpers.escapeCharactersCallback);
	text = text.replace(
		/\\([`*_{}\[\]()>#+.!~=|:-])/g,
		helpers.escapeCharactersCallback,
	);

	text = globals.converter
		?._dispatch("encodeBackslashEscapes.after", text, options, globals)
		.getText() as string;
	return text;
}
