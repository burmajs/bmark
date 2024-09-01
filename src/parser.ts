import { type ConverterOptions } from "./converter.js";
import { type GlobalConverter } from "./globals.js";

type Parsers = {
  [name: string]: ParserFunction;
};
export const parsers: Parsers = {}; //1st

type ParserFunction = (
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter,
  ext?: any //TODO
) => string | void | ((wholeMatch: any, m1: any) => any);
export function dispatch(
  name: string,
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  const txt: string = globals.converter
    ?._dispatch(name, text, options, globals)
    .getText() as string;
  return txt;
}
export function registerParser(name: string, func: ParserFunction): void {
  if (!name || typeof func !== "function") {
    throw new Error(
      `Name and function of parser are required, and ${func} must be a function.`
    );
  }
  if (parsers.hasOwnProperty(name)) {
    throw new Error(`Parser ${name} is already registered.`);
  }

  parsers[name] = func;
}

export function runParser(name: string): ParserFunction {
  if (!parsers.hasOwnProperty(name)) {
    throw new Error(`${name} not registered.`);
  }
  return parsers[name];
}

export function removeParser(name: string): void {
  if (!parsers.hasOwnProperty(name)) {
    throw new Error(`${name} not registered.`);
  }
  delete parsers[name];
}
