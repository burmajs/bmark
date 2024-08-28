import type { ParserOptions, GlobalOptions } from "../types.js";
export default function detab(
  text: string,
  options?: ParserOptions,
  globals?: GlobalOptions
) {
  return text
    .replace(/\t(?=\t)/g, "    ") // Replace consecutive tabs with four spaces
    .replace(/\t/g, "¨A¨B") // Replace remaining tabs with placeholders ¨A¨B
    .replace(/¨B(.+?)¨A/g, (wholeMatch, m1) => {
      const leadingText = m1;
      const numSpaces = 4 - (leadingText.length % 4); // Calculate number of spaces needed to align text

      return leadingText + " ".repeat(numSpaces); // Add required spaces to align text
    })
    .replace(/¨A/g, "    ") // Replace ¨A with four spaces
    .replace(/¨B/g, ""); // Remove ¨B placeholders
}
