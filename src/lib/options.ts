import { type BmarkExtension } from "../extension/type.js";
type Bext =
  | (() => BmarkExtension[] | BmarkExtension)
  | BmarkExtension[]
  | BmarkExtension
  | string;
export type ConverterExtensionsType = Array<Bext>;
type DFOpts = {
  defaultValue: boolean | number | string | [];
  describe: string;
  type: string;
};
type DefOpts = {
  [key: string]: DFOpts;
};
type HeaderID = 1 | 2 | 3 | 4 | 5 | 6;
export type OptionsValue =
  | string
  | number
  | undefined
  | HeaderID
  | boolean
  | ConverterExtensionsType;

export interface BmarkOptions {
  [key: string]: OptionsValue;
  omitExtraWLInCodeBlocks?: boolean;
  noHeaderId?: boolean;
  prefixHeaderId?: boolean;
  rawPrefixHeaderId?: boolean;
  ghCompatibleHeaderId?: boolean;
  rawHeaderId?: boolean;
  headerLevelStart?: HeaderID;
  parseImgDimensions?: boolean;
  simplifiedAutoLink?: boolean;
  literalMidWordUnderscores?: boolean;
  literalMidWordAsterisks?: boolean;
  strikethrough?: boolean;
  tables?: boolean;
  tablesHeaderId?: boolean;
  ghCodeBlocks?: boolean;
  tasklists?: boolean;
  smoothLivePreview?: boolean;
  smartIndentationFix?: boolean;
  disableForced4SpacesIndentedSublists?: boolean;
  simpleLineBreaks?: boolean;
  requireSpaceBeforeHeadingText?: boolean;
  ghMentions?: boolean;
  ghMentionsLink?: string;
  encodeEmails?: boolean;
  openLinksInNewWindow?: boolean;
  backslashEscapesHTMLTags?: boolean;
  emoji?: boolean;
  underline?: boolean;
  ellipsis?: boolean;
  completeHTMLDocument?: boolean;
  metadata?: boolean;
  splitAdjacentBlockquotes?: boolean;
  moreStyling?: boolean;
  relativePathBaseUrl?: boolean;
}
export interface ConverterOptions extends BmarkOptions {
  extensions?: ConverterExtensionsType;
}
/**
 * Options
 */
export interface BOptions {
  setOption: (key: string, value: OptionsValue) => BOptions;
  getOption: (key: string) => OptionsValue;
  getOptions: () => ConverterOptions;
  resetOptions: () => void;
  getDefaultOptions: (simple: boolean) => ConverterOptions | undefined;
}
export const _default_options: ConverterOptions = {
  omitExtraWLInCodeBlocks: false,
  noHeaderId: false,
  prefixHeaderId: false,
  rawPrefixHeaderId: false,
  ghCompatibleHeaderId: false,
  rawHeaderId: false,
  headerLevelStart: 1,
  parseImgDimensions: false,
  simplifiedAutoLink: false,
  literalMidWordUnderscores: false,
  literalMidWordAsterisks: false,
  strikethrough: false,
  tables: false,
  tablesHeaderId: false,
  ghCodeBlocks: true,
  tasklists: false,
  smoothLivePreview: false,
  smartIndentationFix: false,
  disableForced4SpacesIndentedSublists: false,
  simpleLineBreaks: false,
  requireSpaceBeforeHeadingText: false,
  ghMentions: false,
  ghMentionsLink: "https://github.com/{u}",
  encodeEmails: true,
  openLinksInNewWindow: false,
  backslashEscapesHTMLTags: false,
  emoji: false,
  underline: false,
  ellipsis: true,
  completeHTMLDocument: false,
  metadata: false,
  splitAdjacentBlockquotes: false,
  moreStyling: false,
  relativePathBaseUrl: false,
  extensions: [],
};

const convertDefOptsToConvertOptions = (defOpts: DefOpts): ConverterOptions => {
  let ret: BmarkOptions = {};
  for (let opt in defOpts) {
    if (defOpts.hasOwnProperty(opt)) {
      ret[opt] = defOpts[opt].defaultValue;
    }
  }
  return ret;
};

