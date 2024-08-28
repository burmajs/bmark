import { bmark } from "./bmark.js";
/**
 * Type subParser.
 */
export type SubParser = (...args: any[]) => string;

type Parsers = {
  [name: string]: SubParser;
};

export interface BSubParser {
  subParser(name: string, func?: SubParser): SubParser | undefined;
}
export let parsers: Parsers = {};
export const bsubparser: BSubParser = {
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

