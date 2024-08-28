import type { ParserOptions, GlobalOptions } from "../types.js";
export default function encodeCode(
  text: string,
  options?: ParserOptions,
  globals?: GlobalOptions
): string {
  const htmlEntities: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "*": "\\*",
    _: "\\_",
    "{": "\\{",
    "}": "\\}",
    "[": "\\[",
    "]": "\\]",
    "\\": "\\\\",
    "=": "\\=",
    "~": "\\~",
    "-": "\\-",
  };

  return text.replace(/[&<>*_{}\[\]\\=~-]/g, (match) => htmlEntities[match]);
}
