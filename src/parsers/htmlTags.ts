import type { GlobalConverter } from "../globals.js";
import { helpers } from "../helpers.js";
import type { ConverterOptions } from "../options.js";
import { hashBlock } from "../parsers.js";
import { codeBlocks, githubCodeBlocks } from "./codeBlocks.js";
import { encodeCode } from "./encodeCode.js";
import { hashElement } from "./ hashElement.js";
import { outdent } from "./outdent.js";
import { spanGamut } from "./spanGamut.js";
import { tables } from "./tables.js";
const blockTags = [
	"pre",
	"div",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"blockquote",
	"table",
	"dl",
	"ol",
	"ul",
	"script",
	"noscript",
	"form",
	"fieldset",
	"iframe",
	"math",
	"style",
	"section",
	"header",
	"footer",
	"nav",
	"article",
	"aside",
	"address",
	"audio",
	"canvas",
	"figure",
	"hgroup",
	"output",
	"video",
	"details",
	"p",
];

/**
 * Replaces HTML blocks with a marker string, so that they can be safely
 * processed by the rest of the Markdown parser.
 *
 * @param {string} text - The text to be processed.
 * @param {ConverterOptions} options - The Markdown options.
 * @param {GlobalConverter} globals - The global Markdown converter.
 *
 * @returns {string} The text with all HTML blocks replaced with a marker string.
 */
function hashHTMLBlocks(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	text = globals.converter
		?._dispatch("hashHTMLBlocks.before", text, options, globals)
		.getText() as string;
	const repFunc = (
		wholeMatch: string,
		match: string,
		left: string,
		right: string,
	) => {
		let txt = wholeMatch;
		// check if this html element is marked as markdown
		// if so, it's contents should be parsed as markdown
		if (left.search(/\bmarkdown\b/) !== -1) {
			txt = left + globals.converter?.toHtml(match) + right;
		}
		return `\n\n¨K${globals.gHtmlBlocks.push(txt) - 1}K\n\n`;
	};
	if (options.backslashEscapesHTMLTags) {
		// encode backslash escaped HTML tags
		text = text.replace(/\\<(\/?[^>]+?)>/g, (wm, inside) => {
			return `&lt;${inside}"&gt;`;
		});
	}
	for (let i = 0; i < blockTags.length; ++i) {
		let opTagPos: any;
		const rgx1 = new RegExp(`^·{0,3}(<${blockTags[i]}\\b[^>]*>)`, "im");
		const patLeft = `<${blockTags[i]}\\b[^>]*>`;
		const patRight = `</${blockTags[i]}>`;
		// 1. Look for the first position of the first opening HTML tag in the text
		while ((opTagPos = helpers.regexIndexOf(text, rgx1)) !== -1) {
			// if the HTML tag is \ escaped, we need to escape it and break

			//2. Split the text in that position
			const subTexts = helpers.splitAtIndex(text, opTagPos);
			//3. Match recursively
			const newSubText1 = helpers.replaceRecursiveRegExp(
				subTexts[1],
				repFunc,
				patLeft,
				patRight,
				"im",
			);

			// prevent an infinite loop
			if (newSubText1 === subTexts[1]) {
				break;
			}
			text = subTexts[0].concat(newSubText1);
		}
	}
	text = text.replace(
		/(\n {0,3}(<(hr)\b([^<>])*?\/?>)[ \t]*(?=\n{2,}))/g,
		hashElement(text, options, globals),
	);
	text = helpers.replaceRecursiveRegExp(
		text,
		(txt: any) => {
			return `\n\n¨K ${globals.gHtmlBlocks.push(txt) - 1}K\n\n`;
		},
		"^ {0,3}<!--",
		"-->",
		"gm",
	);
	text = text.replace(
		/\n\n( {0,3}<([?%])[^\r]*?\2>[ \t]*(?=\n{2,}))/g,
		hashElement(text, options, globals),
	);
	text = globals.converter
		?._dispatch("hashHTMLBlocks.after", text, options, globals)
		.getText() as string;
	return text;
}

