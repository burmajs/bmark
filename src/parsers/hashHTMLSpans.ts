import type { GlobalConverter } from "../globals.js";
import { helpers } from "../helpers.js";
import type { ConverterOptions } from "../options.js";
/**
 * Hashes HTML spans in the given text based on the provided options and global converter.
 *
 * @param text The text containing HTML spans to be hashed
 * @param options The converter options to be used for hashing
 * @param globals The global converter object containing necessary configurations
 * @returns The text with hashed HTML spans
 */

export function hashHTMLSpans(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	text = globals.converter
		?._dispatch("hashHTMLSpans.before", text, options, globals)
		.getText() as string;

	// Hash Self Closing tags
	text = text.replace(/<[^>]+?\/>/gi, (wm) =>
		helpers._hashHTMLSpan(wm, globals),
	);

	// Hash tags without properties
	text = text.replace(/<([^>]+?)>[\s\S]*?<\/\1>/g, (wm) =>
		helpers._hashHTMLSpan(wm, globals),
	);

	// Hash tags with properties
	text = text.replace(/<([^>]+?)\s[^>]+?>[\s\S]*?<\/\1>/g, (wm) =>
		helpers._hashHTMLSpan(wm, globals),
	);

	// Hash self closing tags without />
	text = text.replace(/<[^>]+?>/gi, (wm) => helpers._hashHTMLSpan(wm, globals));

	text = globals.converter
		?._dispatch("hashHTMLSpans.after", text, options, globals)
		.getText() as string;
	return text;
}

/**
 * Unhashes HTML spans in the given text based on the provided options and global converter.
 *
 * @param text The text containing hashed HTML spans to be unhashed
 * @param options The converter options to be used for unhashing
 * @param globals The global converter object containing necessary configurations
 * @returns The text with unhashed HTML spans
 */
export function unhashHTMLSpans(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	text = globals.converter
		?._dispatch("unhashHTMLSpans.before", text, options, globals)
		.getText() as string;

	for (let i = 0; i < globals.gHtmlSpans.length; ++i) {
		let repText = globals.gHtmlSpans[i];
		// limiter to prevent infinite loop (assume 10 as limit for recurse)
		let limit = 0;

		while (/¨C(\d+)C/.test(repText)) {
			const num = +RegExp.$1;
			repText = repText.replace(`¨C${num}C`, globals.gHtmlSpans[num]);
			if (limit === 10) {
				console.error("maximum nesting of 10 spans reached!!!");
				break;
			}
			++limit;
		}
		text = text.replace(`¨C${i}C`, repText);
	}

	text = globals.converter
		?._dispatch("unhashHTMLSpans.after", text, options, globals)
		.getText() as string;
	return text;
}
