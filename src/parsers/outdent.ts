import type { ParserOptions, GlobalOptions } from "../types.js";
export default function outdent(
  text: string,
  options?: ParserOptions,
  globals?: GlobalOptions
): string {
  return text.replace(/^(\t|[ ]{1,4})/gm, "").trim();
}
