import type { GlobalConverter } from "../globals.js";
import type { ConverterOptions } from "../options.js";

/**
 * #### Remove one level of line-leading indentation from each line of a string.
 *
 * @param text - input string
 * @param options - converter options
 * @param globals - converter globals
 *
 * @returns string with line-leading indentation removed
 */
export function outdent(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	text = globals.converter
		?._dispatch("outdent.before", text, options, globals)
		.getText() as string;

	// attacklab: hack around Konqueror 3.5.4 bug:
	// "----------bug".replace(/^-/g,"") == "bug"
	text = text.replace(/^(\t|[ ]{1,4})/gm, "¨0"); // attacklab: g_tab_width

	// attacklab: clean up hack
	text = text.replace(/¨0/g, "");

	text = globals.converter
		?._dispatch("outdent.after", text, options, globals)
		.getText() as string;
	return text;
}
