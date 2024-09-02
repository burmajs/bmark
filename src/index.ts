import { type Flavor, flavor } from "./flavor.js";
import { Converter } from "./converter.js";
import { type ShowdownExtensions } from "./extensions.js";

type Bmark = {
  Converter: typeof Converter;
  extensions: ShowdownExtensions;
};
export const bmark: Bmark = {
  Converter: Converter,
  extensions: {},
};
