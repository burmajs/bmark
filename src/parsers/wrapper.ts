import type { GlobalConverter } from "../globals.js";
import type { ConverterOptions } from "../options.js";

/**
 * Wraps the given `text` with a `<div>` element with class `options.classNmae`.
 *
 * This function is used by the `html` and `jsx` formatters.
 *
 * @param {string} text - The text to wrap.
 * @param {ConverterOptions} options - The converter options to use.
 * @param {GlobalConverter} globals - The globals object to use.
 * @returns {string} The wrapped text.
 */
export function wrapper(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	text = globals.converter
		?._dispatch("wrapper.before", text, options, globals)
		.getText() as string;
	const className = options.classNmae;
	const tx = options.jsx
		? `\n  <div className="${className}">\n${text}\n</div>\n`
		: `\n    <div class="${className}">\n${text}\n</div>\n`;
	text = tx;
	text = globals.converter
		?._dispatch("wrapper.after", text, options, globals)
		.getText() as string;
	return text;
}
