import type { GlobalConverter } from "../globals.js";
import { helpers } from "../helpers.js";
import type { ConverterOptions } from "../options.js";
import { encodeAmpsAndAngles } from "./encodeAmpsAndAngles.js";
/**
 * Replaces all link definitions with their URL, title, and dimensions (if given).
 * A link definition is a line starting with `[id]:` followed by a URL, title, and dimensions.
 * The `id` is case-insensitive.
 * @param text The text to parse.
 * @param options The options object.
 * @param globals The globals object.
 * @returns The text with all link definitions replaced with their URL, title, and dimensions.
 */
//
export function stripLinkDefinitions(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	const regex =
		/^ {0,3}\[([^\]]+)]:[ \t]*\n?[ \t]*<?([^>\s]+)>?(?: =([*\d]+[A-Za-z%]{0,4})x([*\d]+[A-Za-z%]{0,4}))?[ \t]*\n?[ \t]*(?:(\n*)["|'(](.+?)["|')][ \t]*)?(?:\n+|(?=¨0))/gm;
	const base64Regex =
		/^ {0,3}\[([^\]]+)]:[ \t]*\n?[ \t]*<?(data:.+?\/.+?;base64,[A-Za-z0-9+/=\n]+?)>?(?: =([*\d]+[A-Za-z%]{0,4})x([*\d]+[A-Za-z%]{0,4}))?[ \t]*\n?[ \t]*(?:(\n*)["|'(](.+?)["|')][ \t]*)?(?:\n\n|(?=¨0)|(?=\n\[))/gm;

	// attacklab: sentinel workarounds for lack of \A and \Z, safari\khtml bug
	text += "¨0";

	/**
	 * Replaces a link definition with its URL, title, and dimensions (if given).
	 * @param wholeMatch The whole match of the link definition.
	 * @param linkId The ID of the link definition.
	 * @param url The URL of the link definition.
	 * @param width The width of the link definition (in pixels or as a percentage).
	 * @param height The height of the link definition (in pixels or as a percentage).
	 * @param blankLines The blank lines after the link definition.
	 * @param title The title of the link definition.
	 * @returns The replacement string for the link definition.
	 */
	const replaceFunc = (
		wholeMatch: any,
		linkId: string,
		url: string,
		width: any,
		height: any,
		blankLines: any,
		title: string,
	) => {
		// if there aren't two instances of linkId it must not be a reference link so back out
		linkId = linkId.toLowerCase();
		if (text.toLowerCase().split(linkId).length - 1 < 2) {
			return wholeMatch;
		}
		if (url.match(/^data:.+?\/.+?;base64,/)) {
			// remove newlines
			globals.gUrls[linkId] = url.replace(/\s/g, "");
		} else {
			url = helpers.applyBaseUrl(options.relativePathBaseUrl, url);

			globals.gUrls[linkId] = encodeAmpsAndAngles(
				url,
				options,
				globals,
			) as string; // Link IDs are case-insensitive
		}

		if (blankLines) {
			// Oops, found blank lines, so it's not a title.
			// Put back the parenthetical statement we stole.
			return blankLines + title;
		}
		if (title) {
			globals.gTitles[linkId] = title.replace(/"|'/g, "&quot;");
		}
		if (options.parseImgDimensions && width && height) {
			globals.gDimensions[linkId] = {
				width: width,
				height: height,
			};
		}

		// Completely remove the definition from the text
		return "";
	};

	// first we try to find base64 link references
	text = text.replace(base64Regex, replaceFunc);

	text = text.replace(regex, replaceFunc);

	// attacklab: strip sentinel
	text = text.replace(/¨0/, "");

	return text;
}
