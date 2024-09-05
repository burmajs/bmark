import type { Converter } from "./converter.js";
import type { ConverterOptions } from "./options.js";
import { helpers } from "./helpers.js";
import { validate } from "./validate.js";
type Extension = {
  type: "lang" | "output" | "listener";
  listeners?: { [event: string]: EventListener };
};

type RegexReplaceExtension = {
  regex?: string | RegExp;
  replace?: any; // string | Replace
};

type FilterExtension = {
  filter?: (
    text: string,
    converter: Converter,
    options?: ConverterOptions
  ) => string;
};

export type ShowdownExtension = Extension &
  RegexReplaceExtension &
  FilterExtension;
export type ShowdownExtensions = {
  [name: string]: ShowdownExtension[];
};
export type ConverterExtensions = {
  language: ShowdownExtension[];
  output: ShowdownExtension[];
};
export const extensions: ShowdownExtensions = {}; // 1st
export const registerExtension = (
  name: string,
  ext: ShowdownExtension | ShowdownExtension[]
) => {
  if (!Array.isArray(ext)) {
    ext = [ext];
  }
  const validExtension = validate(ext, name);

  if (validExtension.valid) {
    extensions[name] = ext;
  } else {
    throw Error(validExtension.error);
  }
};
