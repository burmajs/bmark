import type { GlobalConverter } from "../globals.js";
import { helpers } from "../helpers.js";
import type { ConverterOptions } from "../options.js";
import { codeBlocks, githubCodeBlocks } from "./codeBlocks.js";
import { encodeCode } from "./encodeCode.js";
import { hashBlock } from "./hashBlock.js";
import { hashElement } from "./ hashElement.js";
import { outdent } from "./outdent.js";
import { spanGamut } from "./spanGamut.js";
import { tables } from "./tables.js";

/* ----------------------------------------------------------------------------------------------------------------------------------------------------------- */

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
		if (left.search(/\bmarkdown\b/) !== -1) {
			txt = left + globals.converter?.toHtml(match) + right;
		}
		return `\n\n¨K${globals.gHtmlBlocks.push(txt) - 1}K\n\n`;
	};
	//   if (options.backslashEscapesHTMLTags) {
	//     text = text.replace(/\\<(\/?[^>]+?)>/g, (wm, inside) => {
	//       return `&lt;${inside}"&gt;`;
	//     });
	//   }
	for (let i = 0; i < blockTags.length; ++i) {
		let opTagPos: any;
		const rgx1 = new RegExp(`^·{0,3}(<${blockTags[i]}\\b[^>]*>)`, "im");
		const patLeft = `<${blockTags[i]}\\b[^>]*>`;
		const patRight = `</${blockTags[i]}>`;
		while ((opTagPos = helpers.regexIndexOf(text, rgx1)) !== -1) {
			const subTexts = helpers.splitAtIndex(text, opTagPos);

			const newSubText1 = helpers.replaceRecursiveRegExp(
				subTexts[1],
				repFunc,
				patLeft,
				patRight,
				"im",
			);

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

function paragraphs(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	text = globals.converter
		?._dispatch("paragraphs.before", text, options, globals)
		.getText() as string;
	text = text.replace(/^\n+/g, "");
	text = text.replace(/\n+$/g, "");

	const grafs = text.split(/\n{2,}/g);
	const grafsOut: any[] = [];
	let end = grafs.length;
	let i = 0;
	for (i = 0; i < end; i++) {
		let str = grafs[i];
		if (str.search(/¨(K|G)(\d+)\1/g) >= 0) {
			grafsOut.push(str);
		} else if (str.search(/\S/) >= 0) {
			str = spanGamut(str, options, globals);
			str = str.replace(/^([ \t]*)/g, "<p>");
			str += "</p>";
			grafsOut.push(str);
		}
	}
	end = grafsOut.length;
	for (i = 0; i < end; i++) {
		let blockText = "";
		let grafsOutIt = grafsOut[i];
		let codeFlag = false;
		while (/¨(K|G)(\d+)\1/.test(grafsOutIt)) {
			const delim = grafsOutIt.match(/¨(K|G)(\d+)\1/)[1];

			if (delim === "K") {
				blockText = globals.gHtmlBlocks[+RegExp.$2];
			} else {
				if (codeFlag) {
					const aa = globals.ghCodeBlocks[+RegExp.$2];
					const bb = aa.text as string;
					blockText = encodeCode(bb, options, globals);
				} else {
					blockText = globals.ghCodeBlocks[+RegExp.$2].codeblock as string;
				}
			}
			blockText = blockText.replace(/\$/g, "$$$$");
			grafsOutIt = grafsOutIt.replace(/(\n\n)?¨(K|G)\d+\2(\n\n)?/, blockText);
			if (/^<pre\b[^>]*>\s*<code\b[^>]*>/.test(grafsOutIt)) {
				codeFlag = true;
			}
		}
		grafsOut[i] = grafsOutIt;
	}
	text = grafsOut.join("\n");
	text = text.replace(/^\n+/g, "");
	text = text.replace(/\n+$/g, "");
	return globals.converter
		?._dispatch("paragraphs.after", text, options, globals)
		.getText() as string;
}

function headers(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	text = globals.converter
		?._dispatch("headers.before", text, options, globals)
		.getText() as string;
	const headerLevelStart = 1;
	const setextRegexH1 = /^(.+)[ \t]*\n={2,}[ \t]*\n+/gm;
	const setextRegexH2 = /^(.+)[ \t]*\n-{2,}[ \t]*\n+/gm;

	text = text.replace(setextRegexH1, (wholeMatch: string, m1: string) => {
		const _spanGamut = spanGamut(m1, options, globals);
		const hLevel = headerLevelStart;
		const _hashBlock = `<h${hLevel}>${_spanGamut}</h${hLevel}>`;
		return hashBlock(_hashBlock, options, globals);
	});

	text = text.replace(setextRegexH2, (matchFound: string, m1: string) => {
		const _spanGamut = spanGamut(m1, options, globals);
		const hLevel = headerLevelStart + 1;
		const _hashBlock = `<h${hLevel}>${_spanGamut}</h${hLevel}>`;
		return hashBlock(_hashBlock, options, globals);
	});
	const atxStyle = /^(#{1,6})[ \t]+(.+?)[ \t]*#*\n+/gm;

	text = text.replace(
		atxStyle,
		(wholeMatch: string, m1: string, m2: string) => {
			const span = spanGamut(m2, options, globals);
			const hLevel = headerLevelStart - 1 + m1.length;
			const header = `<h${hLevel}>${span}</h${hLevel}>`;

			return hashBlock(header, options, globals);
		},
	);

	text = globals.converter
		?._dispatch("headers.after", text, options, globals)
		.getText() as string;
	return text;
}

function blockQuotes(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	text = globals.converter
		?._dispatch("blockQuotes.before", text, options, globals)
		.getText() as string;
	text = `${text}\n\n`;
	const rgx = /(^ {0,3}>[ \t]?.+\n(.+\n)*\n*)+/gm;
	text = text.replace(rgx, (bq) => {
		bq = bq.replace(/^[ \t]*>[ \t]?/gm, "");
		bq = bq.replace(/¨0/g, "");

		bq = bq.replace(/^[ \t]+$/gm, "");
		bq = githubCodeBlocks(bq, options, globals);
		bq = blockGamut(bq, options, globals);
		bq = bq.replace(/(^|\n)/g, "$1  ");
		bq = bq.replace(/(\s*<pre>[^\r]+?<\/pre>)/gm, (wholeMatch, m1) => {
			let pre = m1;
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
function blockGamut(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	text = globals.converter
		?._dispatch("blockGamut.before", text, options, globals)
		.getText() as string;
	text = blockQuotes(text, options, globals);
	text = headers(text, options, globals);
	text = horizontalRule(text, options, globals);
	text = lists(text, options, globals);
	text = codeBlocks(text, options, globals);
	text = tables(text, options, globals);
	text = hashHTMLBlocks(text, options, globals);
	text = paragraphs(text, options, globals);

	text = globals.converter
		?._dispatch("blockGamut.after", text, options, globals)
		.getText() as string;

	return text;
}
function lists(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	function processListItems(listStr: string, trimTrailing: boolean): string {
		let aa = globals.gListLevel as number;
		aa++;
		listStr = listStr.replace(/\n{2,}$/, "\n");
		listStr += "¨0";
		const rgx =
			/(\n)?(^ {0,3})([*+-]|\d+[.])[ \t]+((\[([xX ])])?[ \t]*[^\r]+?(\n{1,2}))(?=\n*(¨0| {0,3}([*+-]|\d+[.])[ \t]+))/gm;
		const isParagraphed = /\n[ \t]*\n(?!¨0)/.test(listStr);
		listStr = listStr.replace(
			rgx,
			(wholeMatch, m1, m2, m3, m4, taskbtn, checked) => {
				checked = checked && checked.trim() !== "";

				let item = outdent(m4, options, globals);
				let bulletStyle = "";
				if (taskbtn) {
					bulletStyle = ' class="task-list-item';
					//   if (options.moreStyling) {
					//     bulletStyle += checked ? " task-list-item-complete" : "";
					//   }
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
				item = item.replace(
					/^([-*+]|\d\.)[ \t]+[\S\n ]*/g,
					(wm2) => `¨A${wm2}`,
				);
				if (/^#+.+\n.+/.test(item)) {
					item = item.replace(/^(#+.+)$/m, "$1\n");
				}
				if (m1 || item.search(/\n{2,}/) > -1) {
					item = githubCodeBlocks(item, options, globals) as string;
					item = blockQuotes(item, options, globals) as string;
					item = headers(item, options, globals) as string;
					item = lists(item, options, globals) as string;
					item = codeBlocks(item, options, globals) as string;
					item = tables(item, options, globals) as string;
					item = hashHTMLBlocks(item, options, globals) as string;
					item = item.replace(/^\n+/g, "");
					item = item.replace(/\n+$/g, "");

					const grafs = item.split(/\n{2,}/g);
					const grafsOut: string[] = [];
					const end = grafs.length;

					for (let i = 0; i < end; i++) {
						let str = grafs[i];
						if (str.search(/¨([KG])(\d+)\1/g) >= 0) {
							grafsOut.push(str);
						} else if (str.search(/\S/) >= 0) {
							str = spanGamut(str, options, globals) as string;
							str = str.replace(/^([ \t]*)/g, "<p>");
							str += "</p>";
							grafsOut.push(str);
						}
					}
					item = grafsOut.join("\n");
					item = item.replace(/^\n+/g, "");
					item = item.replace(/\n+$/g, "");
				} else {
					item = lists(item, options, globals) as string;
					item = item.replace(/\n$/, "");
					item = hashHTMLBlocks(item, options, globals) as string;
					item = item.replace(/\n\n+/g, "\n\n");
					if (isParagraphed) {
						item = paragraphs(item, options, globals) as string;
					} else {
						item = spanGamut(item, options, globals) as string;
					}
				}
				item = item.replace("¨A", "");
				item = `<li${bulletStyle}>${item}</li>\n`;
				return item;
			},
		);
		listStr = listStr.replace(/¨0/g, "");
		let bb = globals.gListLevel as number;
		bb--;

		if (trimTrailing) {
			listStr = listStr.replace(/\s+$/, "");
		}

		return listStr;
	}
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
	function parseConsecutiveLists(
		list: string,
		listType: string,
		trimTrailing: boolean,
	): string {
		const olRgx = /^ {0,3}\d+\.[ \t]/gm;
		const ulRgx = /^ {0,3}[*+-][ \t]/gm;
		let counterRxg = listType === "ul" ? olRgx : ulRgx;
		let result = "";

		if (list.search(counterRxg) !== -1) {
			(function parseCL(txt) {
				const pos = txt.search(counterRxg);
				const style = styleStartNumber(list, listType);
				if (pos !== -1) {
					result += `\n\n<${listType}${style}>\n${processListItems(
						txt.slice(0, pos),
						!!trimTrailing,
					)}</${listType}>\n`;
					listType = listType === "ul" ? "ol" : "ul";
					counterRxg = listType === "ul" ? olRgx : ulRgx;
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
	const subListRgx =
		/^(( {0,3}([*+-]|\d+[.])[ \t]+)[^\r]+?(¨0|\n{2,}(?=\S)(?![ \t]*(?:[*+-]|\d+[.])[ \t]+)))/gm;
	const mainListRgx =
		/(\n\n|^\n?)(( {0,3}([*+-]|\d+[.])[ \t]+)[^\r]+?(¨0|\n{2,}(?=\S)(?![ \t]*(?:[*+-]|\d+[.])[ \t]+)))/gm;

	text = globals.converter
		?._dispatch("lists.before", text, options, globals)
		.getText() as string;
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
	text = text.replace(/¨0/, "");
	text = globals.converter
		?._dispatch("lists.after", text, options, globals)
		.getText() as string;
	return text;
}

export { hashHTMLBlocks, blockGamut };
