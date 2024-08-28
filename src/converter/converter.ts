import { type ConverterOptions } from "../lib/options.js";
import { BmarkExtensions, EventListener } from "../extension/type.js";
import { validate } from "../extension/validate.js";
import { BGlobal, ConverterGlobals } from "../lib/globals.js";
import { BmarkEvent, EventArgs } from "../helpers/event.js";
import { helper } from "../helpers/index.js";
import { bmark } from "../lib/bmark.js";
import { globalOptions } from "../lib/options.js";

type Listeners = {
  [key: string]: EventListener;
};
type DisParams = {
  converter: Converter;
  text: string;
  options: ConverterOptions;
  globals: ConverterGlobals;
};
export class Converter {
  private opts: ConverterOptions | undefined;
  private options: ConverterOptions;
  private globalOptions: ConverterOptions;
  private extensions: BmarkExtensions;
  private langExtensions: any[];
  private outputModifiers: any[];
  private listeners: { [name: string]: any };

  constructor(opts?: ConverterOptions) {
    this.opts = opts;
    /**
     * Options used by this converter
     */
    this.options = {};
    this.globalOptions = globalOptions;
    this.extensions = {};
    /**
     * Language extensions used by this converter
     */
    this.langExtensions = [];
    /**
     * Output modifiers extensions used by this converter
     */
    this.outputModifiers = [];
    this.listeners = {};
    this._constructor();
  }
  private _constructor() {
    this.opts = this.opts || {};
    for (let gOpt in this.globalOptions) {
      if (this.globalOptions.hasOwnProperty(gOpt)) {
        this.options[gOpt] = this.globalOptions[gOpt];
      }
    }
    // Merge options
    if (typeof this.opts === "object") {
      for (var opt in this.opts) {
        if (this.opts.hasOwnProperty(opt)) {
          this.options[opt] = this.opts[opt];
        }
      }
    } else {
      throw Error(
        "Converter expects the passed parameter to be an object, but " +
          typeof this.opts +
          " was passed instead."
      );
    }
    if (this.options.extensions) {
      helper.forEach(this.options.extensions, this._parseExtension);
    }
  }
  private _parseExtension(ext: any, name: string | null) {
    name = name || null;
    if (bmark.helper.isString(ext)) {
      ext = bmark.helper.stdExtName(ext);
      name = ext;
      // LEGACY_SUPPORT CODE
      if (this.extensions[ext]) {
        console.warn(
          "DEPRECATION WARNING: " +
            ext +
            " is an old extension that uses a deprecated loading method." +
            "Please inform the developer that the extension should be updated!"
        );
        this.legacyExtensionLoading(this.extensions[ext], ext);
        return;
        // END LEGACY SUPPORT CODE
      } else if (!bmark.helper.isUndefined(this.extensions[ext])) {
        ext = this.extensions[ext];
      } else {
        throw Error(
          'Extension "' +
            ext +
            '" could not be loaded. It was either not found or is not a valid extension.'
        );
      }
    }
    if (typeof ext === "function") {
      ext = ext();
    }
    if (!bmark.helper.isArray(ext)) {
      ext = [ext];
    }
    var validExt = validate(ext, name as string);
    if (!validExt.valid) {
      throw Error(validExt.error);
    }

    for (var i = 0; i < ext.length; ++i) {
      switch (ext[i].type) {
        case "lang":
          this.langExtensions.push(ext[i]);
          break;

        case "output":
          this.outputModifiers.push(ext[i]);
          break;
      }
      if (ext[i].hasOwnProperty("listeners")) {
        for (var ln in ext[i].listeners) {
          if (ext[i].listeners.hasOwnProperty(ln)) {
            this.listenn(ln, ext[i].listeners[ln]);
          }
        }
      }
    }
  }
  private legacyExtensionLoading(ext: any, name: string) {
    if (typeof ext === "function") {
      ext = ext(new bmark.Converter());
    }
    if (!bmark.helper.isArray(ext)) {
      ext = [ext];
    }
    var valid = validate(ext, name);

    if (!valid.valid) {
      throw Error(valid.error);
    }

    for (var i = 0; i < ext.length; ++i) {
      switch (ext[i].type) {
        case "lang":
          this.langExtensions.push(ext[i]);
          break;
        case "output":
          this.outputModifiers.push(ext[i]);
          break;
        default: // should never reach here
          throw Error("Extension loader error: Type unrecognized!!!");
      }
    }
  }
  private listenn(name: string, callback: Function) {
    if (!bmark.helper.isString(name)) {
      throw Error(
        "Invalid argument in converter.listen() method: name must be a string, but " +
          typeof name +
          " given"
      );
    }

    if (typeof callback !== "function") {
      throw Error(
        "Invalid argument in converter.listen() method: callback must be a function, but " +
          typeof callback +
          " given"
      );
    }
    name = name.toLowerCase();

    if (!this.listeners.hasOwnProperty(name)) {
      this.listeners[name] = [];
    }
    this.listeners[name].push(callback);
  }
  listen(name: string, callback: Function) {
    this.listenn(name, callback);
    return this;
  }
  _dispatch(
    evtName: string,
    text: string,
    options: ConverterOptions,
    globals: ConverterGlobals,
    pParams?: EventArgs["params"]
  ): BmarkEvent {
    evtName = evtName.toLowerCase();
    const params = pParams || {};
    params.converter = this;
    params.text = text;
    params.options = options;
    params.globals = globals;
    const event = new bmark.helper.Event({
      name: evtName,
      text: text,
      params: params,
    });
    if (this.listeners.hasOwnProperty(evtName)) {
      for (var ei = 0; ei < this.listeners[evtName].length; ++ei) {
        var nText = this.listeners[evtName][ei](event);
        if (nText && typeof nText !== "undefined") {
          event.setText(nText);
        }
      }
    }
    return event;
  }
}

function rTrimInputText(text: string) {
  const txt = text.match(/^\s*/) as RegExpMatchArray;
  const rsp = txt[0].length;
  const rgx = new RegExp("^\\s{0," + rsp + "}", "gm");
  return text.replace(rgx, "");
}
