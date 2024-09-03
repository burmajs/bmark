import type { ShowdownExtension } from "../extensions.js";
import type { GlobalConverter } from "../globals.js";
import type { ConverterOptions } from "../options.js";

type ParserFunction = (
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
	ext?: ShowdownExtension,
) => string;
