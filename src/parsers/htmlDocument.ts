import type { GlobalConverter } from "../globals.js";
import type { ConverterOptions } from "../options.js";

/**
 * Wraps the given text in an HTML document, adding a doctype, basic head and body tags, title, and meta tags.
 * @param text The text to be wrapped in an HTML document
 * @param options The converter options
 * @param globals The global converter object containing necessary configurations
 * @returns The text wrapped in an HTML document
 */
export function htmlDoucment(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	if (typeof options.htmlDocument === "undefined" || options.jsx) {
		return text;
	}
	text = globals.converter
		?._dispatch("htmlDocument.before", text, options, globals)
		.getText() as string;
	const html = `
      <!DOCTYPE html>
        <html lang=${options.htmlDocument.lang}>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            ${options.htmlDocument.metaTags?.map(
							(i) => `<meta name=${i.name} content=${i.content}>`,
						)}
            ${options.htmlDocument.cssLinks?.map(
							(i) => `<link rel="stylesheet" href=${i}>`,
						)}
            <link rel="shortcut icon" href=${options.htmlDocument.favicon} type="image/x-icon">
             ${options.htmlDocument.scriptTags?.head?.scriptNormalTags?.map(
								(i) => ` <script src=${i}></script>`,
							)}
             ${options.htmlDocument.scriptTags?.head?.scriptModuleTags?.map(
								(i) => `<script type="module" src=${i}></script>`,
							)}
            <title>${options.htmlDocument?.title}</title>
        </head>
        <body>
            ${text}
              ${options.htmlDocument.scriptTags?.body?.scriptNormalTags?.map(
								(i) => ` <script src=${i}></script>`,
							)}
             ${options.htmlDocument.scriptTags?.body?.scriptModuleTags?.map(
								(i) => `<script type="module" src=${i}></script>`,
							)}
        </body>
        </html>
    `;
	text = html;
	text = globals.converter
		?._dispatch("htmlDocument.after", text, options, globals)
		.getText() as string;
	return text;
}
