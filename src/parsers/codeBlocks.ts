import type { ParserOptions, GlobalOptions } from "../types.js";
import outdent from "./outdent.js";
import encodeCode from "./encode_code.js";
import detab from "./detab.js";
import hashBlock from "./hashBlock.js";
export default function codeBlocks(
  text: string,
  options: ParserOptions,
  globals: GlobalOptions
) {
  text += "¨0";
  const pattern =
    /(?:\n\n|^)((?:(?:[ ]{4}|\t).*\n+)+)(\n*[ ]{0,3}[^ \t\n]|(?=¨0))/g;
  text = text.replace(pattern, (wholeMatch, m1, m2) => {
    let codeblock = m1;
    let nextChar = m2;
    let end = "\n";
    codeblock = outdent(codeblock, options, globals);
    codeblock = encodeCode(codeblock, options, globals);
    codeblock = detab(codeblock, options, globals);
    codeblock = codeblock.replace(/^\n+/g, ""); // trim leading newlines
    codeblock = codeblock.replace(/\n+$/g, ""); // trim trailing newlines

    if (options.omitExtraCodeBlocks) {
      end = "";
    }

    codeblock = "<pre><code>" + codeblock + end + "</code></pre>";

    return hashBlock(codeblock, globals, options);
  });
  text = text.replace(/¨0/, "");
  return text;
}
