import type { GlobalConverter } from "../globals.js";
import { helpers } from "../helpers.js";
import type { ConverterOptions } from "../options.js";
import { detab } from "./detab.js";
import { encodeCode } from "./encodeCode.js";
import { hashBlock } from "./hashBlock.js";
import { hashHTMLSpans } from "./hashHTMLSpans.js";
import { outdent } from "./outdent.js";
/**
 * #### codeBlocks
 *
 * Finds code blocks and sends them off to be processed by `hashBlock`.
 *
 * @param text The text to parse
 * @param options The conversion options
 * @param globals The global Markdown converter state
 * @returns The parsed text
 */
function codeBlocks(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	text = globals.converter
		?._dispatch("codeBlocks.before", text, options, globals)
		.getText() as string;

	// sentinel workarounds for lack of \A and \Z, safari\khtml bug
	text += "¨0";
	const pattern =
		/(?:\n\n|^)((?:(?:[ ]{4}|\t).*\n+)+)(\n*[ ]{0,3}[^ \t\n]|(?=¨0))/g;
	text = text.replace(pattern, (wholeMatch, m1, m2) => {
		let codeblock = m1;
		const nextChar = m2;
		let end = "\n";
		codeblock = outdent(codeblock, options, globals);
		codeblock = encodeCode(codeblock, options, globals);
		codeblock = detab(codeblock, options, globals);
		codeblock = codeblock.replace(/^\n+/g, ""); // trim leading newlines
		codeblock = codeblock.replace(/\n+$/g, ""); // trim trailing newlines
		if (options.omitCodeBlocks) {
			end = "";
		}
		codeblock = `<pre><code>${codeblock}${end}</code></pre>`;
		return `${hashBlock(codeblock, options, globals)}${nextChar}`;
	});
	// strip sentinel
	text = text.replace(/¨0/, "");

	text = globals.converter
		?._dispatch("codeBlocks.after", text, options, globals)
		.getText() as string;
	return text;
}

/**
 * Replaces code spans with `<code>` elements. This is used by `codeBlocks` to
 * generate `<code>` elements inside of `<pre>` blocks.
 *
 * @param text The text to parse
 * @param options The conversion options
 * @param globals The global Markdown converter state
 * @returns The parsed text
 */
function codeSpans(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	text = globals.converter
		?._dispatch("codeSpans.before", text, options, globals)
		.getText() as string;

	if (typeof text === "undefined") {
		text = "";
	}
	text = text.replace(
		/(^|[^\\])(`+)([^\r]*?[^`])\2(?!`)/gm,
		(wholeMatch, m1, m2, m3) => {
			let c = m3;
			c = c.replace(/^([ \t]*)/g, ""); // leading whitespace
			c = c.replace(/[ \t]*$/g, ""); // trailing whitespace
			c = encodeCode(c, options, globals);
			c = `${m1}<code>${c}</code>`;
			c = hashHTMLSpans(c, options, globals);
			return c;
		},
	);

	text = globals.converter
		?._dispatch("codeSpans.after", text, options, globals)
		.getText() as string;
	return text;
}

function hashPreCodeTags(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	text = globals.converter
		?._dispatch("hashPreCodeTags.before", text, options, globals)
		.getText() as string;

	const repFunc = (
		wholeMatch: any,
		match: string,
		left: string | number,
		right: any,
	) => {
		// encode html entities
		const codeblock = `${left}${encodeCode(match, options, globals)}${right}`;
		return `\n\n¨G"${
			globals.ghCodeBlocks.push({ text: wholeMatch, codeblock: codeblock }) - 1
		}G\n\n`;
	};
	// Hash <pre><code>
	text = helpers.replaceRecursiveRegExp(
		text,
		repFunc,
		"^ {0,3}<pre\\b[^>]*>\\s*<code\\b[^>]*>",
		"^ {0,3}</code>\\s*</pre>",
		"gim",
	);

	text = globals.converter
		?._dispatch("hashPreCodeTags.after", text, options, globals)
		.getText() as string;
	return text;
}

function hashCodeTags(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	text = globals.converter
		?._dispatch("hashCodeTags.before", text, options, globals)
		.getText() as string;

	const repFunc = (
		wholeMatch: any,
		match: string,
		left: string | number,
		right: any,
	) => {
		// encode html entities
		const codeblock = `${left}${encodeCode(match, options, globals)}${right}`;
		return `¨C${globals.gHtmlSpans.push(codeblock) - 1}C`;
	};
	// Hash <pre><code>
	text = helpers.replaceRecursiveRegExp(
		text,
		repFunc,
		"<code\\b[^>]*>",
		"</code>",
		"gim",
	);

	text = globals.converter
		?._dispatch("hashCodeTags.after", text, options, globals)
		.getText() as string;
	return text;
}

function githubCodeBlocks(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	text = globals.converter
		?._dispatch("githubCodeBlocks.before", text, options, globals)
		.getText() as string;

	text += "¨0";
	const pattern =
		/(?:^|\n) {0,3}(```+|~~~+) *([^\n\t`~]*)\n([\s\S]*?)\n {0,3}\1/g;
	text = text.replace(pattern, (wholeMatch, delim, language, codeblock) => {
		const end = options.omitCodeBlocks ? "" : "\n";
		language = language.trim().split(" ")[0];
		codeblock = encodeCode(codeblock, options, globals);
		codeblock = detab(codeblock, options, globals);
		codeblock = codeblock.replace(/^\n+/g, "").replace(/\n+$/g, ""); // trim leading newlines and trailing whitespace

		const langClass = options.jsx
			? `className="${language} language-${language}"`
			: `class="${language} language-${language}"`;
		codeblock = `<pre><code ${langClass}>${codeblock}${end}</code></pre>`;
		codeblock = hashBlock(codeblock, options, globals);

		return `\n\n¨G${globals.ghCodeBlocks.push({
			text: wholeMatch,
			codeblock,
		})}G\n\n`;
	});
	text = text.replace(/¨0/, "");

	return globals.converter
		?._dispatch("githubCodeBlocks.after", text, options, globals)
		.getText() as string;
}

export {
	githubCodeBlocks,
	hashCodeTags,
	hashPreCodeTags,
	codeSpans,
	codeBlocks,
};
