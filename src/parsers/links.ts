import type { EventResult } from "../event.js";
import type { GlobalConverter } from "../globals.js";
import { helpers } from "../helpers.js";
import type { ConverterOptions } from "../options.js";
import { codeSpans } from "./codeBlocks.js";
import { ellipsis } from "./ellipsis.js";
import { emoji } from "./emoji.js";
import { hashHTMLSpans } from "./hashHTMLSpans.js";
import { italicsAndBold } from "./italicsAndBold.js";
import { strikethrough } from "./strikethrough.js";
import { underline } from "./underline.js";
import { unescapeSpecialChars } from "./unescapeSpecialChars.js";
type ReplaceAnchorTag = {
	rgx: RegExp;
	evtRootName: string;
	options: ConverterOptions;
	globals: GlobalConverter;
	emptyCase?: boolean;
};
type WriteAnchorTag = {
	evt: EventResult;
	options: ConverterOptions;
	globals: GlobalConverter;
	emptyCase?: boolean;
};

/**
 * Creates an EventResult object, and dispatches it to the converter's
 * event listeners.
 *
 * @param rgx - The regular expression that triggered the event
 * @param evtName - The name of the event to dispatch
 * @param wholeMatch - The whole match of the regular expression
 * @param text - The text within the whole match that should be processed
 * @param id - The id of the reference link (if applicable)
 * @param url - The URL of the link (if applicable)
 * @param title - The title of the link (if applicable)
 * @param options - The options object for the converter
 * @param globals - The global converter object
 * @returns The EventResult object
 */
function createEvent(
	rgx: RegExp,
	evtName: string,
	wholeMatch: string,
	text: string,
	id: null,
	url: string,
	title: null,
	options: ConverterOptions,
	globals: GlobalConverter,
): EventResult {
	return globals.converter?._dispatch(evtName, wholeMatch, options, globals, {
		regexp: rgx ?? "",
		matches: {
			wholeMatch: wholeMatch ?? "",
			text: text ?? "",
			id: id ?? null,
			url: url ?? "",
			title: title ?? "",
		},
	}) as EventResult;
}

/**
 * Creates an HTML anchor element based on the given event and options.
 *
 * @param evt - The event result object
 * @param options - The options object for the converter
 * @param globals - The global converter object
 * @param emptyCase - Whether this is an empty case (i.e. [^]())
 * @returns The HTML anchor element as a string
 */
