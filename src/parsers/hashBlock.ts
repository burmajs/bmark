import type { ParserOptions, GlobalOptions } from "../types.js";

export default function hashBlock(
  text: string,
  globals: GlobalOptions,
  options?: ParserOptions
): string {
  text = text.replace(/(^\n+|\n+$)/g, "");
  text = `\n\n¨K${globals.htmlBlocks.push(text) - 1}K\n\n`;

  return text;
}
