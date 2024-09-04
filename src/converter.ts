import Frontmatter, { type FrontMatterResult } from "@burmajs/frontmatter";
import { event } from "./event.js";
import type { ShowdownExtension, ShowdownExtensions } from "./extensions.js";
import type { GlobalConverter } from "./globals.js";
import { helpers } from "./helpers.js";
import {
	type ConverterObjects,
	type ConverterOptions,
	type CoverterOptsValues,
	type OptionsName,
	getDefaultOptions,
} from "./options.js";
import { markdownParser } from "./parsers/index.js";
import { validate } from "./validate.js";
type Listeners = {
	[name: string]: any;
};

type HtmlOptions = {
	lang?: string;
	title?: string;
	cssLinks?: string[];
	/**
	 * Only .ico type
	 */
	favicon?: string;
	metaTags?: Array<{
		name: string;
		content: string;
	}>;
	scriptTags?: {
		head?: {
			scriptNormalTags?: string[];
			scriptModuleTags?: string[];
		};
		body?: {
			scriptNormalTags?: string[];
			scriptModuleTags?: string[];
		};
	};
};
const extensions: ShowdownExtensions = {};
/**
 * Markdown converter
 */
export class Converter<T = any> {
	private opts: ConverterOptions = {};
	private globalOptions: ConverterOptions = getDefaultOptions();
	private listeners: Listeners = {};
	private langExtensions: GlobalConverter["langExtensions"] = [];
	private outputModifiers: GlobalConverter["outputModifiers"] = [];
	private _text: string;
	private _fm: Frontmatter<T>;
	private _data: T;
	private _content: string;
	private _json: FrontMatterResult<T>;
	constructor(text: string, options?: ConverterOptions) {
		this.opts = options ?? {};
		this._text = text;
		this._fm = new Frontmatter(this._text);
		this._data = this._fm.data;
		this._content = this._fm.content;
		this._json = this._fm.json;
		this.init();
	}
	private init() {
		if (typeof this.opts === "object") {
			for (const gOpt in this.globalOptions) {
				if (this.globalOptions.hasOwnProperty(gOpt)) {
					this.opts[gOpt] = this.globalOptions[gOpt];
				}
			}
		} else {
			throw Error(
				`Converter expects the passed parameter to be an object, but ${typeof this
					.opts} was passed instead.`,
			);
		}
		if (this.opts.extensions) {
			helpers.forEach(this.opts.extensions, this._parseExtension);
		}
	}
	private _parseExtension(name: string | null, ext?: any) {
		if (typeof ext === "string") {
			ext = helpers.stdExtName(ext);
			name = ext;

			// LEGACY_SUPPORT CODE
			if (extensions[ext]) {
				console.warn(
					`DEPRECATION·WARNING:·${ext}·is·an·old·extension·that·uses·a·deprecated·loading·method.Please·inform·the·developer·that·the·extension·should·be·updated!`,
				);
				this.legacyExtensionLoading(extensions[ext], ext);
				return;
			}
			if (typeof extensions[ext] !== "undefined") {
				ext = extensions[ext];
			} else {
				throw Error(
					`Extension"${ext}"could not be loaded. It was either not found or is not a valid extension.`,
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
			ext = ext(new Converter(this._text));
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
				`Invalid·argument·in·converter.listen()·method:·name·must·be·a·string,·but·${typeof name}·given`,
			);
		}
		if (typeof callback !== "function") {
			throw Error(
				`Invalid·argument·in·converter.listen()·method:·callback·must·be·a·function,·but·${typeof callback}·given`,
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
		pParams?: any,
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
	private toHtml() {
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
		};
		let text = this._content;
		text = markdownParser(
			text,
			this.opts,
			globals,
			this.langExtensions,
			this.outputModifiers,
		);
		return text;
	}
	setOption({ name, value }: ConverterObjects): void {
		const key: string = name.toString();
		this.opts[key] = value;
	}
	getOption(name: OptionsName): CoverterOptsValues {
		const key: string = name.toString();
		return this.opts[key];
	}
	getAllOptions(): ConverterOptions {
		return this.opts;
	}
	setDefaultOptions() {
		this.opts = getDefaultOptions();
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
	get rawContent() {
		return this._content;
	}
	get yamlData() {
		if (typeof this._data !== "undefined") {
			return this._data;
		}
		return {};
	}
	get html() {
		return this.toHtml();
	}
	get json() {
		return this._json;
	}
	completeHtml(options?: HtmlOptions): string {
		const txt = this.toHtml();
		return htmlDoc(txt, options);
	}
}

const htmlDoc = (text: string, options?: HtmlOptions): string => {
	const lang = options?.lang ?? "en";
	const metaTags = options?.metaTags ?? [{ name: "", content: "" }];
	const cssLinks = options?.cssLinks ?? [""];
	const favicon = options?.favicon ?? "";
	const hnst = options?.scriptTags?.head?.scriptNormalTags ?? [""];
	const hmst = options?.scriptTags?.head?.scriptModuleTags ?? [""];
	const title = options?.title ?? "";
	const bnst = options?.scriptTags?.body?.scriptNormalTags ?? [""];
	const bmst = options?.scriptTags?.body?.scriptModuleTags ?? [""];
	const html = `
  <!DOCTYPE html>
    <html lang=${lang}>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${metaTags.map((i) => `<meta name=${i.name} content=${i.content}>`)}
        ${cssLinks.map((i) => `<link rel="stylesheet" href=${i}>`)}
        <link rel="shortcut icon" href=${favicon} type="image/x-icon">
         ${hnst.map((i) => ` <script src=${i}></script>`)}
         ${hmst.map((i) => `<script type="module" src=${i}></script>`)}
        <title>${title}</title>
    </head>
    <body>
        ${text}
          ${bnst.map((i) => ` <script src=${i}></script>`)}
         ${bmst.map((i) => `<script type="module" src=${i}></script>`)}
    </body>
    </html>
`;
	return html;
};
