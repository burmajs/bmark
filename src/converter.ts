import { event } from "./event.js";

export interface ConvertOpts {
  ellipsis?: boolean;
  emoji?: boolean;
  underscores?: boolean;
  strikethrough?: boolean;
  underline?: boolean;
  metadata?: boolean;
  omitCodeBlocks?: boolean;
  ghCodeBlocks?: boolean;
} //TODO
export interface ConverterOptions extends ConvertOpts {} //TODO
type Listeners = {
  [name: string]: any;
};

export const defaultOptions: ConverterOptions = {
  ellipsis: true,
  emoji: true,
  underscores: false,
  strikethrough: false,
  underline: false,
  metadata: false,
  omitCodeBlocks: false,
  ghCodeBlocks: true,
};

/**
 * Markdown converter
 */
export class Converter {
  opts: ConverterOptions | undefined;
  constructor(options?: ConverterOptions) {
    this.opts = options;
  }
  private listeners: Listeners = {};

  _dispatch(
    evtName: string,
    text: string,
    options: ConverterOptions,
    globals: any,
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
}
