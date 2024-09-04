import type { GlobalConverter } from "../globals.js";
import { helpers } from "../helpers.js";
import type { ConverterOptions } from "../options.js";
import { codeSpans } from "./codeBlocks.js";
import { spanGamut } from "./spanGamut.js";

/**
 * Replaces all occurrences of tables with HTML tables.
 * @param   {string}  text          The text to parse.
 * @param   {object}  options       The options object.
 * @param   {object}  globals       The globals object.
 * @returns {string}  The text with all tables replaced with HTML tables.
 */
function tables(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	if (!options.tables) {
		return text;
	}

	/**
	 * Table regex will match the following:
	 *
	 *  a row with at least two columns
	 *  a row with dashed lines
	 *  one or more rows with two or more columns
	 *  a row with dashed lines
	 *  one or more rows with two or more columns
	 *  The end of the table is signified by:
	 *    - a blank line
	 *    - the end of the text
	 */
	const tableRgx =
		/^ {0,3}\|?.+\|.+\n {0,3}\|?[ \t]*:?[ \t]*[-=]{2,}[ \t]*:?[ \t]*\|[ \t]*:?[ \t]*[-=]{2,}[\s\S]+?(?:\n\n|¨0)/gm;

	/**
	 * Single column table regex will match the following:
	 *
	 *  a row with one column
	 *  a row with dashed lines
	 *  one or more rows with one column
	 *  a row with dashed lines
	 *  one or more rows with one column
	 *  The end of the table is signified by:
	 *    - a blank line
	 *    - the end of the text
	 */
	const singeColTblRgx =
		/^ {0,3}\|.+\|[ \t]*\n {0,3}\|[ \t]*:?[ \t]*[-=]{2,}[ \t]*:?[ \t]*\|[ \t]*\n( {0,3}\|.+\|[ \t]*\n)*(?:\n|¨0)/gm;

	/**
	 * Parse styles from a row with dashed lines.
	 * @param   {string}  sLine  The row to parse.
	 * @returns {string}  The style string.
	 *
	 * */
	function parseStyles(sLine: string): string {
		if (sLine.match(/^:[ \t]*--*$/)) {
			return ' style="text-align:left;"';
		}
		if (sLine.match(/^--*[ \t]*:[ \t]*$/)) {
			return ' style="text-align:right;"';
		}
		if (sLine.match(/^:[ \t]*--*[ \t]*:$/)) {
			return ' style="text-align:center;"';
		}
		return "";
	}

	/**
	 * Parse headers from a row with column names.
	 * @param   {string}  header  The header to parse.
	 * @param   {string}  style   The style string.
	 * @returns {string}  The parsed header.
	 */
	function parseHeaders(header: string, style: string) {
		let id = "";
		header = header.trim();
		// support both tablesHeaderId and tableHeaderId due to error in documentation so we don't break backwards compatibility
		if (options.tablesHeaderId || options.tablesHeaderId) {
			id = `id="${header.replace(/ /g, "_").toLowerCase()}"`;
		}
		header = spanGamut(header, options, globals);

		return `<th ${id} ${style}>${header}</th>\n`;
	}

	/**
	 * Parse a cell from a row of columns.
	 * @param   {string}  cell    The cell to parse.
	 * @param   {string}  style   The style string.
	 * @returns {string}  The parsed cell.
	 */
	function parseCells(cell: string, style: string) {
		const subText = spanGamut(cell, options, globals);
		return `<td ${style}>${subText}</td>\n`;
	}

	/**
	 * Build a table from the parsed headers and cells.
	 * @param   {string[]}  headers  The headers.
	 * @param   {string[][]}  cells    The cells.
	 * @returns {string}  The built table.
	 */
	function buildTable(headers: string | any[], cells: string | any[]): string {
		let tb = "<table>\n<thead>\n<tr>\n";
		const tblLgn = headers.length;
		let i: number;
		for (i = 0; i < tblLgn; ++i) {
			tb += headers[i];
		}
		tb += "</tr>\n</thead>\n<tbody>\n";

		for (i = 0; i < cells.length; ++i) {
			tb += "<tr>\n";
			for (let ii = 0; ii < tblLgn; ++ii) {
				tb += cells[i][ii];
			}
			tb += "</tr>\n";
		}
		tb += "</tbody>\n</table>\n";
		return tb;
	}

	/**
	 * Parse a table from the text.
	 * @param   {string}  rawTable  The text to parse.
	 * @returns {string}  The parsed table.
	 */
	function parseTable(rawTable: string): string {
		let i: number;
		const tableLines = rawTable.split("\n");

		for (i = 0; i < tableLines.length; ++i) {
			// strip wrong first and last column if wrapped tables are used
			if (/^ {0,3}\|/.test(tableLines[i])) {
				tableLines[i] = tableLines[i].replace(/^ {0,3}\|/, "");
			}
			if (/\|[ \t]*$/.test(tableLines[i])) {
				tableLines[i] = tableLines[i].replace(/\|[ \t]*$/, "");
			}
			// parse code spans first, but we only support one line code spans

			tableLines[i] = codeSpans(tableLines[i], options, globals);
		}

		const rawHeaders = tableLines[0].split("|").map((s: string) => s.trim());
		const rawStyles = tableLines[1].split("|").map((s: string) => s.trim());
		const rawCells: string[][] = [];
		const headers: string[] = [];
		const styles: string[] = [];
		const cells: string[][] = [];

		tableLines.shift();
		tableLines.shift();

		for (i = 0; i < tableLines.length; ++i) {
			if (tableLines[i].trim() === "") {
				continue;
			}
			rawCells.push(tableLines[i].split("|").map((s: string) => s.trim()));
		}

		if (rawHeaders.length < rawStyles.length) {
			return rawTable;
		}

		for (i = 0; i < rawStyles.length; ++i) {
			styles.push(parseStyles(rawStyles[i]));
		}

		for (i = 0; i < rawHeaders.length; ++i) {
			if (typeof styles[i] === "undefined") {
				styles[i] = "";
			}
			headers.push(parseHeaders(rawHeaders[i], styles[i]));
		}

		for (i = 0; i < rawCells.length; ++i) {
			const row: string[] = [];
			for (let ii = 0; ii < headers.length; ++ii) {
				if (typeof rawCells[i][ii] === "undefined") {
				}
				row.push(parseCells(rawCells[i][ii], styles[ii]));
			}
			cells.push(row);
		}

		return buildTable(headers, cells);
	}

	text = globals.converter
		?._dispatch("tables.before", text, options, globals)
		.getText() as string;

	// find escaped pipe characters
	text = text.replace(/\\(\|)/g, helpers.escapeCharactersCallback);

	// parse multi column tables
	text = text.replace(tableRgx, parseTable);

	// parse one column tables
	text = text.replace(singeColTblRgx, parseTable);

	text = globals.converter
		?._dispatch("tables.after", text, options, globals)
		.getText() as string;

	return text;
}

export { tables };
