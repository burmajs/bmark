import { bmark } from "../../lib/bmark.js";
import { type SubParserParams, dispatchConverter } from "./utils.js";

bmark.subParser("tohtml.encodeCode", (opts: SubParserParams) => {
  "use strict";
  let text = opts.text;
  text = dispatchConverter("tohtml.encodeCode.after", opts)
  text = text
    .replace(/&/g, "&amp;")
    // Do the angle bracket song and dance:
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Now, escape characters that are magic in Markdown:
    .replace(/([*_{}\[\]\\=~-])/g, bmark.helper.escapeCharactersCallback);
  text = dispatchConverter("tohtml.encodeCode.after", opts);
  return text;
});

console.log(bmark.subParser("tohtml.encodeCode"))
