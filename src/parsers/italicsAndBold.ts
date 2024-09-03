import type { GlobalConverter } from "../globals.js";
import type { ConverterOptions } from "../options.js";

/**
 * #### Parses bold and italic text.
 *
 * @param {string} text - the text to parse
 * @param {ConverterOptions} options - the conversion options
 * @param {GlobalConverter} globals - the global converter
 * @returns {string} the parsed text
 */
export function italicsAndBold(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	text = globals.converter
		?._dispatch("italicsAndBold.before", text, options, globals)
		.getText() as string;
	function parseInside(txt: any, left: string, right: string) {
		return left + txt + right;
	}

	// Parse underscores
	if (options.underscores) {
		text = text.replace(/\b___(\S[\s\S]*?)___\b/g, (wm, txt) =>
			parseInside(txt, "<strong><em>", "</em></strong>"),
		);
		text = text.replace(/\b__(\S[\s\S]*?)__\b/g, (wm, txt) =>
			parseInside(txt, "<strong>", "</strong>"),
		);
		text = text.replace(/\b_(\S[\s\S]*?)_\b/g, (wm, txt) =>
			parseInside(txt, "<em>", "</em>"),
		);
	} else {
		text = text.replace(/___(\S[\s\S]*?)___/g, (wm, m) =>
			/\S$/.test(m) ? parseInside(m, "<strong><em>", "</em></strong>") : wm,
		);
		text = text.replace(/__(\S[\s\S]*?)__/g, (wm, m) =>
			/\S$/.test(m) ? parseInside(m, "<strong>", "</strong>") : wm,
		);
		text = text.replace(/_([^\s_][\s\S]*?)_/g, (wm, m) => {
			// !/^_[^_]/.test(m) - test if it doesn't start with __ (since it seems redundant, we removed it)
			return /\S$/.test(m) ? parseInside(m, "<em>", "</em>") : wm;
		});
	}
	text = text.replace(/\*\*\*(\S[\s\S]*?)\*\*\*/g, (wm, m) =>
		/\S$/.test(m) ? parseInside(m, "<strong><em>", "</em></strong>") : wm,
	);
	text = text.replace(/\*\*(\S[\s\S]*?)\*\*/g, (wm, m) =>
		/\S$/.test(m) ? parseInside(m, "<strong>", "</strong>") : wm,
	);
	text = text.replace(/\*([^\s*][\s\S]*?)\*/g, (wm, m) => {
		// !/^\*[^*]/.test(m) - test if it doesn't start with ** (since it seems redundant, we removed it)
		return /\S$/.test(m) ? parseInside(m, "<em>", "</em>") : wm;
	});
	//}

	text = globals.converter
		?._dispatch("italicsAndBold.after", text, options, globals)
		.getText() as string;
	return text;
}
