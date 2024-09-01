import { Converter } from "./converter.js";
export type Obj = {};
export type GlobalConverter = {
  converter?: Converter;
  gHtmlBlocks: any[];
  gHtmlSpans: string[];
  metadata: {
    parsed: any;
    raw: string;
    format: string;
  };
  ghCodeBlocks: Array<{
    codeblock?: string | undefined;
    text?: string | undefined;
  }>;
};
