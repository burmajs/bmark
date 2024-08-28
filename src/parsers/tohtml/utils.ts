import { Converter } from "../../converter/converter.js";
import { ConverterGlobals } from "../../lib/globals.js";
import { ConverterOptions } from "../../lib/options.js";

export type SubParserParams = {
  text: string;
  options: ConverterOptions;
  globals: ConverterGlobals;
};

export function dispatchConverter(name: string, opts: SubParserParams): string {
  const gc = opts.globals.converter as Converter;
  return gc
    ._dispatch(name, opts.text, opts.options, opts.globals)
    .getText() as string;
}