/**
 * Replaces horizontal rule markers with an <hr> tag.
 *
 * @param text - The text to be processed.
 * @param options - The Markdown options.
 * @param globals - The global Markdown converter.
 *
 * @returns The text with all horizontal rule markers replaced with an <hr> tag.
 */
function horizontalRule(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	text = globals.converter
		?._dispatch("horizontalRule.before", text, options, globals)
		.getText() as string;
	text = text.replace(
		/^ {0,2}( ?-){3,}[ \t]*$/gm,
		hashBlock("<hr />", options, globals),
	);
	text = text.replace(
		/^ {0,2}( ?\*){3,}[ \t]*$/gm,
		hashBlock("<hr />", options, globals),
	);
	text = text.replace(
		/^ {0,2}( ?_){3,}[ \t]*$/gm,
		hashBlock("<hr />", options, globals),
	);
	text = globals.converter
		?._dispatch("horizontalRule.after", text, options, globals)
		.getText() as string;
	return text;
}

/**
 * Replaces all occurrences of one or more blank lines with two newline
 * characters, which will ultimately be transformed into a <p> tag by the
 * browser.
 *
 * @param {string} text - The text to be processed.
 * @param {object} options - The converter options.
 * @param {object} globals - The globals object.
 *
 * @returns {string} The text with all blank lines replaced with two newline
 * characters.
 */
function paragraphs(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	text = globals.converter
		?._dispatch("paragraphs.before", text, options, globals)
		.getText() as string;
	// Strip leading and trailing lines:
	text = text.replace(/^\n+/g, "");
	text = text.replace(/\n+$/g, "");

	const grafs = text.split(/\n{2,}/g);
	const grafsOut: any[] = [];
	let end = grafs.length; // Wrap <p> tags
	let i = 0;
	for (i = 0; i < end; i++) {
		let str = grafs[i];
		// if this is an HTML marker, copy it
		if (str.search(/¨(K|G)(\d+)\1/g) >= 0) {
			grafsOut.push(str);

			// test for presence of characters to prevent empty lines being parsed
			// as paragraphs (resulting in undesired extra empty paragraphs)
		} else if (str.search(/\S/) >= 0) {
			str = spanGamut(str, options, globals);
			str = str.replace(/^([ \t]*)/g, "<p>");
			str += "</p>";
			grafsOut.push(str);
		}
	}

	/** Unhashify HTML blocks */
	end = grafsOut.length;
	for (i = 0; i < end; i++) {
		let blockText = "";
		let grafsOutIt = grafsOut[i];
		let codeFlag = false;
		// if this is a marker for an html block...
		// use RegExp.test instead of string.search because of QML bug
		while (/¨(K|G)(\d+)\1/.test(grafsOutIt)) {
			const delim = grafsOutIt.match(/¨(K|G)(\d+)\1/)[1];

			if (delim === "K") {
				blockText = globals.gHtmlBlocks[+RegExp.$2];
			} else {
				// we need to check if ghBlock is a false positive
				if (codeFlag) {
					const aa = globals.ghCodeBlocks[+RegExp.$2];
					const bb = aa.text as string;
					// use encoded version of all text
					blockText = encodeCode(bb, options, globals);
				} else {
					blockText = globals.ghCodeBlocks[+RegExp.$2].codeblock as string;
				}
			}
			blockText = blockText.replace(/\$/g, "$$$$"); // Escape any dollar signs

			grafsOutIt = grafsOutIt.replace(/(\n\n)?¨(K|G)\d+\2(\n\n)?/, blockText);
			// Check if grafsOutIt is a pre->code
			if (/^<pre\b[^>]*>\s*<code\b[^>]*>/.test(grafsOutIt)) {
				codeFlag = true;
			}
		}
		grafsOut[i] = grafsOutIt;
	}
	text = grafsOut.join("\n");
	// Strip leading and trailing lines:
	text = text.replace(/^\n+/g, "");
	text = text.replace(/\n+$/g, "");
	return globals.converter
		?._dispatch("paragraphs.after", text, options, globals)
		.getText() as string;
}

