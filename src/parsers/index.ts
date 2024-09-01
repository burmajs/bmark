import type { GlobalConverter } from "../globals.js";
import type { ConverterOptions } from "../converter.js";
const parsers = {
  encodeCode: (
    text: string,
    options: ConverterOptions,
    globals: GlobalConverter
  ) => {
    text = globals.converter?._dispatch("",text,options,globals).getText() as string
  },
};
