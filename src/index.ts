import { getDefaultOptions, setAllOptionsTrue } from "./lib/options.js";
import type {
  OptionsValue,
  ConverterOptions,
  Flavor,
  FlavorOptions,
  BmarkOptions,
  BmarkExtension,
  BmarkExtensions,
  SubParser,
  Parsers,
  ConverterGlobals,
} from "./types.js";
import { flavor } from "./lib/flavor.js";
import { Converter } from "./converter/converter.js";
export type SubParserParams = {
  text: string;
  options: ConverterOptions;
  globals: ConverterGlobals;
};
export interface Bmark {
  [key: string]: any;
  setOption: (key: string, value: OptionsValue) => Bmark;
  getOption: (key: string) => OptionsValue;
  getOptions: () => ConverterOptions;
  resetOptions: () => void;
  getDefaultOptions: (simple: boolean) => ConverterOptions | undefined;
  setFlavor: (name: Flavor) => void;
  getFlavor: () => Flavor;
  getFlavorOptions: (name: Flavor) => BmarkOptions | undefined;
  subParser(name: string, func?: SubParser): SubParser | undefined;
}

//
function dispatchConverter(name: string, opts: SubParserParams): string {
  const gc = opts.globals.converter as Converter;
  return gc
    ._dispatch(name, opts.text, opts.options, opts.globals)
    .getText() as string;
}

export let globalOptions = getDefaultOptions(true) as ConverterOptions;
export let setFlavor: Flavor = "vanilla";
export let parsers: Parsers = {};
export const bmark: Bmark = {
  setOption(key, value) {
    "use strict";
    globalOptions[key] = value;
    return this;
  },
  getOption(key) {
    "use strict";
    return globalOptions[key];
  },
  getOptions() {
    "use strict";
    return globalOptions;
  },
  resetOptions() {
    "use strict";
    globalOptions = getDefaultOptions(true) as ConverterOptions;
  },
  getDefaultOptions(simple) {
    "use strict";
    return getDefaultOptions(simple) as ConverterOptions;
  },
  setFlavor(name: Flavor) {
    "use strict";
    if (!flavor.hasOwnProperty(name)) {
      throw Error(name + " flavor was not found");
    }
    this.resetOptions();
    const preset = flavor[name];
    setFlavor = name;
    for (var option in preset) {
      if (preset.hasOwnProperty(option)) {
        globalOptions[option] = preset[option];
      }
    }
  },
  getFlavor() {
    "use strict";
    return setFlavor;
  },
  getFlavorOptions(name) {
    "use strict";
    if (flavor.hasOwnProperty(name)) {
      return flavor[name];
    }
  },
  subParser(name, func) {
    "use strict";
    if (bmark.helper.isString(name)) {
      if (typeof func !== "undefined") {
        parsers[name] = func;
      } else {
        if (parsers.hasOwnProperty(name)) {
          return parsers[name];
        } else {
          throw Error("SubParser named " + name + " not registered!");
        }
      }
    } else {
      throw Error(
        "showdown.subParser function first argument must be a string (the name of the subparser)"
      );
    }
  },
};
bmark.subParser("tohtml.encodeCode", (opts: SubParserParams) => {
  "use strict";
  opts.text = dispatchConverter("tohtml.encodeCode.after", opts);
  opts.text = opts.text
    .replace(/&/g, "&amp;")
    // Do the angle bracket song and dance:
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Now, escape characters that are magic in Markdown:
    .replace(/([*_{}\[\]\\=~-])/g, bmark.helper.escapeCharactersCallback);
  opts.text = dispatchConverter("tohtml.encodeCode.after", opts);
  return opts.text;
});

console.log(bmark.subParser("tohtml.encodeCode"));
