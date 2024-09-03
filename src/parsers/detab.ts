import type { GlobalConverter } from "../globals.js";
import type { ConverterOptions } from "../options.js";

/**
 * #### Expand tabs in the input string.
 *
 * The strategy here is to avoid using a regex with a variable number of
 * repetitions (which would be potentially catastrophic for performance) by
 * doing the following:
 *
 * - Expand all but the last tab on each line by replacing them with four
 *   spaces. This leaves us with the following scenario:
 *
 *     a\tb\tc\t\td
 *
 *   Becomes:
 *
 *     a   b   c   d
 *
 * - Replace the last tab on each line with two sentinels: "¨A¨B". This gives
 *   us:
 *
 *     a   b   c   ¨A¨Bd
 *
 * - Now, we can use the sentinels as anchors for a regex that will calculate
 *   the correct number of spaces to add after the last tab on each line. That
 *   regex looks like this:
 *
 *     /¨B(.+?)¨A/g
 *
 *   This will match the last tab on each line, and the text that comes after
 *   it. We then calculate the number of spaces we need to add to complete the
 *   last tab, and add them after the last tab.
 *
 * - Finally, we clean up the sentinels.
 *
 * @param text - input string
 * @param options - converter options
 * @param globals - converter globals
 * @returns string with tabs expanded
 */
export function detab(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	let tx = text;
	tx = globals.converter
		?._dispatch("detab.before", tx, options, globals)
		.getText() as string;

	// expand first n-1 tabs
	tx = tx.replace(/\t(?=\t)/g, "    "); // g_tab_width

	// replace the nth with two sentinels
	tx = tx.replace(/\t/g, "¨A¨B");

	// use the sentinel to anchor our regex so it doesn't explode
	tx = tx.replace(/¨B(.+?)¨A/g, (wholeMatch, m1) => {
		let leadingText = m1;
		const numSpaces = 4 - (leadingText.length % 4); // g_tab_width

		// there *must* be a better way to do this:
		for (let i = 0; i < numSpaces; i++) {
			leadingText += " ";
		}

		return leadingText;
	});

	// clean up sentinels
	tx = tx.replace(/¨A/g, "    "); // g_tab_width
	text = tx.replace(/¨B/g, "");

	tx = globals.converter
		?._dispatch("detab.after", tx, options, globals)
		.getText() as string;
	return tx;
}
