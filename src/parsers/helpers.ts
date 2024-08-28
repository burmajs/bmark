import type { GlobalOptions } from "../types.js";

export const parserHelpers = {
  escapeCharactersCallback(wholeMatch: any, m1: string): string {
    "use strict";
    var charCodeToEscape = m1.charCodeAt(0);
    return "¨E" + charCodeToEscape + "E";
  },
  hashHtmlSpans(html: string, globals: GlobalOptions): string {
    return "¨C" + (globals.htmlSpans.push(html) - 1) + "C";
  },
};