/**
 * Replaces all occurrences of:
 *  - `Header 1\n=========` with `<h1 id="header-1">Header 1</h1>`.
 *  - `Header 2\n--------=` with `<h2 id="header-2">Header 2</h2>`.
 * The first header is always treated as a level 1 header and the rest are
 * always treated as level 2 headers.
 *
 * @param   {string}  text          The text to parse.
 * @param   {object}  options       The options object.
 * @param   {object}  globals       The globals object.
 * @returns {string}  The text with all `Header 1\n=========` replaced with `<h1 id="header-1">Header 1</h1>`.
 */
function headers(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	text = globals.converter
		?._dispatch("headers.before", text, options, globals)
		.getText() as string;

	const headerLevelStart = Number.isNaN(
		Number.parseInt(options.headerLevelStart as string),
	)
		? 1
		: Number.parseInt(options.headerLevelStart as string);
	// Set text-style headers:
	//	Header 1
	//	========
	//
	//	Header 2
	//	--------
	//
	const setextRegexH1 = options.smoothLivePreview
		? /^(.+)[ \t]*\n={2,}[ \t]*\n+/gm
		: /^(.+)[ \t]*\n=+[ \t]*\n+/gm;
	const setextRegexH2 = options.smoothLivePreview
		? /^(.+)[ \t]*\n-{2,}[ \t]*\n+/gm
		: /^(.+)[ \t]*\n-+[ \t]*\n+/gm;

	text = text.replace(setextRegexH1, (wholeMatch: string, m1: string) => {
		const _spanGamut = spanGamut(m1, options, globals);
		const hID = options.noHeaderId ? "" : `id="${headerId(m1)}"`;
		const hLevel = headerLevelStart;
		const _hashBlock = `<h${hLevel} ${hID}>${_spanGamut}</h${hLevel}>`;
		return hashBlock(_hashBlock, options, globals);
	});

	text = text.replace(setextRegexH2, (matchFound: string, m1: string) => {
		const _spanGamut = spanGamut(m1, options, globals);
		const hID = options.noHeaderId ? "" : `id="${headerId(m1)}"`;
		const hLevel = headerLevelStart + 1;
		const _hashBlock = `<h${hLevel} ${hID}>${_spanGamut}</h${hLevel}>`;
		return hashBlock(_hashBlock, options, globals);
	});

	// atx-style headers:
	//  # Header 1
	//  ## Header 2
	//  ## Header 2 with closing hashes ##
	//  ...
	//  ###### Header 6
	//
	const atxStyle = options.requireSpaceBeforeHeadingText
		? /^(#{1,6})[ \t]+(.+?)[ \t]*#*\n+/gm
		: /^(#{1,6})[ \t]*(.+?)[ \t]*#*\n+/gm;

	text = text.replace(
		atxStyle,
		(wholeMatch: string, m1: string, m2: string) => {
			let hText = m2;
			if (options.customizedHeaderId) {
				hText = m2.replace(/\s?{([^{]+?)}\s*$/, "");
			}

			const span = spanGamut(hText, options, globals);
			const hID = options.noHeaderId ? "" : `id="${headerId(m2)}"`;
			const hLevel = headerLevelStart - 1 + m1.length;
			const header = `<h${hLevel} ${hID}>${span}</h${hLevel}>`;

			return hashBlock(header, options, globals);
		},
	);

	function headerId(m: string) {
		let title = "";
		let prefix = "";

		// It is separate from other options to allow combining prefix and customized
		if (options.customizedHeaderId) {
			const match: RegExpMatchArray | null = m.match(/{([^{]+?)}\s*$/);
			if (match?.[1]) {
				m = match[1];
			}
		}

		title = m;

		// Prefix id to prevent causing inadvertent pre-existing style matches.
		if (typeof options.prefixHeaderId === "string") {
			prefix = options.prefixHeaderId;
		} else if (options.prefixHeaderId === true) {
			prefix = "section-";
		} else {
			prefix = "";
		}

		if (!options.rawPrefixHeaderId) {
			title = prefix + title;
		}

		if (options.ghCompatibleHeaderId) {
			title = title
				.replace(/ /g, "-")
				// replace previously escaped chars (&, ¨ and $)
				.replace(/&amp;/g, "")
				.replace(/¨T/g, "")
				.replace(/¨D/g, "")
				// replace rest of the chars (&~$ are repeated as they might have been escaped)
				// borrowed from github's redcarpet (some they should produce similar results)
				.replace(/[&+$,\/:;=?@"#{}|^¨~\[\]`\\*)(%.!'<>]/g, "")
				.toLowerCase();
		} else if (options.rawHeaderId) {
			title = title
				.replace(/ /g, "-")
				// replace previously escaped chars (&, ¨ and $)
				.replace(/&amp;/g, "&")
				.replace(/¨T/g, "¨")
				.replace(/¨D/g, "$")
				// replace " and '
				.replace(/["']/g, "-")
				.toLowerCase();
		} else {
			title = title.replace(/[^\w]/g, "").toLowerCase();
		}

		if (options.rawPrefixHeaderId) {
			title = prefix + title;
		}

		if (globals.hashLinkCounts[title] as number) {
			title = `${title}-${(globals.hashLinkCounts[title] as number)++}`;
		} else {
			globals.hashLinkCounts[title] = 1;
		}
		return title;
	}

	text = globals.converter
		?._dispatch("headers.after", text, options, globals)
		.getText() as string;
	return text;
}

/**
 * Replaces all occurrences of blockquotes with <blockquote> tags.
 * Blockquotes are processed in two modes:
 * - If `splitAdjacentBlockquotes` is true, it will split adjacent blockquotes into separate <blockquote> tags.
 * - If `splitAdjacentBlockquotes` is false, it will merge adjacent blockquotes into a single <blockquote> tag.
 * It also processes the content of the blockquotes using `githubCodeBlocks` and `blockGamut`.
 * @param text The text to process.
 * @param options The converter options.
 * @param globals The globals object.
 * @returns The processed text.
 */
function blockQuotes(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	text = globals.converter
		?._dispatch("blockQuotes.before", text, options, globals)
		.getText() as string;

	// add a couple extra lines after the text and endtext mark
	text = `${text}\n\n`;

	let rgx = /(^ {0,3}>[ \t]?.+\n(.+\n)*\n*)+/gm;

	if (options.splitAdjacentBlockquotes) {
		rgx = /^ {0,3}>[\s\S]*?(?:\n\n)/gm;
	}

	text = text.replace(rgx, (bq) => {
		// attacklab: hack around Konqueror 3.5.4 bug:
		// "----------bug".replace(/^-/g,"") == "bug"
		bq = bq.replace(/^[ \t]*>[ \t]?/gm, ""); // trim one level of quoting

		// attacklab: clean up hack
		bq = bq.replace(/¨0/g, "");

		bq = bq.replace(/^[ \t]+$/gm, ""); // trim whitespace-only lines
		bq = githubCodeBlocks(bq, options, globals);
		bq = blockGamut(bq, options, globals); // recurse

		bq = bq.replace(/(^|\n)/g, "$1  ");
		// These leading spaces screw with <pre> content, so we need to fix that:
		bq = bq.replace(/(\s*<pre>[^\r]+?<\/pre>)/gm, (wholeMatch, m1) => {
			let pre = m1;
			// attacklab: hack around Konqueror 3.5.4 bug:
			pre = pre.replace(/^ {2}/gm, "¨0");
			pre = pre.replace(/¨0/g, "");
			return pre;
		});

		return hashBlock(`<blockquote>\n${bq}\n</blockquote>`, options, globals);
	});

	text = globals.converter
		?._dispatch("blockQuotes.after", text, options, globals)
		.getText() as string;
	return text;
}
/**
 * Form block-level tags like paragraphs, headers, and list items.
 * @param text The text to process
 * @param options The conversion options
 * @param globals The globals object
 * @returns The processed text
 */
//
function blockGamut(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	text = globals.converter
		?._dispatch("blockGamut.before", text, options, globals)
		.getText() as string;

	// we parse blockquotes first so that we can have headings and hrs
	// inside blockquotes
	text = blockQuotes(text, options, globals);
	text = headers(text, options, globals);

	// Do Horizontal Rules:
	text = horizontalRule(text, options, globals);

	text = lists(text, options, globals);
	text = codeBlocks(text, options, globals);
	text = tables(text, options, globals);

	// We already ran _HashHTMLBlocks() before, in Markdown(), but that
	// was to escape raw HTML in the original Markdown source. This time,
	// we're escaping the markup we've just created, so that we don't wrap
	// <p> tags around block-level tags.
	text = hashHTMLBlocks(text, options, globals);
	text = paragraphs(text, options, globals);

	text = globals.converter
		?._dispatch("blockGamut.after", text, options, globals)
		.getText() as string;

	return text;
}
/**
 * Process the contents of a single ordered or unordered list, splitting it
 * into individual list items.
 * @param {string} text The text to process
 * @param {ConverterOptions} options The conversion options
 * @param {GlobalConverter} globals The globals object
 * @returns {string} The processed text
 */
//
function lists(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	/**
	 * Process the contents of a single ordered or unordered list, splitting it
	 * into individual list items.
	 * @param {string} listStr
	 * @param {boolean} trimTrailing
	 * @returns {string}
	 */
	function processListItems(listStr: string, trimTrailing: boolean): string {
		// The $g_list_level global keeps track of when we're inside a list.
		// Each time we enter a list, we increment it; when we leave a list,
		// we decrement. If it's zero, we're not in a list anymore.
		//
		// We do this because when we're not inside a list, we want to treat
		// something like this:
		//
		//    I recommend upgrading to version
		//    8. Oops, now this line is treated
		//    as a sub-list.
		//
		// As a single paragraph, despite the fact that the second line starts
		// with a digit-period-space sequence.
		//
		// Whereas when we're inside a list (or sub-list), that line will be
		// treated as the start of a sub-list. What a kludge, huh? This is
		// an aspect of Markdown's syntax that's hard to parse perfectly
		// without resorting to mind-reading. Perhaps the solution is to
		// change the syntax rules such that sub-lists must start with a
		// starting cardinal number; e.g. "1." or "a.".
		let aa = globals.gListLevel as number;
		aa++;

		// trim trailing blank lines:
		listStr = listStr.replace(/\n{2,}$/, "\n");

		// attacklab: add sentinel to emulate \z
		listStr += "¨0";

		let rgx =
			/(\n)?(^ {0,3})([*+-]|\d+[.])[ \t]+((\[([xX ])])?[ \t]*[^\r]+?(\n{1,2}))(?=\n*(¨0| {0,3}([*+-]|\d+[.])[ \t]+))/gm;
		const isParagraphed = /\n[ \t]*\n(?!¨0)/.test(listStr);

		// Since version 1.5, nesting sublists requires 4 spaces (or 1 tab) indentation,
		// which is a syntax breaking change
		// activating this option reverts to old behavior
		// This will be removed in version 2.0
		if (options.disableForced4SpacesIndentedSublists) {
			rgx =
				/(\n)?(^ {0,3})([*+-]|\d+[.])[ \t]+((\[([xX ])])?[ \t]*[^\r]+?(\n{1,2}))(?=\n*(¨0|\2([*+-]|\d+[.])[ \t]+))/gm;
		}

		listStr = listStr.replace(
			rgx,
			(wholeMatch, m1, m2, m3, m4, taskbtn, checked) => {
				checked = checked && checked.trim() !== "";

				let item = outdent(m4, options, globals);
				let bulletStyle = "";

				// Support for github tasklists
				if (taskbtn && options.tasklists) {
					// Style used for tasklist bullets
					bulletStyle = ' class="task-list-item';
					if (options.moreStyling) {
						bulletStyle += checked ? " task-list-item-complete" : "";
					}
					bulletStyle += '" style="list-style-type: none;"';

					item = item.replace(/^[ \t]*\[([xX ])?]/m, () => {
						let otp =
							'<input type="checkbox" disabled style="margin: 0px 0.35em 0.25em -1.6em; vertical-align: middle;"';
						if (checked) {
							otp += " checked";
						}
						otp += ">";
						return otp;
					});
				}

				// ISSUE #312
				// This input: - - - a
				// causes trouble to the parser, since it interprets it as:
				// <ul><li><li><li>a</li></li></li></ul>
				// instead of:
				// <ul><li>- - a</li></ul>
				// So, to prevent it, we will put a marker (¨A)in the beginning of the line
				// Kind of hackish/monkey patching, but seems more effective than overcomplicating the list parser
				item = item.replace(
					/^([-*+]|\d\.)[ \t]+[\S\n ]*/g,
					(wm2) => `¨A${wm2}`,
				);

				// SPECIAL CASE: a heading followed by a paragraph of text that is not separated by a double newline
				// or/nor indented. ex:
				//
				// - # foo
				// bar is great
				//
				// While this does now follow the spec per se, not allowing for this might cause confusion since
				// header blocks don't need double-newlines after
				if (/^#+.+\n.+/.test(item)) {
					item = item.replace(/^(#+.+)$/m, "$1\n");
				}

				// m1 - Leading line or
				// Has a double return (multi paragraph)
				if (m1 || item.search(/\n{2,}/) > -1) {
					item = githubCodeBlocks(item, options, globals) as string;
					item = blockQuotes(item, options, globals) as string;
					item = headers(item, options, globals) as string;
					item = lists(item, options, globals) as string;
					item = codeBlocks(item, options, globals) as string;
					item = tables(item, options, globals) as string;
					item = hashHTMLBlocks(item, options, globals) as string;
					//item = showdown.subParser('makehtml.paragraphs')(item, options, globals);

					// TODO: This is a copy of the paragraph parser
					// This is a provisory fix for issue #494
					// For a permanente fix we need to rewrite the paragraph parser, passing the unhashify logic outside
					// so that we can call the paragraph parser without accidently unashifying previously parsed blocks

					// Strip leading and trailing lines:
					item = item.replace(/^\n+/g, "");
					item = item.replace(/\n+$/g, "");

					const grafs = item.split(/\n{2,}/g);
					const grafsOut: string[] = [];
					const end = grafs.length; // Wrap <p> tags

					for (let i = 0; i < end; i++) {
						let str = grafs[i];
						// if this is an HTML marker, copy it
						if (str.search(/¨([KG])(\d+)\1/g) >= 0) {
							grafsOut.push(str);

							// test for presence of characters to prevent empty lines being parsed
							// as paragraphs (resulting in undesired extra empty paragraphs)
						} else if (str.search(/\S/) >= 0) {
							str = spanGamut(str, options, globals) as string;
							str = str.replace(/^([ \t]*)/g, "<p>");
							str += "</p>";
							grafsOut.push(str);
						}
					}
					item = grafsOut.join("\n");
					// Strip leading and trailing lines:
					item = item.replace(/^\n+/g, "");
					item = item.replace(/\n+$/g, "");
				} else {
					// Recursion for sub-lists:
					item = lists(item, options, globals) as string;
					item = item.replace(/\n$/, ""); // chomp(item)
					item = hashHTMLBlocks(item, options, globals) as string;

					// Colapse double linebreaks
					item = item.replace(/\n\n+/g, "\n\n");

					if (isParagraphed) {
						item = paragraphs(item, options, globals) as string;
					} else {
						item = spanGamut(item, options, globals) as string;
					}
				}

				// now we need to remove the marker (¨A)
				item = item.replace("¨A", "");
				// we can finally wrap the line in list item tags
				item = `<li${bulletStyle}>${item}</li>\n`;

				return item;
			},
		);

		// attacklab: strip sentinel
		listStr = listStr.replace(/¨0/g, "");
		let bb = globals.gListLevel as number;
		bb--;

		if (trimTrailing) {
			listStr = listStr.replace(/\s+$/, "");
		}

		return listStr;
	}

	/**
	 * Returns a string with the start attribute if the list is an ordered list and
	 * the first item is not 1. Otherwise returns an empty string.
	 * @param list The list to be processed
	 * @param listType The type of the list
	 * @returns A string with the start attribute
	 */
	function styleStartNumber(list: string, listType: string) {
		// check if ol and starts by a number different than 1
		if (listType === "ol") {
			const res = list.match(/^ *(\d+)\./);
			if (res && res[1] !== "1") {
				return `start="${res[1]}"`;
			}
		}
		return "";
	}

	/**
	 * Check and parse consecutive lists (better fix for issue #142)
	 * @param {string} list
	 * @param {string} listType
	 * @param {boolean} trimTrailing
	 * @returns {string}
	 */
	function parseConsecutiveLists(
		list: string,
		listType: string,
		trimTrailing: boolean,
	): string {
		// check if we caught 2 or more consecutive lists by mistake
		// we use the counterRgx, meaning if listType is UL we look for OL and vice versa
		const olRgx = options.disableForced4SpacesIndentedSublists
			? /^ ?\d+\.[ \t]/gm
			: /^ {0,3}\d+\.[ \t]/gm;
		const ulRgx = options.disableForced4SpacesIndentedSublists
			? /^ ?[*+-][ \t]/gm
			: /^ {0,3}[*+-][ \t]/gm;
		let counterRxg = listType === "ul" ? olRgx : ulRgx;
		let result = "";

		if (list.search(counterRxg) !== -1) {
			(function parseCL(txt) {
				const pos = txt.search(counterRxg);
				const style = styleStartNumber(list, listType);
				if (pos !== -1) {
					// slice
					result += `\n\n<${listType}${style}>\n${processListItems(
						txt.slice(0, pos),
						!!trimTrailing,
					)}</${listType}>\n`;

					// invert counterType and listType
					listType = listType === "ul" ? "ol" : "ul";
					counterRxg = listType === "ul" ? olRgx : ulRgx;

					//recurse
					parseCL(txt.slice(pos));
				} else {
					result += `\n\n<${listType}${style}>\n${processListItems(
						txt,
						!!trimTrailing,
					)}</${listType}>\n`;
				}
			})(list);
		} else {
			const style = styleStartNumber(list, listType);
			result = `\n\n<${listType}${style}>\n${processListItems(
				list,
				!!trimTrailing,
			)}</${listType}>\n`;
		}

		return result;
	}

	// Start of list parsing
	const subListRgx =
		/^(( {0,3}([*+-]|\d+[.])[ \t]+)[^\r]+?(¨0|\n{2,}(?=\S)(?![ \t]*(?:[*+-]|\d+[.])[ \t]+)))/gm;
	const mainListRgx =
		/(\n\n|^\n?)(( {0,3}([*+-]|\d+[.])[ \t]+)[^\r]+?(¨0|\n{2,}(?=\S)(?![ \t]*(?:[*+-]|\d+[.])[ \t]+)))/gm;

	text = globals.converter
		?._dispatch("lists.before", text, options, globals)
		.getText() as string;
	// add sentinel to hack around khtml/safari bug:
	// http://bugs.webkit.org/show_bug.cgi?id=11231
	text += "¨0";

	if (globals.gListLevel) {
		text = text.replace(subListRgx, (wholeMatch, list, m2) => {
			const listType = m2.search(/[*+-]/g) > -1 ? "ul" : "ol";
			return parseConsecutiveLists(list, listType, true);
		});
	} else {
		text = text.replace(mainListRgx, (wholeMatch, m1, list, m3) => {
			const listType = m3.search(/[*+-]/g) > -1 ? "ul" : "ol";
			return parseConsecutiveLists(list, listType, false);
		});
	}

	// strip sentinel
	text = text.replace(/¨0/, "");
	text = globals.converter
		?._dispatch("lists.after", text, options, globals)
		.getText() as string;
	return text;
}

export { hashHTMLBlocks, blockGamut };
