import type { GlobalConverter } from "../globals.js";
import type { ConverterOptions } from "../options.js";

export function mathjax(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
) {
  text = globals.converter
    ?._dispatch("mathjax.before", text, options, globals)
    .getText() as string;
  text = text.replace(
    /\$\$(.*?)\$\$/gs,
    (wm, txt) => ` <mathxxxjax>${txt} </mathxxxjax>`
  );
  text = globals.converter
    ?._dispatch("mathjax.before", text, options, globals)
    .getText() as string;
  return text;
}
