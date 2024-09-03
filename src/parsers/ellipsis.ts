import type { GlobalConverter } from "../globals.js";
import type { ConverterOptions } from "../options.js";

/**
 * #### Replace all occurrences of three dots (...) with an ellipsis character (…)
 *
 * @param text - The text to replace the ellipsis in
 * @param options - The options passed to the converter
 * @param globals - The object containing the converter's state
 * @returns The text with the ellipsis characters replaced
 */
export function ellipsis(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	// Before doing anything, let any registered extensions run
	text = globals.converter
		?._dispatch("ellipsis.before", text, options, globals)
		.getText() as string;

	// Replace all occurrences of three dots (...) with an ellipsis character (…)
	// This is done by replacing the dots with the ellipsis character, and then
	// replacing any remaining three dots with the ellipsis character
	// This is done to handle cases like "..." where the dots are not separated
	// by any spaces
	text = text.replace(/\.\.\./g, "…");

	// After doing everything, let any registered extensions run
	text = globals.converter
		?._dispatch("ellipsis.after", text, options, globals)
		.getText() as string;

	// Return the text with the ellipsis characters replaced
	return text;
}
