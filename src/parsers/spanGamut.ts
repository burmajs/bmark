import type { GlobalConverter } from "../globals.js";
import type { ConverterOptions } from "../options.js";
import { codeSpans } from "./codeBlocks.js";
import { ellipsis } from "./ellipsis.js";
import { emoji } from "./emoji.js";
import { encodeAmpsAndAngles } from "./encodeAmpsAndAngles.js";
import { encodeBackslashEscapes } from "./ encodeBackslashEscapes.js";
import { escapeSpecialCharsWithinTagAttributes } from "./escapeSpecialCharsWithinTagAttributes.js";
import { hashHTMLSpans } from "./hashHTMLSpans.js";
import { images } from "./image.js";
import { italicsAndBold } from "./italicsAndBold.js";
import { links } from "./links.js";
import { strikethrough } from "./strikethrough.js";
import { underline } from "./underline.js";
/**
 * This is the companion to blockGamut, which is run on the contents of
 * a single block. spanGamut is run on the contents of a single span.
 *
 * @param text The text to parse
 * @param options The conversion options
 * @param globals The global Markdown converter state
 * @returns The parsed text
 */
function spanGamut(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	text = globals.converter
		?._dispatch("spanGamut.before", text, options, globals)
		.getText() as string;

	text = codeSpans(text, options, globals);
	text = escapeSpecialCharsWithinTagAttributes(text, options, globals);
	text = encodeBackslashEscapes(text, options, globals);

	// Process link and image tags. Images must come first,
	// because ![foo][f] looks like a link.
	text = images(text, options, globals);

	text = globals.converter
		?._dispatch("links.before", text, options, globals)
		.getText() as string;
	text = links(text, options, globals);
	text = globals.converter
		?._dispatch("links.after", text, options, globals)
		.getText() as string;

	//text = showdown.subParser('makehtml.autoLinks')(text, options, globals);
	//text = showdown.subParser('makehtml.simplifiedAutoLinks')(text, options, globals);
	text = emoji(text, options, globals);
	text = underline(text, options, globals);
	text = italicsAndBold(text, options, globals);
	text = strikethrough(text, options, globals);
	text = ellipsis(text, options, globals);

	// we need to hash HTML tags inside spans
	text = hashHTMLSpans(text, options, globals);

	// now we encode amps and angles
	text = encodeAmpsAndAngles(text, options, globals);

	// Do hard breaks
	if (options.simpleLineBreaks) {
		// GFM style hard breaks
		// only add line breaks if the text does not contain a block (special case for lists)
		if (!/\n\n¨K/.test(text)) {
			text = text.replace(/\n+/g, "<br />\n");
		}
	} else {
		// Vanilla hard breaks
		text = text.replace(/ {2,}\n/g, "<br />\n");
	}

	text = globals.converter
		?._dispatch("spanGamut.after", text, options, globals)
		.getText() as string;
	return text;
}

export { spanGamut };
