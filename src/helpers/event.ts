import type {
  EventTypes,
  EventArgs,
  ConverterOptions,
  ConverterGlobals,
} from "../types.js";

export class BmarkEvent implements EventTypes {
  parsedText: string | string[] | null;
  _stopExecution: boolean;
  getName: () => string | undefined;
  getEventName: () => string | undefined;
  getRegexp: () => RegExp | null | undefined;
  getConverter: () => any;
  getGlobals: () => {} | ConverterGlobals | undefined;
  getCapturedText: () => string | undefined;
  getOptions: () => {} | ConverterOptions | undefined;
  preventDefault: (bool: boolean) => void;
  getText: () => string | undefined;
  setText: (newText: string) => void;
  getMatches: () => {} | Object | undefined;
  setMatches: (newMatches: Object | {}) => void;
  constructor({ name, text, params }: EventArgs) {
    this.parsedText = params?.parsedText || null;
    this._stopExecution = false;
    this.getName = function () {
      return name;
    };
    this.getEventName = function () {
      return name;
    };
    this.getRegexp = function () {
      return params?.regexp;
    };
    this.getOptions = function () {
      return params?.options;
    };
    this.getConverter = function () {
      return params?.converter;
    };
    this.getGlobals = function () {
      return params?.globals;
    };
    this.getCapturedText = function () {
      return text;
    };
    this.getText = function () {
      return text;
    };

    this.setText = function (newText: string) {
      text = newText;
    };

    this.getMatches = function () {
      return params?.matches;
    };

    this.setMatches = function (newMatches: Object | {}) {
      let aa = params?.matches as Object | {};
      aa = newMatches;
    };

    this.preventDefault = function (bool: boolean) {
      this._stopExecution = !bool;
    };
  }
}
