import { event } from "./event.js";
import type { ShowdownExtension, ShowdownExtensions } from "./extensions.js";
import Frontmatter, { type FrontMatterResult } from "@burmajs/frontmatter";
import { type Flavor, flavor } from "./flavor.js";
import type { GlobalConverter } from "./globals.js";
import { helpers } from "./helpers.js";
import { bmark } from "./index.js";
import { type ConverterOptions, getDefaultOptions } from "./options.js";
import { validate } from "./validate.js";
import { markdownParser } from "./parsers/index.js";
type Listeners = {
  [name: string]: any;
};
const globalOptions = getDefaultOptions();
const extensions: ShowdownExtensions = {};
/**
 * Markdown converter
 */
export class Converter {
  private opts: ConverterOptions | undefined;
  private listeners: Listeners = {};
  private langExtensions: GlobalConverter["langExtensions"] = [];
  private outputModifiers: GlobalConverter["outputModifiers"] = [];
  private options: ConverterOptions = {};
  metadata: GlobalConverter["metadata"] = {
    parsed: {},
    raw: "",
    format: "",
  };
  setConvFlavor: Flavor = "vanilla";
  constructor(options?: ConverterOptions) {
    this.opts = options ?? {};
    this.init();
  }
  private init() {
    for (const gOpt in globalOptions) {
      if (globalOptions.hasOwnProperty(gOpt)) {
        this.options[gOpt] = globalOptions[gOpt];
      }
    }
    // Merge options
    if (typeof this.opts === "object") {
      for (const opt in this.opts) {
        if (this.opts.hasOwnProperty(opt)) {
          this.options[opt] = this.opts[opt];
        }
      }
    } else {
      throw Error(
        `Converter expects the passed parameter to be an object, but ${typeof this
          .opts} was passed instead.`
      );
    }
    if (this.options.extensions) {
      helpers.forEach(this.options.extensions, this._parseExtension);
    }
  }
  private _parseExtension(name: string | null, ext?: any) {
    if (typeof ext === "string") {
      ext = helpers.stdExtName(ext);
      name = ext;

      // LEGACY_SUPPORT CODE
      if (bmark.extensions[ext]) {
        console.warn(
          `DEPRECATION·WARNING:·${ext}·is·an·old·extension·that·uses·a·deprecated·loading·method.Please·inform·the·developer·that·the·extension·should·be·updated!`
        );
        this.legacyExtensionLoading(bmark.extensions[ext], ext);
        return;
      }
      if (typeof extensions[ext] !== "undefined") {
        ext = extensions[ext];
      } else {
        throw Error(
          `Extension"${ext}"could not be loaded. It was either not found or is not a valid extension.`
        );
      }
    }
    if (typeof ext === "function") {
      ext = ext();
    }

    if (!Array.isArray(ext)) {
      ext = [ext];
    }

    const validExt = validate(ext, name as string);
    if (!validExt.valid) {
      throw Error(validExt.error);
    }

    for (let i = 0; i < ext.length; ++i) {
      switch (ext[i].type) {
        case "lang":
          this.langExtensions?.push(ext[i]);
          break;

        case "output":
          this.outputModifiers?.push(ext[i]);
          break;
      }
      if (ext[i].hasOwnProperty("listeners")) {
        for (const ln in ext[i].listeners) {
          if (ext[i].listeners.hasOwnProperty(ln)) {
            this.listen(ln, ext[i].listeners[ln]);
          }
        }
      }
    }
  }
  private legacyExtensionLoading(ext: any, name: string) {
    if (typeof ext === "function") {
      ext = ext(new bmark.Converter());
    } else {
      const extensions = Array.isArray(ext) ? ext : [ext];
      const valid = validate(extensions, name);

      if (valid?.error) {
        throw new Error(valid.error);
      }

      for (const extension of extensions) {
        switch (extension.type) {
          case "lang":
            this.langExtensions?.push(extension);
            break;
          case "output":
            this.outputModifiers?.push(extension);
            break;
          default:
            throw new Error("Extension loader error: Type unrecognized!!!");
        }
      }
    }
  }
  private listenInternal(name: string, callback: Function) {
    if (typeof name !== "string") {
      throw Error(
        `Invalid·argument·in·converter.listen()·method:·name·must·be·a·string,·but·${typeof name}·given`
      );
    }
    if (typeof callback !== "function") {
      throw Error(
        `Invalid·argument·in·converter.listen()·method:·callback·must·be·a·function,·but·${typeof callback}·given`
      );
    }
    name = name.toLowerCase();
    if (!this.listeners.hasOwnProperty(name)) {
      this.listeners[name] = [];
    }
    this.listeners[name].push(callback);
  }
  listen(name: string, callback: Function) {
    this.listenInternal(name, callback);
    return this;
  }
  _dispatch(
    evtName: string,
    text: string,
    options: ConverterOptions,
    globals: GlobalConverter,
    pParams?: any
  ) {
    const eventName = evtName.toLocaleLowerCase();
    const params = pParams ?? {};
    params.converter = this;
    params.text = text;
    params.options = options;
    params.globals = globals;
    const evt = event(eventName, text, params);

    if (this.listeners.hasOwnProperty(eventName)) {
      for (let i = 0; i < this.listeners[eventName].lenght; i++) {
        const newText = this.listeners[eventName][i](evt);
        if (newText && typeof newText !== "undefined") {
          evt.setText(newText);
        }
      }
    }
    return evt;
  }
  toHtml<T>(text: string) {
    //check if text is not falsy
    if (!text) {
      return text;
    }
    const globals: GlobalConverter = {
      gHtmlBlocks: [],
      gHtmlMdBlocks: [],
      gHtmlSpans: [],
      gUrls: {},
      gTitles: {},
      gDimensions: {},
      gListLevel: 0,
      hashLinkCounts: {},
      langExtensions: this.langExtensions,
      outputModifiers: this.outputModifiers,
      converter: this,
      ghCodeBlocks: [],
      metadata: {
        parsed: {},
        raw: "",
        format: "",
      },
    };
    const fm: FrontMatterResult<T> = new Frontmatter(text);
    const data: T = fm.data;
    text = fm.content;
    text = markdownParser(
      text,
      this.options,
      globals,
      this.langExtensions,
      this.outputModifiers
    );
    return text;
  }
  setOption(key: string, value: any): void {
    this.options[key] = value;
  }
  getOption(key: string) {
    return this.options[key];
  }
  getOptions(): ConverterOptions {
    return this.options;
  }
  /**
   * Adds a showdown extension to the converter.
   * @param {ShowdownExtension} extension - The extension to add.
   * @param {string | null} name - The name of the extension.
   * If not provided, the extension's name property will be used.
   * @throws {Error} If the extension is not a valid extension.
   */
  addExtension(extension: ShowdownExtension, name: string | null) {
    name = name || null;
    this._parseExtension(name, extension);
  }
  /**
   * Loads a showdown extension by name.
   * @param {string} extensionName - The name of the extension to load.
   * @throws {Error} If the extension is not found.
   */
  useExtension(extensionName: string) {
    this._parseExtension(extensionName);
  }
  /**
   * Sets the flavor of the converter.
   * @param {Flavor} name - The name of the flavor to set.
   * @throws {Error} If the flavor is not found.
   */
  setFlavor(name: Flavor) {
    if (!flavor.hasOwnProperty(name)) {
      throw Error(`${name} flavor was not found`);
    }
    const preset = flavor[name];
    this.setConvFlavor = name;
    for (const option in preset) {
      if (preset.hasOwnProperty(option)) {
        this.options[option] = preset[option];
      }
    }
  }
  /**
   * Returns the current flavor name.
   * @returns {string} The name of the current flavor.
   */
  getFlavor() {
    return this.setConvFlavor;
  }
}

