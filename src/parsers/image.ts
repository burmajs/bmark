import type { GlobalConverter } from "../globals.js";
import { helpers } from "../helpers.js";
import type { ConverterOptions } from "../options.js";

/**
 * Replaces all occurrences of:
 *  - `![alt text][id]` with `<img src="url" alt="alt text" />`.
 *  - `![alt text](url "optional title")` with `<img src="url" alt="alt text" title="optional title" />`.
 *  - `![alt text](url =<width>x<height> "optional title")` with `<img src="url" alt="alt text" title="optional title" width="<width>" height="<height>" />`.
 * The `id` is case-insensitive.
 *
 * @param   {string}  text          The text to parse.
 * @param   {object}  options       The options object.
 * @param   {object}  globals       The globals object.
 * @returns {string}  The text with all `![alt text][id]` replaced with `<img src="url" alt="alt text" />`.
 */
function images(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	text = globals.converter
		?._dispatch("images.before", text, options, globals)
		.getText() as string;

	const inlineRegExp =
		/!\[([^\]]*?)][ \t]*()\([ \t]?<?([\S]+?(?:\([\S]*?\)[\S]*?)?)>?(?: =([*\d]+[A-Za-z%]{0,4})x([*\d]+[A-Za-z%]{0,4}))?[ \t]*(?:(["'])([^"]*?)\6)?[ \t]?\)/g;
	const crazyRegExp =
		/!\[([^\]]*?)][ \t]*()\([ \t]?<([^>]*)>(?: =([*\d]+[A-Za-z%]{0,4})x([*\d]+[A-Za-z%]{0,4}))?[ \t]*(?:(?:(["'])([^"]*?)\6))?[ \t]?\)/g;
	const base64RegExp =
		/!\[([^\]]*?)][ \t]*()\([ \t]?<?(data:.+?\/.+?;base64,[A-Za-z0-9+/=\n]+?)>?(?: =([*\d]+[A-Za-z%]{0,4})x([*\d]+[A-Za-z%]{0,4}))?[ \t]*(?:(["'])([^"]*?)\6)?[ \t]?\)/g;
	const referenceRegExp = /!\[([^\]]*?)] ?(?:\n *)?\[([\s\S]*?)]()()()()()/g;
	const refShortcutRegExp = /!\[([^\[\]]+)]()()()()()/g;

	function writeImageTagBase64(
		wholeMatch: string,
		altText: string,
		linkId: string,
		url: string,
		width: string | number,
		height: string | number,
		m5: any,
		title: string,
	) {
		url = url.replace(/\s/g, "");
		return writeImageTag(
			wholeMatch,
			altText,
			linkId,
			url,
			width,
			height,
			m5,
			title,
		);
	}

	function writeImageTagBaseUrl(
		wholeMatch: string,
		altText: string,
		linkId: string,
		url: string,
		width: string | number,
		height: string | number,
		m5: any,
		title: string,
	) {
		return writeImageTag(
			wholeMatch,
			altText,
			linkId,
			url,
			width,
			height,
			m5,
			title,
		);
	}

	function writeImageTag(
		wholeMatch: string,
		altText: string,
		linkId: any,
		url: string | null,
		width: number | string,
		height: number | string,
		m5: any,
		title: string,
	) {
		const gUrls = globals.gUrls;
		const gTitles = globals.gTitles;
		const gDims = globals.gDimensions;

		linkId = linkId.toLowerCase();

		if (!title) {
			title = "";
		}
		if (wholeMatch.search(/\(<?\s*>? ?(['"].*['"])?\)$/m) > -1) {
			url = "";
		} else if (url === "" || url === null) {
			if (linkId === "" || linkId === null) {
				linkId = altText.toLowerCase().replace(/ ?\n/g, " ");
			}
			url = `#${linkId}`;

			if (typeof gUrls[linkId] !== "undefined") {
				url = gUrls[linkId];
				if (typeof gTitles[linkId] !== "undefined") {
					title = gTitles[linkId];
				}
				if (typeof gDims[linkId] !== "undefined") {
					width = gDims[linkId].width;
					height = gDims[linkId].height;
				}
			} else {
				return wholeMatch;
			}
		}

		altText = altText
			.replace(/"/g, "&quot;")
			.replace(
				helpers.regexes.asteriskDashTildeAndColon,
				helpers.escapeCharactersCallback,
			);
		url = url.replace(
			helpers.regexes.asteriskDashTildeAndColon,
			helpers.escapeCharactersCallback,
		);
		let result = `<img src="${url}" alt="${altText}"`;

		if (title && typeof title === "string") {
			title = title
				.replace(/"/g, "&quot;")
				.replace(
					helpers.regexes.asteriskDashTildeAndColon,
					helpers.escapeCharactersCallback,
				);
			result += `title="${title}"`;
		}

		if (width && height) {
			width = width === "*" ? "auto" : width;
			height = height === "*" ? "auto" : height;

			result += `width="${width}"`;
			result += `height="${height}"`;
		}

		result += " />";

		return result;
	}

	// First, handle reference-style labeled images: ![alt text][id]
	text = text.replace(referenceRegExp, writeImageTag);

	// Next, handle inline images:  ![alt text](url =<width>x<height> "optional title")

	// base64 encoded images
	text = text.replace(base64RegExp, writeImageTagBase64);

	// cases with crazy urls like ./image/cat1).png
	text = text.replace(crazyRegExp, writeImageTagBaseUrl);

	// normal cases
	text = text.replace(inlineRegExp, writeImageTagBaseUrl);

	// handle reference-style shortcuts: ![img text]
	text = text.replace(refShortcutRegExp, writeImageTag);

	text = globals.converter
		?._dispatch("images.after", text, options, globals)
		.getText() as string;
	return text;
}

export { images };