export const getDefaultOptions = (
  simple: boolean
): ConverterOptions | string => {
  "use strict";
  const defaultOptions: DefOpts = {
    omitExtraWLInCodeBlocks: {
      defaultValue: false,
      describe: "Omit the default extra whiteline added to code blocks",
      type: "boolean",
    },
    noHeaderId: {
      defaultValue: false,
      describe: "Turn on/off generated header id",
      type: "boolean",
    },
    prefixHeaderId: {
      defaultValue: false,
      describe:
        "Add a prefix to the generated header ids. Passing a string will prefix that string to the header id. Setting to true will add a generic 'section-' prefix",
      type: "string",
    },
    rawPrefixHeaderId: {
      defaultValue: false,
      describe:
        'Setting this option to true will prevent showdown from modifying the prefix. This might result in malformed IDs (if, for instance, the " char is used in the prefix)',
      type: "boolean",
    },
    ghCompatibleHeaderId: {
      defaultValue: false,
      describe:
        "Generate header ids compatible with github style (spaces are replaced with dashes, a bunch of non alphanumeric chars are removed)",
      type: "boolean",
    },
    rawHeaderId: {
      defaultValue: false,
      describe:
        "Remove only spaces, ' and \" from generated header ids (including prefixes), replacing them with dashes (-). WARNING: This might result in malformed ids",
      type: "boolean",
    },
    headerLevelStart: {
      defaultValue: 1,
      describe: "The header blocks level start",
      type: "integer",
    },
    parseImgDimensions: {
      defaultValue: false,
      describe: "Turn on/off image dimension parsing",
      type: "boolean",
    },
    simplifiedAutoLink: {
      defaultValue: false,
      describe: "Turn on/off GFM autolink style",
      type: "boolean",
    },
    literalMidWordUnderscores: {
      defaultValue: false,
      describe: "Parse midword underscores as literal underscores",
      type: "boolean",
    },
    literalMidWordAsterisks: {
      defaultValue: false,
      describe: "Parse midword asterisks as literal asterisks",
      type: "boolean",
    },
    strikethrough: {
      defaultValue: false,
      describe: "Turn on/off strikethrough support",
      type: "boolean",
    },
    tables: {
      defaultValue: false,
      describe: "Turn on/off tables support",
      type: "boolean",
    },
    tablesHeaderId: {
      defaultValue: false,
      describe: "Add an id to table headers",
      type: "boolean",
    },
    ghCodeBlocks: {
      defaultValue: true,
      describe: "Turn on/off GFM fenced code blocks support",
      type: "boolean",
    },
    tasklists: {
      defaultValue: false,
      describe: "Turn on/off GFM tasklist support",
      type: "boolean",
    },
    smoothLivePreview: {
      defaultValue: false,
      describe:
        "Prevents weird effects in live previews due to incomplete input",
      type: "boolean",
    },
    smartIndentationFix: {
      defaultValue: false,
      describe: "Tries to smartly fix indentation in es6 strings",
      type: "boolean",
    },
    disableForced4SpacesIndentedSublists: {
      defaultValue: false,
      describe:
        "Disables the requirement of indenting nested sublists by 4 spaces",
      type: "boolean",
    },
    simpleLineBreaks: {
      defaultValue: false,
      describe: "Parses simple line breaks as <br> (GFM Style)",
      type: "boolean",
    },
    requireSpaceBeforeHeadingText: {
      defaultValue: false,
      describe:
        "Makes adding a space between `#` and the header text mandatory (GFM Style)",
      type: "boolean",
    },
    ghMentions: {
      defaultValue: false,
      describe: "Enables github @mentions",
      type: "boolean",
    },
    ghMentionsLink: {
      defaultValue: "https://github.com/{u}",
      describe:
        "Changes the link generated by @mentions. Only applies if ghMentions option is enabled.",
      type: "string",
    },
    encodeEmails: {
      defaultValue: true,
      describe:
        "Encode e-mail addresses through the use of Character Entities, transforming ASCII e-mail addresses into its equivalent decimal entities",
      type: "boolean",
    },
    openLinksInNewWindow: {
      defaultValue: false,
      describe: "Open all links in new windows",
      type: "boolean",
    },
    backslashEscapesHTMLTags: {
      defaultValue: false,
      describe: "Support for HTML Tag escaping. ex: <div>foo</div>",
      type: "boolean",
    },
    emoji: {
      defaultValue: false,
      describe: "Enable emoji support. Ex: `this is a :smile: emoji`",
      type: "boolean",
    },
    underline: {
      defaultValue: false,
      describe:
        "Enable support for underline. Syntax is double or triple underscores: `__underline word__`. With this option enabled, underscores no longer parses into `<em>` and `<strong>`",
      type: "boolean",
    },
    ellipsis: {
      defaultValue: true,
      describe: "Replaces three dots with the ellipsis unicode character",
      type: "boolean",
    },
    completeHTMLDocument: {
      defaultValue: false,
      describe:
        "Outputs a complete html document, including `<html>`, `<head>` and `<body>` tags",
      type: "boolean",
    },
    metadata: {
      defaultValue: false,
      describe:
        "Enable support for document metadata (defined at the top of the document between `«««` and `»»»` or between `---` and `---`).",
      type: "boolean",
    },
    splitAdjacentBlockquotes: {
      defaultValue: false,
      describe: "Split adjacent blockquote blocks",
      type: "boolean",
    },
    moreStyling: {
      defaultValue: false,
      describe: "Adds some useful styling css classes in the generated html",
      type: "boolean",
    },
    relativePathBaseUrl: {
      defaultValue: false,
      describe: "Prepends a base URL to relative paths",
      type: "string",
    },
    extensions: {
      defaultValue: [],
      describe: "Array of Extension",
      type: "ConverterExtensionsType",
    },
  };

  if (simple === false) {
    return JSON.stringify(defaultOptions);
  }
  return convertDefOptsToConvertOptions(defaultOptions);
};

export const setAllOptionsTrue = (): BmarkOptions => {
  "use strict";
  const options = getDefaultOptions(true) as BmarkOptions;
  let ret: BmarkOptions = {};
  for (var opt in options) {
    if (options.hasOwnProperty(opt)) {
      ret[opt] = true;
    }
  }
  return ret;
};
