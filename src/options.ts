import { type ShowdownExtension } from "./extensions.js";
type ExtType = Array<
  | (() => ShowdownExtension[] | ShowdownExtension)
  | ShowdownExtension[]
  | ShowdownExtension
  | string
>;
type BoolOpts = {
  [key: string]: boolean | string | ExtType | number | undefined;
  underscores?: boolean;
  strikethrough?: boolean;
  underline?: boolean;
  metadata?: boolean;
  omitCodeBlocks?: boolean;
  backslashEscapesHTMLTags?: boolean;
  relativePathBaseUrl?: boolean;
  openLinksInNewWindow?: boolean;
  ghMentions?: boolean;
  encodeEmails?: boolean;
  simplifiedAutoLink?: boolean;
  simpleLineBreaks?: boolean;
  smoothLivePreview?: boolean;
  noHeaderId?: boolean;
  requireSpaceBeforeHeadingText?: boolean;
  customizedHeaderId?: boolean;
  prefixHeaderId?: boolean;
  rawPrefixHeaderId?: boolean;
  ghCompatibleHeaderId?: boolean;
  rawHeaderId?: boolean;
  tables?: boolean;
  tablesHeaderId?: boolean;
  splitAdjacentBlockquotes?: boolean;
  disableForced4SpacesIndentedSublists?: boolean;
  tasklists?: boolean;
  moreStyling?: boolean;
  parseImgDimensions?: boolean;
  completeHTMLDocument?: boolean;
  jsx?: boolean;
};
type StringOpts = {
  ghMentionsLink?: string;
  classNmae?: string;
};
type NumOpts = {
  headerLevelStart?: number | string;
};
type ExtOpts = {
  extensions?: ExtType;
};
export type ConverterOptions = BoolOpts & StringOpts & NumOpts & ExtOpts;
const defBoolOpts: BoolOpts = {
  underscores: false,
  strikethrough: false,
  underline: false,
  metadata: false,
  omitCodeBlocks: false,
  backslashEscapesHTMLTags: false,
  relativePathBaseUrl: false,
  openLinksInNewWindow: false,
  ghMentions: false,
  encodeEmails: true,
  simplifiedAutoLink: true,
  simpleLineBreaks: false,
  smoothLivePreview: false,
  noHeaderId: false,
  requireSpaceBeforeHeadingText: false,
  customizedHeaderId: false,
  prefixHeaderId: false,
  rawPrefixHeaderId: false,
  ghCompatibleHeaderId: false,
  rawHeaderId: false,
  tables: true,
  tablesHeaderId: false,
  splitAdjacentBlockquotes: false,
  disableForced4SpacesIndentedSublists: false,
  tasklists: false,
  moreStyling: false,
  parseImgDimensions: false,
  completeHTMLDocument: false,
  jsx: false,
};

const defStrOpts: StringOpts = {
  ghMentionsLink: "https://github.com/{u}",
  classNmae: "bmark-markdown",
};

const defNumOpts: NumOpts = {
  headerLevelStart: 1,
};

const defExtOpts: ExtOpts = {
  extensions: [],
};

const defaultOptions: ConverterOptions = {
  ...defBoolOpts,
  ...defStrOpts,
  ...defNumOpts,
  ...defExtOpts,
};
export function getDefaultOptions(): ConverterOptions {
  return defaultOptions;
}

export function setDefaultOptions(options: ConverterOptions): ConverterOptions {
  const opts = getDefaultOptions();
  return (options = opts);
}

export function setAllOptionsOn(): ConverterOptions {
  let retOpts: BoolOpts = {};
  for (let opt in defBoolOpts) {
    if (defBoolOpts.hasOwnProperty(opt)) {
      retOpts[opt] = true;
    }
  }
  return { ...retOpts, ...defStrOpts, ...defNumOpts, ...defExtOpts };
}
