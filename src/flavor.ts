import {
  type ConverterOptions,
  getDefaultOptions,
  setAllOptionsOn,
} from "./options.js";
export type Flavor = "github" | "original" | "ghost" | "vanilla" | "allOn";

type FlavorType = {
  github: Partial<ConverterOptions>;
  original: Partial<ConverterOptions>;
  ghost: Partial<ConverterOptions>;
  vanilla: ConverterOptions;
  allOn: ConverterOptions;
};
export const flavor: FlavorType = {
  github: {
    omitExtraWLInCodeBlocks: true,
    simplifiedAutoLink: true,
    literalMidWordUnderscores: true,
    strikethrough: true,
    tables: true,
    tablesHeaderId: true,
    ghCodeBlocks: true,
    tasklists: true,
    disableForced4SpacesIndentedSublists: true,
    simpleLineBreaks: true,
    requireSpaceBeforeHeadingText: true,
    ghCompatibleHeaderId: true,
    ghMentions: true,
    backslashEscapesHTMLTags: true,
    emoji: true,
    splitAdjacentBlockquotes: true,
  },
  original: {
    noHeaderId: true,
    ghCodeBlocks: false,
  },
  ghost: {
    omitExtraWLInCodeBlocks: true,
    parseImgDimensions: true,
    simplifiedAutoLink: true,
    literalMidWordUnderscores: true,
    strikethrough: true,
    tables: true,
    tablesHeaderId: true,
    ghCodeBlocks: true,
    tasklists: true,
    smoothLivePreview: true,
    simpleLineBreaks: true,
    requireSpaceBeforeHeadingText: true,
    ghMentions: false,
    encodeEmails: true,
  },
  vanilla: getDefaultOptions(),
  allOn: setAllOptionsOn(),
};