function writeAnchorTag({
	evt,
	options,
	globals,
	emptyCase,
}: WriteAnchorTag): string {
	let target = "";
	let { wholeMatch, text, id, url, title } = evt.getMatches();
	if (!text) text = "";
	if (!title) title = "";
	id = id ? id.toLowerCase() : "";
	if (emptyCase) {
		url = "";
	} else if (!url) {
		if (!id) {
			id = text.toLowerCase().replace(/ ?\n/g, " ");
		}
		url = `#${id}`;

		if (globals.gUrls[id] !== undefined) {
			url = globals.gUrls[id];
			if (globals.gTitles[id] !== undefined) {
				title = globals.gTitles[id];
			}
		} else {
			return wholeMatch;
		}
	}
	url = url.replace(
		helpers.regexes.asteriskDashTildeAndColon,
		helpers.escapeCharactersCallback,
	);

	if (title !== "" && title !== null) {
		title = title.replace(/"/g, "&quot");
		title = title.replace(
			helpers.regexes.asteriskDashTildeAndColon,
			helpers.escapeCharactersCallback,
		);
		title = ` title="${title}"`;
	}

	if (options.openLinksInNewWindow && !/^#/.test(url)) {
		target = ' rel="noopener noreferrer" target="_blank"';
	}
	text = codeSpans(text, options, globals);
	text = emoji(text, options, globals);
	text = underline(text, options, globals);
	text = italicsAndBold(text, options, globals);
	text = strikethrough(text, options, globals);
	text = ellipsis(text, options, globals);
	text = hashHTMLSpans(text, options, globals);
	const result = `<a href="${url}"${title}${target}>${text}</a>`;
	return hashHTMLSpans(result, options, globals);
}
/**
 * Replaces all occurrences of `[id]` or `[id][url]` or `[id][url="url"]` with
 * `<a href="url" title="title">id</a>`. The `id` is case-insensitive.
 *
 * @param {object} params
 * @param {RegExp} params.rgx The regular expression used to match the
 * `[id]` or `[id][url]` or `[id][url="url"]` string.
 * @param {string} params.evtRootName The root name of the event.
 * @param {ConverterOptions} params.options The options object.
 * @param {GlobalConverter} params.globals The globals object.
 * @param {boolean} [params.emptyCase=false] Whether to return an empty string if
 * the `id` is not found in the `globals.gUrls` object.
 * @returns {(wholeMatch: string, text: string, id: any, url: string, title: any, m5?: any, m6?: any) => string}
 * A function which takes the whole match, the text, the id, the url, the title,
 * and two optional arguments (which are ignored) and returns the replaced string.
 */
//
function replaceAnchorTagReference({
	rgx,
	evtRootName,
	options,
	globals,
	emptyCase,
}: ReplaceAnchorTag): (
	wholeMatch: string,
	text: string,
	id: any,
	url: string,
	title: any,
	m5?: any,
	m6?: any,
) => string {
	emptyCase = !!emptyCase;
	function local(
		wholeMatch: string,
		text: string,
		id: any,
		url: string,
		title: any,
		m5?: any,
		m6?: any,
	) {
		if (/\n\n/.test(wholeMatch)) {
			return wholeMatch;
		}
		const evt = createEvent(
			rgx,
			`${evtRootName}.captureStart`,
			wholeMatch,
			text,
			id,
			url,
			title,
			options,
			globals,
		);
		return writeAnchorTag({ evt, options, globals, emptyCase });
	}
	return local;
}

/**
 * Replaces all occurrences of `[id]` or `[id][url]` or `[id][url="url"]` with
 * `<a href="url" title="title">id</a>`. The `id` is case-insensitive.
 *
 * @param {{rgx: RegExp, evtRootName: string, options: ConverterOptions, globals: GlobalConverter, emptyCase?: boolean}} params
 * @returns {(wholeMatch: string, text: string, id: any, url: string, title: any, m5?: any, m6?: any) => string}
 */
function replaceAnchorTagBaseUrl({
	rgx,
	evtRootName,
	options,
	globals,
	emptyCase,
}: ReplaceAnchorTag): (
	wholeMatch: string,
	text: string,
	id: any,
	url: string,
	title: any,
	m5?: any,
	m6?: any,
) => string {
	const local = (
		wholeMatch: string,
		text: string,
		id: any,
		url: string,
		title: any,
		m5?: any,
		m6?: any,
	) => {
		url = helpers.applyBaseUrl(options.relativePathBaseUrl, url);

		const evt = createEvent(
			rgx,
			`${evtRootName}.captureStart`,
			wholeMatch,
			text,
			id,
			url,
			title,
			options,
			globals,
		);
		return writeAnchorTag({ evt, options, globals, emptyCase });
	};
	return local;
}

/**
 * Replace URLs and email addresses that are enclosed in angle brackets with anchor tags.
 * @param text The text to process.
 * @param options The converter options.
 * @param globals The globals object.
 * @returns The processed text.
 */
function linksAngleBrackets(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	const evtRootName: string = "links.angleBrackets";
	text = globals.converter
		?._dispatch(`${evtRootName}.start`, text, options, globals)
		.getText() as string;
	// Process URLs
	const urlRgx = /<(((?:https?|ftp):\/\/|www\.)[^'">\s]+)>/gi;
	text = text.replace(
		urlRgx,
		(wholeMatch: string, url: string, urlStart: string) => {
			const text = url;
			url = urlStart === "www." ? `http://${url}` : url;
			const evt = createEvent(
				urlRgx,
				`${evtRootName}.captureStart`,
				wholeMatch,
				text,
				null,
				url,
				null,
				options,
				globals,
			);
			return writeAnchorTag({ evt: evt, options: options, globals: globals });
		},
	);

	// Process email addresses
	const mailRegx =
		/<(?:mailto:)?([-.\w]+@[-a-z0-9]+(\.[-a-z0-9]+)*\.[a-z]+)>/gi;
	text = text.replace(mailRegx, (wholeMatch: string, mail: string) => {
		let url = "mailto:";
		mail = unescapeSpecialChars(mail, options, globals);
		if (options.encodeEmails) {
			url = helpers.encodeEmailAddress(url + mail);
			mail = helpers.encodeEmailAddress(mail);
		} else {
			url = url + mail;
		}
		const evt = createEvent(
			mailRegx,
			`${evtRootName}.captureStart`,
			wholeMatch,
			mail,
			null,
			url,
			null,
			options,
			globals,
		);
		return writeAnchorTag({ evt: evt, options: options, globals: globals });
	});
	text = globals.converter
		?._dispatch(`${evtRootName}.end`, text, options, globals)
		.getText() as string;
	return text;
}

/**
 * Replaces all occurrences of `[id]` or `[id][url]` or `[id][url="url"]` with
 * `<a href="url" title="title">id</a>`. The `id` is case-insensitive.
 *
 * @param   {string}  text          The text to parse.
 * @param   {object}  options       The options object.
 * @param   {object}  globals       The globals object.
 * @returns {string}  The text with all `[id]` replaced with `<a href="url" title="title">id</a>`.
 */
function linksInline(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	const evtRootName: string = "links.inline";
	text = globals.converter
		?._dispatch(`${evtRootName}.start`, text, options, globals)
		.getText() as string;
	// 1. Look for empty cases: []() and [empty]() and []("title")
	const rgxEmpty = /\[(.*?)]()()()()\(<? ?>? ?(?:["'](.*)["'])?\)/g;
	text = text.replace(
		rgxEmpty,
		replaceAnchorTagBaseUrl({
			rgx: rgxEmpty,
			evtRootName: evtRootName,
			options: options,
			globals: globals,
		}),
	);
	// 2. Look for cases with crazy urls like ./image/cat1).png
	const rgxCrazy =
		/\[((?:\[[^\]]*]|[^\[\]])*)]()\s?\([ \t]?<([^>]*)>(?:[ \t]*((["'])([^"]*?)\5))?[ \t]?\)/g;
	text = text.replace(
		rgxCrazy,
		replaceAnchorTagBaseUrl({
			rgx: rgxCrazy,
			evtRootName: evtRootName,
			options: options,
			globals: globals,
		}),
	);
	// 3. inline links with no title or titles wrapped in ' or ":
	// [text](url.com) || [text](<url.com>) || [text](url.com "title") || [text](<url.com> "title")
	//var rgx2 = /\[[ ]*[\s]?[ ]*([^\n\[\]]*?)[ ]*[\s]?[ ]*] ?()\(<?[ ]*[\s]?[ ]*([^\s'"]*)>?(?:[ ]*[\n]?[ ]*()(['"])(.*?)\5)?[ ]*[\s]?[ ]*\)/; // this regex is too slow!!!
	const rgx2 =
		/\[([\S ]*?)]\s?()\( *<?([^\s'"]*?(?:\([\S]*?\)[\S]*?)?)>?\s*(?:()(['"])(.*?)\5)? *\)/g;
	text = text.replace(
		rgx2,
		replaceAnchorTagBaseUrl({
			rgx: rgx2,
			evtRootName: evtRootName,
			options: options,
			globals: globals,
		}),
	);

	// 4. inline links with titles wrapped in (): [foo](bar.com (title))
	const rgx3 =
		/\[([\S ]*?)]\s?()\( *<?([^\s'"]*?(?:\([\S]*?\)[\S]*?)?)>?\s+()()\((.*?)\) *\)/g;
	text = text.replace(
		rgx3,
		replaceAnchorTagBaseUrl({
			rgx: rgx3,
			evtRootName: evtRootName,
			options: options,
			globals: globals,
		}),
	);
	text = globals.converter
		?._dispatch(`${evtRootName}.end`, text, options, globals)
		.getText() as string;

	return text;
}

/**
 * Replaces all occurrences of `[id] [url]` with `<a href="url">id</a>`.
 * The `id` is case-insensitive.
 *
 * @param {string} text The text to process.
 * @param {ConverterOptions} options The converter options.
 * @param {GlobalConverter} globals The globals object.
 * @returns {string} The processed text.
 */
function linksReference(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	const evtRootName: string = "links.reference";
	text = globals.converter
		?._dispatch(`${evtRootName}.start`, text, options, globals)
		.getText() as string;
	const rgx = /\[((?:\[[^\]]*]|[^\[\]])*)] ?(?:\n *)?\[(.*?)]()()()()/g;

	text = text.replace(
		rgx,
		replaceAnchorTagReference({
			rgx: rgx,
			evtRootName: evtRootName,
			options: options,
			globals: globals,
		}),
	);
	text = globals.converter
		?._dispatch(`${evtRootName}.end`, text, options, globals)
		.getText() as string;
	return text;
}

/**
 * Replaces all occurrences of `[id]` with `<a href="id">id</a>`.
 * The `id` is case-insensitive.
 *
 * @param {string} text The text to process.
 * @param {ConverterOptions} options The converter options.
 * @param {GlobalConverter} globals The globals object.
 * @returns {string} The processed text.
 */
function linksReferenceShortcut(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	const evtRootName: string = "links.referenceShortcut";
	text = globals.converter
		?._dispatch(`${evtRootName}.start`, text, options, globals)
		.getText() as string;
	const rgx = /\[([^\[\]]+)]()()()()()/g;
	text = text.replace(
		rgx,
		replaceAnchorTagReference({
			rgx: rgx,
			evtRootName: evtRootName,
			options: options,
			globals: globals,
		}),
	);
	text = globals.converter
		?._dispatch(`${evtRootName}.end`, text, options, globals)
		.getText() as string;
	return text;
}

/**
 * Replaces all occurrences of `@username` with `<a href="options.ghMentionsLink.replace(/{u}/g, username)">@username</a>`.
 * The `options.ghMentionsLink` option is mandatory and must be a string.
 * The `@username` is case-insensitive.
 *
 * @param {string} text The text to process.
 * @param {ConverterOptions} options The converter options.
 * @param {GlobalConverter} globals The globals object.
 * @returns {string} The processed text.
 */
function linksGhMentions(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	const evtRootName: string = "links.ghMentions";
	if (!options.ghMentions) {
		return text;
	}
	text = globals.converter
		?._dispatch(`${evtRootName}.start`, text, options, globals)
		.getText() as string;

	const rgx = /(^|\s)(\\)?(@([a-z\d]+(?:[a-z\d._-]+?[a-z\d]+)*))/gi;

	text = text.replace(
		rgx,
		(
			wholeMatch: any,
			st: any,
			escape: string,
			mentions: any,
			username: any,
		) => {
			// bail if the mentions was escaped
			if (escape === "\\") {
				return st + mentions;
			}

			// check if options.ghMentionsLink is a string
			// TODO Validation should be done at initialization not at runtime
			if (typeof options.ghMentionsLink !== "string") {
				throw new Error("ghMentionsLink option must be a string");
			}
			const url = options.ghMentionsLink.replace(/{u}/g, username);
			const evt = createEvent(
				rgx,
				`${evtRootName}.captureStart`,
				wholeMatch,
				mentions,
				null,
				url,
				null,
				options,
				globals,
			);
			// captureEnd Event is triggered inside writeAnchorTag function
			return (
				st + writeAnchorTag({ evt: evt, options: options, globals: globals })
			);
		},
	);

	text = globals.converter
		?._dispatch(`${evtRootName}.end`, text, options, globals)
		.getText() as string;
	return text;
}

/**
 * Replaces all occurrences of naked URLs with `<a href="url">url</a>`.
 * The `options.ghMentionsLink` option is mandatory and must be a string.
 * If `options.encodeEmails` option is enabled, emails are encoded.
 *
 * @param {string} text The text to process.
 * @param {ConverterOptions} options The converter options.
 * @param {GlobalConverter} globals The globals object.
 * @returns {string} The processed text.
 */
function linksNaked(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	const evtRootName: string = "links.naked";
	text = globals.converter
		?._dispatch(`${evtRootName}.start`, text, options, globals)
		.getText() as string;

	// 2. Now we check for
	// we also include leading markdown magic chars [_*~] for cases like __https://www.google.com/foobar__
	const urlRgx =
		/([_*~]*?)(((?:https?|ftp):\/\/|www\.)[^\s<>"'`´.-][^\s<>"'`´]*?\.[a-z\d.]+[^\s<>"']*)\1/gi;

	text = text.replace(
		urlRgx,
		(
			wholeMatch: string,
			leadingMDChars: string,
			url: string,
			urlPrefix: string,
		) => {
			// we now will start traversing the url from the front to back, looking for punctuation chars [_*~,;:.!?\)\]]
			const len = url.length;
			let suffix = "";
			for (let i = len - 1; i >= 0; --i) {
				const char = url.charAt(i);

				if (/[_*~,;:.!?]/.test(char)) {
					// it's a punctuation char
					// we remove it from the url
					url = url.slice(0, -1);
					// and prepend it to the suffix
					suffix = char + suffix;
				} else if (/\)/.test(char)) {
					const opPar = url.match(/\(/g) || [];
					const clPar = url.match(/\)/g) as RegExpMatchArray;

					// it's a curved parenthesis so we need to check for "balance" (kinda)
					if (opPar.length < clPar.length) {
						// there are more closing Parenthesis than opening so chop it!!!!!
						url = url.slice(0, -1);
						// and prepend it to the suffix
						suffix = char + suffix;
					} else {
						// it's (kinda) balanced so our work is done
						break;
					}
				} else if (/]/.test(char)) {
					const opPar2 = url.match(/\[/g) || [];
					const clPar2 = url.match(/\]/g) as RegExpMatchArray;
					// it's a squared parenthesis so we need to check for "balance" (kinda)
					if (opPar2.length < clPar2.length) {
						// there are more closing Parenthesis than opening so chop it!!!!!
						url = url.slice(0, -1);
						// and prepend it to the suffix
						suffix = char + suffix;
					} else {
						// it's (kinda) balanced so our work is done
						break;
					}
				} else {
					// it's not a punctuation or a parenthesis so our work is done
					break;
				}
			}

			// we copy the treated url to the text variable
			let text = url;
			// finally, if it's a www shortcut, we prepend http
			url = urlPrefix === "www." ? `http://${url}` : url;

			// url part is done so let's take care of text now
			// we need to escape the text (because of links such as www.example.com/foo__bar__baz)
			text = text.replace(
				helpers.regexes.asteriskDashTildeAndColon,
				helpers.escapeCharactersCallback,
			);

			// finally we dispatch the event
			const evt = createEvent(
				urlRgx,
				`${evtRootName}.captureStart`,
				wholeMatch,
				text,
				null,
				url,
				null,
				options,
				globals,
			);

			// and return the link tag, with the leadingMDChars and  suffix. The leadingMDChars are added at the end too because
			// we consumed those characters in the regexp
			return (
				leadingMDChars +
				writeAnchorTag({ evt: evt, options: options, globals: globals }) +
				suffix +
				leadingMDChars
			);
		},
	);
	const mailRgx =
		/(^|\s)(?:mailto:)?([A-Za-z0-9!#$%&'*+-/=?^_`{|}~.]+@[-a-z0-9]+(\.[-a-z0-9]+)*\.[a-z]+)(?=$|\s)/gim;
	text = text.replace(
		mailRgx,
		(wholeMatch: string, leadingChar: string, mail: string) => {
			let url = "mailto:";
			mail = unescapeSpecialChars(mail, options, globals);
			if (options.encodeEmails) {
				url = helpers.encodeEmailAddress(url + mail);
				mail = helpers.encodeEmailAddress(mail);
			} else {
				url = url + mail;
			}
			const evt = createEvent(
				mailRgx,
				`${evtRootName}.captureStart`,
				wholeMatch,
				mail,
				null,
				url,
				null,
				options,
				globals,
			);
			return (
				leadingChar +
				writeAnchorTag({ evt: evt, options: options, globals: globals })
			);
		},
	);

	text = globals.converter
		?._dispatch(`${evtRootName}.end`, text, options, globals)
		.getText() as string;
	return text;
}

/**
 * Replaces all occurrences of:
 * - `[link text] [id]` with `<a href="url">link text</a>`.
 * - `[link text](url "optional title")` with `<a href="url" title="optional title">link text</a>`.
 * - `[link text]` with `<a href="url">link text</a>`.
 * - `<http://example.com/>` with `<a href="http://example.com/">http://example.com/</a>`.
 * - `@githubmention` with `<a href="https://github.com/githubmention">githubmention</a>`.
 * - `<a> tags and <img> tags` with hashed tags.
 * - `http://example.com/` with `<a href="http://example.com/">http://example.com/</a>`.
 * The `id` is case-insensitive.
 *
 * @param {string} text The text to process.
 * @param {ConverterOptions} options The converter options.
 * @param {GlobalConverter} globals The globals object.
 * @returns {string} The processed text.
 */
function links(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	const evtRootName: string = "links";
	text = globals.converter
		?._dispatch(`${evtRootName}.start`, text, options, globals)
		.getText() as string;

	// 1. Handle reference-style links: [link text] [id]
	text = linksReference(text, options, globals);

	// 2. Handle inline-style links: [link text](url "optional title")
	text = linksInline(text, options, globals);

	// 3. Handle reference-style shortcuts: [link text]
	// These must come last in case there's a [link text][1] or [link text](/foo)
	text = linksReferenceShortcut(text, options, globals);

	// 4. Handle angle brackets links -> `<http://example.com/>`
	// Must come after links, because you can use < and > delimiters in inline links like [this](<url>).
	text = linksAngleBrackets(text, options, globals);

	// 5. Handle GithubMentions (if option is enabled)
	text = linksGhMentions(text, options, globals);
	// 6. Handle <a> tags and img tags
	text = text.replace(/<a\s[^>]*>[\s\S]*<\/a>/g, (wholeMatch: string) => {
		return helpers._hashHTMLSpan(wholeMatch, globals);
	});

	text = text.replace(/<img\s[^>]*\/?>/g, (wholeMatch: string) => {
		return helpers._hashHTMLSpan(wholeMatch, globals);
	});

	// 7. Handle naked links (if option is enabled)
	text = linksNaked(text, options, globals);

	text = globals.converter
		?._dispatch(`${evtRootName}.end`, text, options, globals)
		.getText() as string;
	return text;
}

export { links };
