import { Converter } from "./converter.js";
import { GlobalConverter } from "./globals.js";
import { ConverterOptions } from "./options.js";

type EventParams = {
  regexp?: RegExp;
  matches: {
    wholeMatch: string;
    text: string;
    id: string;
    url: string;
    title: string;
  };
  options?: ConverterOptions;
  converter?: Converter;
  globals?: GlobalConverter;
  parsedText?: string;
};
export type EventResult = {
  getName: () => string;
  getCapturedText: () => string;
  getConverter: () => Converter | null;
  getEventName: () => string;
  getGlobals: () => {};
  getMatches: () => {
    wholeMatch: string;
    text: string;
    id: string;
    url: string;
    title: string;
  };
  getRegexp: () => RegExp | null;
  getOptions: () => ConverterOptions;
  getText: () => string;
  setMatches: (newMatches: EventParams["matches"]) => void;
  preventDefault: (bool: boolean) => void;
  setText: (newText: string) => void;
  parsedText: string | null;
};
export function event(
  name: string,
  text: string,
  params: EventParams
): EventResult {
  const regexp = params.regexp || null;
  let matches = params.matches;
  const options = params.options || {};
  const converter = params.converter || null;
  const globals = params.globals || {};

  const getName = () => {
    return name;
  };

  const getEventName = () => {
    return name;
  };

  let _stopExecution = false;

  const parsedText = params.parsedText || null;

  const getRegexp = () => {
    return regexp;
  };

  const getOptions = () => {
    return options;
  };

  const getConverter = () => {
    return converter;
  };

  const getGlobals = () => {
    return globals;
  };

  const getCapturedText = () => {
    return text;
  };

  const getText = () => {
    return text;
  };

  const setText = function (newText: string) {
    text = newText;
  };

  const getMatches = () => {
    return matches;
  };

  const setMatches = function (newMatches: EventParams["matches"]) {
    matches = newMatches;
  };

  const preventDefault = function (bool: boolean) {
    _stopExecution = !bool;
  };
  return {
    getName,
    getCapturedText,
    getConverter,
    getEventName,
    getGlobals,
    getMatches,
    getOptions,
    getRegexp,
    getText,
    setMatches,
    setText,
    preventDefault,
    parsedText,
  };
}
