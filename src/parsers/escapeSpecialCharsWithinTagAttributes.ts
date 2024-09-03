import type { GlobalConverter } from "../globals.js";
import { helpers } from "../helpers.js";
import type { ConverterOptions } from "../options.js";

/**
 * #### Escapes special characters within HTML tags and comments.
 *
 * Replaces:
 * - Ampersands (`&`) with `&amp;`
 * - Less-than signs (`<`) with `&lt;`
 * - Greater-than signs (`>`) with `&gt;`
 * - Backslashes (`\`) with `\\`
 * - Stars (`*`) with `\*`
 * - Tildes (`~`) with `~`
 * - Pipes (`|`) with `\|`
 * - Left angle brackets (`<`) with `&lt;`
 * - Right angle brackets (`>`) with `&gt;`
 * - Left square brackets (`[`) with `&#91;`
 * - Right square brackets (``]`) with `&#93;`
 *
 * @param text The text to escape
 * @param options The conversion options
 * @param globals The global converter state
 * @returns The escaped text
 */
export function escapeSpecialCharsWithinTagAttributes(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	text = globals.converter
		?._dispatch(
			"escapeSpecialCharsWithinTagAttributes.before",
			text,
			options,
			globals,
		)
		.getText() as string;

	// Build a regex to find HTML tags.
	const tags = /<\/?[a-z\d_:-]+(?:[\s]+[\s\S]+?)?>/gi;
	const comments = /<!(--(?:(?:[^>-]|-[^>])(?:[^-]|-[^-])*)--)>/gi;

	text = text.replace(tags, (wholeMatch) =>
		wholeMatch
			.replace(/(.)<\/?code>(?=.)/g, "$1`")
			.replace(/([\\`*_~=|])/g, helpers.escapeCharactersCallback),
	);

	text = text.replace(comments, (wholeMatch) =>
		wholeMatch.replace(/([\\`*_~=|])/g, helpers.escapeCharactersCallback),
	);

	text = globals.converter
		?._dispatch(
			"escapeSpecialCharsWithinTagAttributes.after",
			text,
			options,
			globals,
		)
		.getText() as string;
	return text;
}
