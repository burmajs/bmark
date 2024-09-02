import { type ConverterOptions } from "./options.js";
import { type GlobalConverter } from "./globals.js";
import { emojis } from "./emoji.js";
import { helpers } from "./helpers.js";
import { type EventResult } from "./event.js";
import { type ShowdownExtension } from "./extensions.js";
import { Converter } from "./converter.js";
//
function hashElement(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): (wholeMatch: string, m1: string) => string {
  return function (wholeMatch: string, m1: string){
    var blockText = m1;

    // Undo double lines
    blockText = blockText.replace(/\n\n/g, "\n");
    blockText = blockText.replace(/^\n/, "");

    // strip trailing blank lines
    blockText = blockText.replace(/\n+$/g, "");

    // Replace the element text with a marker ("¨KxK" where x is its key)
    blockText = "\n\n¨K" + (globals.gHtmlBlocks.push(blockText) - 1) + "K\n\n";

    return blockText;
  };
}
//1
function detab(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  let tx = text;
  tx = globals.converter
    ?._dispatch("detab.before", tx, options, globals)
    .getText() as string;

  // expand first n-1 tabs
  tx = tx.replace(/\t(?=\t)/g, "    "); // g_tab_width

  // replace the nth with two sentinels
  tx = tx.replace(/\t/g, "¨A¨B");

  // use the sentinel to anchor our regex so it doesn't explode
  tx = tx.replace(/¨B(.+?)¨A/g, function (wholeMatch, m1) {
    let leadingText = m1;
    const numSpaces = 4 - (leadingText.length % 4); // g_tab_width

    // there *must* be a better way to do this:
    for (var i = 0; i < numSpaces; i++) {
      leadingText += " ";
    }

    return leadingText;
  });

  // clean up sentinels
  tx = tx.replace(/¨A/g, "    "); // g_tab_width
  text = tx.replace(/¨B/g, "");

  tx = globals.converter
    ?._dispatch("detab.after", tx, options, globals)
    .getText() as string;
  return tx;
}
//2
function ellipsis(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  text = globals.converter
    ?._dispatch("ellipsis.before", text, options, globals)
    .getText() as string;

  text = text.replace(/\.\.\./g, "…");

  text = globals.converter
    ?._dispatch("ellipsis.after", text, options, globals)
    .getText() as string;

  return text;
}
//3
function emoji(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  text = globals.converter
    ?._dispatch("emoji.before", text, options, globals)
    .getText() as string;

  var emojiRgx = /:([\S]+?):/g;

  text = text.replace(emojiRgx, function (wm, emojiCode) {
    if (emojis.hasOwnProperty(emojiCode)) {
      return emojis[emojiCode];
    }
    return wm;
  });

  text = globals.converter
    ?._dispatch("emoji.after", text, options, globals)
    .getText() as string;

  return text;
}
//4
function encodeCode(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  text = globals.converter
    ?._dispatch("encodeCode.before", text, options, globals)
    .getText() as string;

  // Encode all ampersands; HTML entities are not
  // entities within a Markdown code span.
  text = text
    .replace(/&/g, "&amp;")
    // Do the angle bracket song and dance:
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Now, escape characters that are magic in Markdown:
    .replace(/([*_{}\[\]\\=~-])/g, helpers.escapeCharactersCallback);
  text = globals.converter
    ?._dispatch("encodeCode.after", text, options, globals)
    .getText() as string;

  return text;
}
//5
function encodeAmpsAndAngles(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  text = globals.converter
    ?._dispatch("encodeAmpsAndAngles.before", text, options, globals)
    .getText() as string;

  // Ampersand-encoding based entirely on Nat Irons's Amputator MT plugin:
  // http://bumppo.net/projects/amputator/
  text = text.replace(/&(?!#?[xX]?(?:[0-9a-fA-F]+|\w+);)/g, "&amp;");

  // Encode naked <'s
  text = text.replace(/<(?![a-z\/?$!])/gi, "&lt;");

  // Encode <
  text = text.replace(/</g, "&lt;");

  // Encode >
  text = text.replace(/>/g, "&gt;");

  text = globals.converter
    ?._dispatch("encodeAmpsAndAngles.after", text, options, globals)
    .getText() as string;
  return text;
}
//6
function encodeBackslashEscapes(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  text = globals.converter
    ?._dispatch("encodeBackslashEscapes.before", text, options, globals)
    .getText() as string;

  text = text.replace(/\\(\\)/g, helpers.escapeCharactersCallback);
  text = text.replace(
    /\\([`*_{}\[\]()>#+.!~=|:-])/g,
    helpers.escapeCharactersCallback
  );

  text = globals.converter
    ?._dispatch("encodeBackslashEscapes.after", text, options, globals)
    .getText() as string;
  return text;
}
//7
function escapeSpecialCharsWithinTagAttributes(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  text = globals.converter
    ?._dispatch(
      "escapeSpecialCharsWithinTagAttributes.before",
      text,
      options,
      globals
    )
    .getText() as string;

  // Build a regex to find HTML tags.
  var tags = /<\/?[a-z\d_:-]+(?:[\s]+[\s\S]+?)?>/gi,
    comments = /<!(--(?:(?:[^>-]|-[^>])(?:[^-]|-[^-])*)--)>/gi;

  text = text.replace(tags, function (wholeMatch) {
    return wholeMatch
      .replace(/(.)<\/?code>(?=.)/g, "$1`")
      .replace(/([\\`*_~=|])/g, helpers.escapeCharactersCallback);
  });

  text = text.replace(comments, function (wholeMatch) {
    return wholeMatch.replace(
      /([\\`*_~=|])/g,
      helpers.escapeCharactersCallback
    );
  });

  text = globals.converter
    ?._dispatch(
      "escapeSpecialCharsWithinTagAttributes.after",
      text,
      options,
      globals
    )
    .getText() as string;
  return text;
}
//8

export function hashBlock(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  text = globals.converter
    ?._dispatch("hashBlock.before", text, options, globals)
    .getText() as string;
  text = text.replace(/(^\n+|\n+$)/g, "");
  text = "\n\n¨K" + (globals.gHtmlBlocks.push(text) - 1) + "K\n\n";
  text = globals.converter
    ?._dispatch("hashBlock.after", text, options, globals)
    .getText() as string;
  return text;
}
//9
export function italicsAndBold(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  text = globals.converter
    ?._dispatch("italicsAndBold.before", text, options, globals)
    .getText() as string;
  function parseInside(txt: any, left: string, right: string) {
    return left + txt + right;
  }

  // Parse underscores
  if (options.underscores) {
    text = text.replace(/\b___(\S[\s\S]*?)___\b/g, function (wm, txt) {
      return parseInside(txt, "<strong><em>", "</em></strong>");
    });
    text = text.replace(/\b__(\S[\s\S]*?)__\b/g, function (wm, txt) {
      return parseInside(txt, "<strong>", "</strong>");
    });
    text = text.replace(/\b_(\S[\s\S]*?)_\b/g, function (wm, txt) {
      return parseInside(txt, "<em>", "</em>");
    });
  } else {
    text = text.replace(/___(\S[\s\S]*?)___/g, function (wm, m) {
      return /\S$/.test(m)
        ? parseInside(m, "<strong><em>", "</em></strong>")
        : wm;
    });
    text = text.replace(/__(\S[\s\S]*?)__/g, function (wm, m) {
      return /\S$/.test(m) ? parseInside(m, "<strong>", "</strong>") : wm;
    });
    text = text.replace(/_([^\s_][\s\S]*?)_/g, function (wm, m) {
      // !/^_[^_]/.test(m) - test if it doesn't start with __ (since it seems redundant, we removed it)
      return /\S$/.test(m) ? parseInside(m, "<em>", "</em>") : wm;
    });
  }
  text = text.replace(/\*\*\*(\S[\s\S]*?)\*\*\*/g, function (wm, m) {
    return /\S$/.test(m)
      ? parseInside(m, "<strong><em>", "</em></strong>")
      : wm;
  });
  text = text.replace(/\*\*(\S[\s\S]*?)\*\*/g, function (wm, m) {
    return /\S$/.test(m) ? parseInside(m, "<strong>", "</strong>") : wm;
  });
  text = text.replace(/\*([^\s*][\s\S]*?)\*/g, function (wm, m) {
    // !/^\*[^*]/.test(m) - test if it doesn't start with ** (since it seems redundant, we removed it)
    return /\S$/.test(m) ? parseInside(m, "<em>", "</em>") : wm;
  });
  //}

  text = globals.converter
    ?._dispatch("italicsAndBold.after", text, options, globals)
    .getText() as string;
  return text;
}
//10
function metadata(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  if (!options.metadata) {
    return text;
  }

  text = globals.converter
    ?._dispatch("metadata.before", text, options, globals)
    .getText() as string;

  function parseMetadataContents(content: string) {
    // raw is raw so it's not changed in any way
    //   if(globals.metadata === undefined){
    //     globals.metadata?.raw = content;
    //   }
    globals.metadata.raw = content;
    // escape chars forbidden in html attributes
    // double quotes
    content = content
      // ampersand first
      .replace(/&/g, "&amp;")
      // double quotes
      .replace(/"/g, "&quot;");

    // Restore dollar signs and tremas
    content = content.replace(/¨D/g, "$$").replace(/¨T/g, "¨");

    content = content.replace(/\n {4}/g, " ");
    content.replace(
      /^([\S ]+): +([\s\S]+?)$/gm,
      function (wm: any, key: string | number, value: string) {
        globals.metadata.parsed[key] = value;
        return "";
      }
    );
  }

  text = text.replace(
    /^\s*«««+\s*(\S*?)\n([\s\S]+?)\n»»»+\s*\n/,
    function (wholematch, format, content) {
      parseMetadataContents(content);
      return "¨M";
    }
  );

  text = text.replace(
    /^\s*---+\s*(\S*?)\n([\s\S]+?)\n---+\s*\n/,
    function (wholematch, format, content) {
      if (format) {
        globals.metadata.format = format;
      }
      parseMetadataContents(content);
      return "¨M";
    }
  );

  text = text.replace(/¨M/g, "");

  text = globals.converter
    ?._dispatch("metadata.after", text, options, globals)
    .getText() as string;
  return text;
}
//11

export function outdent(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  text = globals.converter
    ?._dispatch("outdent.before", text, options, globals)
    .getText() as string;

  // attacklab: hack around Konqueror 3.5.4 bug:
  // "----------bug".replace(/^-/g,"") == "bug"
  text = text.replace(/^(\t|[ ]{1,4})/gm, "¨0"); // attacklab: g_tab_width

  // attacklab: clean up hack
  text = text.replace(/¨0/g, "");

  text = globals.converter
    ?._dispatch("outdent.after", text, options, globals)
    .getText() as string;
  return text;
}
//12
export function strikethrough(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  if (options.strikethrough) {
    text = globals.converter
      ?._dispatch("strikethrough.before", text, options, globals)
      .getText() as string;
    text = text.replace(/(?:~){2}([\s\S]+?)(?:~){2}/g, function (wm, txt) {
      return "<del>" + txt + "</del>";
    });
    text = globals.converter
      ?._dispatch("strikethrough.after", text, options, globals)
      .getText() as string;
  }

  return text;
}
//13
export function underline(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  if (!options.underline) {
    return text;
  }

  text = globals.converter
    ?._dispatch("underline.before", text, options, globals)
    .getText() as string;

  if (options.underscores) {
    text = text.replace(/\b___(\S[\s\S]*?)___\b/g, function (wm, txt) {
      return "<u>" + txt + "</u>";
    });
    text = text.replace(/\b__(\S[\s\S]*?)__\b/g, function (wm, txt) {
      return "<u>" + txt + "</u>";
    });
  } else {
    text = text.replace(/___(\S[\s\S]*?)___/g, function (wm, m) {
      return /\S$/.test(m) ? "<u>" + m + "</u>" : wm;
    });
    text = text.replace(/__(\S[\s\S]*?)__/g, function (wm, m) {
      return /\S$/.test(m) ? "<u>" + m + "</u>" : wm;
    });
  }

  // escape remaining underscores to prevent them being parsed by italic and bold
  text = text.replace(/(_)/g, helpers.escapeCharactersCallback);

  text = globals.converter
    ?._dispatch("underline.after", text, options, globals)
    .getText() as string;

  return text;
}
//14

function unescapeSpecialChars(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  text = globals.converter
    ?._dispatch("unescapeSpecialChars.before", text, options, globals)
    .getText() as string;

  text = text.replace(/¨E(\d+)E/g, function (wholeMatch, m1) {
    var charCodeToReplace = parseInt(m1);
    return String.fromCharCode(charCodeToReplace);
  });

  text = globals.converter
    ?._dispatch("unescapeSpecialChars.after", text, options, globals)
    .getText() as string;
  return text;
}
//15
export function hashHTMLSpans(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  text = globals.converter
    ?._dispatch("hashHTMLSpans.before", text, options, globals)
    .getText() as string;

  // Hash Self Closing tags
  text = text.replace(/<[^>]+?\/>/gi, function (wm) {
    return helpers._hashHTMLSpan(wm, globals);
  });

  // Hash tags without properties
  text = text.replace(/<([^>]+?)>[\s\S]*?<\/\1>/g, function (wm) {
    return helpers._hashHTMLSpan(wm, globals);
  });

  // Hash tags with properties
  text = text.replace(/<([^>]+?)\s[^>]+?>[\s\S]*?<\/\1>/g, function (wm) {
    return helpers._hashHTMLSpan(wm, globals);
  });

  // Hash self closing tags without />
  text = text.replace(/<[^>]+?>/gi, function (wm) {
    return helpers._hashHTMLSpan(wm, globals);
  });

  text = globals.converter
    ?._dispatch("hashHTMLSpans.after", text, options, globals)
    .getText() as string;
  return text;
}
//16
function unhashHTMLSpans(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  text = globals.converter
    ?._dispatch("unhashHTMLSpans.before", text, options, globals)
    .getText() as string;

  for (var i = 0; i < globals.gHtmlSpans.length; ++i) {
    var repText = globals.gHtmlSpans[i],
      // limiter to prevent infinite loop (assume 10 as limit for recurse)
      limit = 0;

    while (/¨C(\d+)C/.test(repText)) {
      const num = +RegExp.$1;
      repText = repText.replace("¨C" + num + "C", globals.gHtmlSpans[num]);
      if (limit === 10) {
        console.error("maximum nesting of 10 spans reached!!!");
        break;
      }
      ++limit;
    }
    text = text.replace("¨C" + i + "C", repText);
  }

  text = globals.converter
    ?._dispatch("unhashHTMLSpans.after", text, options, globals)
    .getText() as string;
  return text;
}
//##### Dependent
//17
export function codeBlocks(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  text = globals.converter
    ?._dispatch("codeBlocks.before", text, options, globals)
    .getText() as string;

  // sentinel workarounds for lack of \A and \Z, safari\khtml bug
  text += "¨0";
  const pattern =
    /(?:\n\n|^)((?:(?:[ ]{4}|\t).*\n+)+)(\n*[ ]{0,3}[^ \t\n]|(?=¨0))/g;
  text = text.replace(pattern, (wholeMatch, m1, m2) => {
    let codeblock = m1;
    const nextChar = m2;
    let end = "\n";
    codeblock = outdent(codeblock, options, globals);
    codeblock = encodeCode(codeblock, options, globals);
    codeblock = detab(codeblock, options, globals);
    codeblock = codeblock.replace(/^\n+/g, ""); // trim leading newlines
    codeblock = codeblock.replace(/\n+$/g, ""); // trim trailing newlines
    if (options.omitCodeBlocks) {
      end = "";
    }
    codeblock = "<pre><code>" + codeblock + end + "</code></pre>";
    return `${hashBlock(codeblock, options, globals)}${nextChar}`;
  });
  // strip sentinel
  text = text.replace(/¨0/, "");

  text = globals.converter
    ?._dispatch("codeBlocks.after", text, options, globals)
    .getText() as string;
  return text;
}
//18
export function codeSpans(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  text = globals.converter
    ?._dispatch("codeSpans.before", text, options, globals)
    .getText() as string;

  if (typeof text === "undefined") {
    text = "";
  }
  text = text.replace(
    /(^|[^\\])(`+)([^\r]*?[^`])\2(?!`)/gm,
    (wholeMatch, m1, m2, m3) => {
      let c = m3;
      c = c.replace(/^([ \t]*)/g, ""); // leading whitespace
      c = c.replace(/[ \t]*$/g, ""); // trailing whitespace
      c = encodeCode(c, options, globals);
      c = `${m1}<code>${c}</code>`;
      c = hashHTMLSpans(c, options, globals);
      return c;
    }
  );

  text = globals.converter
    ?._dispatch("codeSpans.after", text, options, globals)
    .getText() as string;
  return text;
}
//19
function hashPreCodeTags(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  text = globals.converter
    ?._dispatch("hashPreCodeTags.before", text, options, globals)
    .getText() as string;

  const repFunc = (
    wholeMatch: any,
    match: string,
    left: string | number,
    right: any
  ) => {
    // encode html entities
    const codeblock = `${left}${encodeCode(match, options, globals)}${right}`;
    return (
      "\n\n¨G" +
      (globals.ghCodeBlocks.push({ text: wholeMatch, codeblock: codeblock }) -
        1) +
      "G\n\n"
    );
  };
  // Hash <pre><code>
  text = helpers.replaceRecursiveRegExp(
    text,
    repFunc,
    "^ {0,3}<pre\\b[^>]*>\\s*<code\\b[^>]*>",
    "^ {0,3}</code>\\s*</pre>",
    "gim"
  );

  text = globals.converter
    ?._dispatch("hashPreCodeTags.after", text, options, globals)
    .getText() as string;
  return text;
}
//20
function hashCodeTags(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  text = globals.converter
    ?._dispatch("hashCodeTags.before", text, options, globals)
    .getText() as string;

  const repFunc = (
    wholeMatch: any,
    match: string,
    left: string | number,
    right: any
  ) => {
    // encode html entities
    const codeblock = `${left}${encodeCode(match, options, globals)}${right}`;
    return "¨C" + (globals.gHtmlSpans.push(codeblock) - 1) + "C";
  };
  // Hash <pre><code>
  text = helpers.replaceRecursiveRegExp(
    text,
    repFunc,
    "<code\\b[^>]*>",
    "</code>",
    "gim"
  );

  text = globals.converter
    ?._dispatch("hashCodeTags.after", text, options, globals)
    .getText() as string;
  return text;
}
//21
function githubCodeBlocks(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  text = globals.converter
    ?._dispatch("githubCodeBlocks.before", text, options, globals)
    .getText() as string;

  text += "¨0";
  const pattern =
    /(?:^|\n) {0,3}(```+|~~~+) *([^\n\t`~]*)\n([\s\S]*?)\n {0,3}\1/g;
  text = text.replace(pattern, (wholeMatch, delim, language, codeblock) => {
    const end = options.omitCodeBlocks ? "" : "\n";
    language = language.trim().split(" ")[0];
    codeblock = encodeCode(codeblock, options, globals);
    codeblock = detab(codeblock, options, globals);
    codeblock = codeblock.replace(/^\n+/g, "").replace(/\n+$/g, ""); // trim leading newlines and trailing whitespace

    const langClass = options.jsx
      ? `className="${language} language-${language}"`
      : `class="${language} language-${language}"`;
    codeblock = `<pre><code ${langClass}>${codeblock}${end}</code></pre>`;
    codeblock = hashBlock(codeblock, options, globals);

    return `\n\n¨G${globals.ghCodeBlocks.push({
      text: wholeMatch,
      codeblock,
    })}G\n\n`;
  });
  text = text.replace(/¨0/, "");

  return globals.converter
    ?._dispatch("githubCodeBlocks.after", text, options, globals)
    .getText() as string;
}
//22
const blockTags = [
  "pre",
  "div",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "table",
  "dl",
  "ol",
  "ul",
  "script",
  "noscript",
  "form",
  "fieldset",
  "iframe",
  "math",
  "style",
  "section",
  "header",
  "footer",
  "nav",
  "article",
  "aside",
  "address",
  "audio",
  "canvas",
  "figure",
  "hgroup",
  "output",
  "video",
  "details",
  "p",
];
function hashHTMLBlocks(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  text = globals.converter
    ?._dispatch("hashHTMLBlocks.before", text, options, globals)
    .getText() as string;
  const repFunc = (
    wholeMatch: string,
    match: string,
    left: string,
    right: string
  ) => {
    let txt = wholeMatch;
    // check if this html element is marked as markdown
    // if so, it's contents should be parsed as markdown
    if (left.search(/\bmarkdown\b/) !== -1) {
      txt = left + globals.converter?.toHtml(match) + right;
    }
    return `\n\n¨K${globals.gHtmlBlocks.push(txt) - 1}K\n\n`;
  };
  if (options.backslashEscapesHTMLTags) {
    // encode backslash escaped HTML tags
    text = text.replace(/\\<(\/?[^>]+?)>/g, (wm, inside) => {
      return `&lt;${inside}"&gt;`;
    });
  }
  for (let i = 0; i < blockTags.length; ++i) {
    let opTagPos: any,
      rgx1 = new RegExp("^ {0,3}(<" + blockTags[i] + "\\b[^>]*>)", "im"),
      patLeft = "<" + blockTags[i] + "\\b[^>]*>",
      patRight = "</" + blockTags[i] + ">";
    // 1. Look for the first position of the first opening HTML tag in the text
    while ((opTagPos = helpers.regexIndexOf(text, rgx1)) !== -1) {
      // if the HTML tag is \ escaped, we need to escape it and break

      //2. Split the text in that position
      let subTexts = helpers.splitAtIndex(text, opTagPos),
        //3. Match recursively
        newSubText1 = helpers.replaceRecursiveRegExp(
          subTexts[1],
          repFunc,
          patLeft,
          patRight,
          "im"
        );

      // prevent an infinite loop
      if (newSubText1 === subTexts[1]) {
        break;
      }
      text = subTexts[0].concat(newSubText1);
    }
  }
  text = text.replace(
    /(\n {0,3}(<(hr)\b([^<>])*?\/?>)[ \t]*(?=\n{2,}))/g,
    hashElement(text, options, globals)
  );
  text = helpers.replaceRecursiveRegExp(
    text,
    (txt: any) => {
      return `\n\n¨K ${globals.gHtmlBlocks.push(txt) - 1}K\n\n`;
    },
    "^ {0,3}<!--",
    "-->",
    "gm"
  );
  text = text.replace(
    /\n\n( {0,3}<([?%])[^\r]*?\2>[ \t]*(?=\n{2,}))/g,
    hashElement(text, options, globals)
  );
  text = globals.converter
    ?._dispatch("hashHTMLBlocks.after", text, options, globals)
    .getText() as string;
  return text;
}
//23
export function horizontalRule(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  text = globals.converter
    ?._dispatch("horizontalRule.before", text, options, globals)
    .getText() as string;
  text = text.replace(
    /^ {0,2}( ?-){3,}[ \t]*$/gm,
    hashBlock("<hr />", options, globals)
  );
  text = text.replace(
    /^ {0,2}( ?\*){3,}[ \t]*$/gm,
    hashBlock("<hr />", options, globals)
  );
  text = text.replace(
    /^ {0,2}( ?_){3,}[ \t]*$/gm,
    hashBlock("<hr />", options, globals)
  );
  text = globals.converter
    ?._dispatch("horizontalRule.after", text, options, globals)
    .getText() as string;
  return text;
}
//24 - LINKS Group ===========================================================================================================================================

// Helper functions
type ReplaceAnchorTag = {
  rgx: RegExp;
  evtRootName: string;
  options: ConverterOptions;
  globals: GlobalConverter;
  emptyCase?: boolean;
};
function createEvent(
  rgx: RegExp,
  evtName: string,
  wholeMatch: string,
  text: string,
  id: null,
  url: string,
  title: null,
  options: ConverterOptions,
  globals: GlobalConverter
): EventResult {
  return globals.converter?._dispatch(evtName, wholeMatch, options, globals, {
    regexp: rgx ?? "",
    matches: {
      wholeMatch: wholeMatch ?? "",
      text: text ?? "",
      id: id ?? null,
      url: url ?? "",
      title: title ?? "",
    },
  }) as EventResult;
}
type WriteAnchorTag = {
  evt: EventResult;
  options: ConverterOptions;
  globals: GlobalConverter;
  emptyCase?: boolean;
};
function writeAnchorTag({
  evt,
  options,
  globals,
  emptyCase,
}: WriteAnchorTag): string {
  let target: string = "";
  let { wholeMatch, text, id, url, title } = evt.getMatches();
  if (!text) text = "";
  if (!title) title = "";
  id = id ? id.toLowerCase() : "";
  if (emptyCase) {
    url = "";
  } else if (!url) {
    if (!id) {
      id = text.toLowerCase().replace(/ ?\n/g, " ");
    }
    url = "#" + id;

    if (globals.gUrls[id] !== undefined) {
      url = globals.gUrls[id];
      if (globals.gTitles[id] !== undefined) {
        title = globals.gTitles[id];
      }
    } else {
      return wholeMatch;
    }
  }
  url = url.replace(
    helpers.regexes.asteriskDashTildeAndColon,
    helpers.escapeCharactersCallback
  );

  if (title !== "" && title !== null) {
    title = title.replace(/"/g, "&quot");
    title = title.replace(
      helpers.regexes.asteriskDashTildeAndColon,
      helpers.escapeCharactersCallback
    );
    title = ` title="${title}"`;
  }

  if (options.openLinksInNewWindow && !/^#/.test(url)) {
    target = ' rel="noopener noreferrer" target="_blank"';
  }
  text = codeSpans(text, options, globals);
  text = emoji(text, options, globals);
  text = underline(text, options, globals);
  text = italicsAndBold(text, options, globals);
  text = strikethrough(text, options, globals);
  text = ellipsis(text, options, globals);
  text = hashHTMLSpans(text, options, globals);
  const result = `<a href="${url}"${title}${target}>${text}</a>`;
  return hashHTMLSpans(result, options, globals);
}
//
function replaceAnchorTagReference({
  rgx,
  evtRootName,
  options,
  globals,
  emptyCase,
}: ReplaceAnchorTag) {
  emptyCase = !!emptyCase;
  function local(
    wholeMatch: string,
    text: string,
    id: any,
    url: string,
    title: any,
    m5?: any,
    m6?: any
  ) {
    if (/\n\n/.test(wholeMatch)) {
      return wholeMatch;
    }
    const evt = createEvent(
      rgx,
      evtRootName + ".captureStart",
      wholeMatch,
      text,
      id,
      url,
      title,
      options,
      globals
    );
    return writeAnchorTag({ evt, options, globals, emptyCase });
  }
  return local;
}
function replaceAnchorTagBaseUrl({
  rgx,
  evtRootName,
  options,
  globals,
  emptyCase,
}: ReplaceAnchorTag) {
  const local = (
    wholeMatch: string,
    text: string,
    id: any,
    url: string,
    title: any,
    m5?: any,
    m6?: any
  ) => {
    url = helpers.applyBaseUrl(options.relativePathBaseUrl, url);

    var evt = createEvent(
      rgx,
      evtRootName + ".captureStart",
      wholeMatch,
      text,
      id,
      url,
      title,
      options,
      globals
    );
    return writeAnchorTag({ evt, options, globals, emptyCase });
  };
  return local;
}
// Links sub-parsers

function linksAngleBrackets(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  const evtRootName: string = "links.angleBrackets";
  text = globals.converter
    ?._dispatch(`${evtRootName}.start`, text, options, globals)
    .getText() as string;
  // Process URLs
  const urlRgx = /<(((?:https?|ftp):\/\/|www\.)[^'">\s]+)>/gi;
  text = text.replace(
    urlRgx,
    (wholeMatch: string, url: string, urlStart: string) => {
      const text = url;
      url = urlStart === "www." ? `http://${url}` : url;
      const evt = createEvent(
        urlRgx,
        evtRootName + ".captureStart",
        wholeMatch,
        text,
        null,
        url,
        null,
        options,
        globals
      );
      return writeAnchorTag({ evt: evt, options: options, globals: globals });
    }
  );

  // Process email addresses
  const mailRegx =
    /<(?:mailto:)?([-.\w]+@[-a-z0-9]+(\.[-a-z0-9]+)*\.[a-z]+)>/gi;
  text = text.replace(mailRegx, (wholeMatch: string, mail: string) => {
    let url = "mailto:";
    mail = unescapeSpecialChars(mail, options, globals);
    if (options.encodeEmails) {
      url = helpers.encodeEmailAddress(url + mail);
      mail = helpers.encodeEmailAddress(mail);
    } else {
      url = url + mail;
    }
    const evt = createEvent(
      mailRegx,
      evtRootName + ".captureStart",
      wholeMatch,
      mail,
      null,
      url,
      null,
      options,
      globals
    );
    return writeAnchorTag({ evt: evt, options: options, globals: globals });
  });
  text = globals.converter
    ?._dispatch(`${evtRootName}.end`, text, options, globals)
    .getText() as string;
  return text;
}
//
function linksInline(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  const evtRootName: string = "links.inline";
  text = globals.converter
    ?._dispatch(`${evtRootName}.start`, text, options, globals)
    .getText() as string;
  // 1. Look for empty cases: []() and [empty]() and []("title")
  const rgxEmpty = /\[(.*?)]()()()()\(<? ?>? ?(?:["'](.*)["'])?\)/g;
  text = text.replace(
    rgxEmpty,
    replaceAnchorTagBaseUrl({
      rgx: rgxEmpty,
      evtRootName: evtRootName,
      options: options,
      globals: globals,
    })
  );
  // 2. Look for cases with crazy urls like ./image/cat1).png
  const rgxCrazy =
    /\[((?:\[[^\]]*]|[^\[\]])*)]()\s?\([ \t]?<([^>]*)>(?:[ \t]*((["'])([^"]*?)\5))?[ \t]?\)/g;
  text = text.replace(
    rgxCrazy,
    replaceAnchorTagBaseUrl({
      rgx: rgxCrazy,
      evtRootName: evtRootName,
      options: options,
      globals: globals,
    })
  );
  // 3. inline links with no title or titles wrapped in ' or ":
  // [text](url.com) || [text](<url.com>) || [text](url.com "title") || [text](<url.com> "title")
  //var rgx2 = /\[[ ]*[\s]?[ ]*([^\n\[\]]*?)[ ]*[\s]?[ ]*] ?()\(<?[ ]*[\s]?[ ]*([^\s'"]*)>?(?:[ ]*[\n]?[ ]*()(['"])(.*?)\5)?[ ]*[\s]?[ ]*\)/; // this regex is too slow!!!
  const rgx2 =
    /\[([\S ]*?)]\s?()\( *<?([^\s'"]*?(?:\([\S]*?\)[\S]*?)?)>?\s*(?:()(['"])(.*?)\5)? *\)/g;
  text = text.replace(
    rgx2,
    replaceAnchorTagBaseUrl({
      rgx: rgx2,
      evtRootName: evtRootName,
      options: options,
      globals: globals,
    })
  );

  // 4. inline links with titles wrapped in (): [foo](bar.com (title))
  var rgx3 =
    /\[([\S ]*?)]\s?()\( *<?([^\s'"]*?(?:\([\S]*?\)[\S]*?)?)>?\s+()()\((.*?)\) *\)/g;
  text = text.replace(
    rgx3,
    replaceAnchorTagBaseUrl({
      rgx: rgx3,
      evtRootName: evtRootName,
      options: options,
      globals: globals,
    })
  );
  text = globals.converter
    ?._dispatch(`${evtRootName}.end`, text, options, globals)
    .getText() as string;

  return text;
}
//
function linksReference(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  const evtRootName: string = "links.reference";
  text = globals.converter
    ?._dispatch(`${evtRootName}.start`, text, options, globals)
    .getText() as string;
  const rgx = /\[((?:\[[^\]]*]|[^\[\]])*)] ?(?:\n *)?\[(.*?)]()()()()/g;

  text = text.replace(
    rgx,
    replaceAnchorTagReference({
      rgx: rgx,
      evtRootName: evtRootName,
      options: options,
      globals: globals,
    })
  );
  text = globals.converter
    ?._dispatch(`${evtRootName}.end`, text, options, globals)
    .getText() as string;
  return text;
}
//
function linksReferenceShortcut(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  const evtRootName: string = "links.referenceShortcut";
  text = globals.converter
    ?._dispatch(`${evtRootName}.start`, text, options, globals)
    .getText() as string;
  const rgx = /\[([^\[\]]+)]()()()()()/g;
  text = text.replace(
    rgx,
    replaceAnchorTagReference({
      rgx: rgx,
      evtRootName: evtRootName,
      options: options,
      globals: globals,
    })
  );
  text = globals.converter
    ?._dispatch(`${evtRootName}.end`, text, options, globals)
    .getText() as string;
  return text;
}
//
function linksGhMentions(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  const evtRootName: string = "links.ghMentions";
  if (!options.ghMentions) {
    return text;
  }
  text = globals.converter
    ?._dispatch(`${evtRootName}.start`, text, options, globals)
    .getText() as string;

  const rgx = /(^|\s)(\\)?(@([a-z\d]+(?:[a-z\d._-]+?[a-z\d]+)*))/gi;

  text = text.replace(
    rgx,
    (
      wholeMatch: any,
      st: any,
      escape: string,
      mentions: any,
      username: any
    ) => {
      // bail if the mentions was escaped
      if (escape === "\\") {
        return st + mentions;
      }

      // check if options.ghMentionsLink is a string
      // TODO Validation should be done at initialization not at runtime
      if (typeof options.ghMentionsLink !== "string") {
        throw new Error("ghMentionsLink option must be a string");
      }
      const url = options.ghMentionsLink.replace(/{u}/g, username);
      const evt = createEvent(
        rgx,
        evtRootName + ".captureStart",
        wholeMatch,
        mentions,
        null,
        url,
        null,
        options,
        globals
      );
      // captureEnd Event is triggered inside writeAnchorTag function
      return (
        st + writeAnchorTag({ evt: evt, options: options, globals: globals })
      );
    }
  );

  text = globals.converter
    ?._dispatch(`${evtRootName}.end`, text, options, globals)
    .getText() as string;
  return text;
}
//
function linksNaked(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  const evtRootName: string = "links.naked";
  text = globals.converter
    ?._dispatch(`${evtRootName}.start`, text, options, globals)
    .getText() as string;

  // 2. Now we check for
  // we also include leading markdown magic chars [_*~] for cases like __https://www.google.com/foobar__
  const urlRgx =
    /([_*~]*?)(((?:https?|ftp):\/\/|www\.)[^\s<>"'`´.-][^\s<>"'`´]*?\.[a-z\d.]+[^\s<>"']*)\1/gi;

  text = text.replace(
    urlRgx,
    (
      wholeMatch: string,
      leadingMDChars: string,
      url: string,
      urlPrefix: string
    ) => {
      // we now will start traversing the url from the front to back, looking for punctuation chars [_*~,;:.!?\)\]]
      const len = url.length;
      let suffix = "";
      for (let i = len - 1; i >= 0; --i) {
        const char = url.charAt(i);

        if (/[_*~,;:.!?]/.test(char)) {
          // it's a punctuation char
          // we remove it from the url
          url = url.slice(0, -1);
          // and prepend it to the suffix
          suffix = char + suffix;
        } else if (/\)/.test(char)) {
          const opPar = url.match(/\(/g) || [];
          const clPar = url.match(/\)/g) as RegExpMatchArray;

          // it's a curved parenthesis so we need to check for "balance" (kinda)
          if (opPar.length < clPar.length) {
            // there are more closing Parenthesis than opening so chop it!!!!!
            url = url.slice(0, -1);
            // and prepend it to the suffix
            suffix = char + suffix;
          } else {
            // it's (kinda) balanced so our work is done
            break;
          }
        } else if (/]/.test(char)) {
          const opPar2 = url.match(/\[/g) || [];
          const clPar2 = url.match(/\]/g) as RegExpMatchArray;
          // it's a squared parenthesis so we need to check for "balance" (kinda)
          if (opPar2.length < clPar2.length) {
            // there are more closing Parenthesis than opening so chop it!!!!!
            url = url.slice(0, -1);
            // and prepend it to the suffix
            suffix = char + suffix;
          } else {
            // it's (kinda) balanced so our work is done
            break;
          }
        } else {
          // it's not a punctuation or a parenthesis so our work is done
          break;
        }
      }

      // we copy the treated url to the text variable
      let text = url;
      // finally, if it's a www shortcut, we prepend http
      url = urlPrefix === "www." ? "http://" + url : url;

      // url part is done so let's take care of text now
      // we need to escape the text (because of links such as www.example.com/foo__bar__baz)
      text = text.replace(
        helpers.regexes.asteriskDashTildeAndColon,
        helpers.escapeCharactersCallback
      );

      // finally we dispatch the event
      const evt = createEvent(
        urlRgx,
        evtRootName + ".captureStart",
        wholeMatch,
        text,
        null,
        url,
        null,
        options,
        globals
      );

      // and return the link tag, with the leadingMDChars and  suffix. The leadingMDChars are added at the end too because
      // we consumed those characters in the regexp
      return (
        leadingMDChars +
        writeAnchorTag({ evt: evt, options: options, globals: globals }) +
        suffix +
        leadingMDChars
      );
    }
  );
  const mailRgx =
    /(^|\s)(?:mailto:)?([A-Za-z0-9!#$%&'*+-/=?^_`{|}~.]+@[-a-z0-9]+(\.[-a-z0-9]+)*\.[a-z]+)(?=$|\s)/gim;
  text = text.replace(
    mailRgx,
    (wholeMatch: string, leadingChar: string, mail: string) => {
      let url = "mailto:";
      mail = unescapeSpecialChars(mail, options, globals);
      if (options.encodeEmails) {
        url = helpers.encodeEmailAddress(url + mail);
        mail = helpers.encodeEmailAddress(mail);
      } else {
        url = url + mail;
      }
      const evt = createEvent(
        mailRgx,
        evtRootName + ".captureStart",
        wholeMatch,
        mail,
        null,
        url,
        null,
        options,
        globals
      );
      return (
        leadingChar +
        writeAnchorTag({ evt: evt, options: options, globals: globals })
      );
    }
  );

  text = globals.converter
    ?._dispatch(`${evtRootName}.end`, text, options, globals)
    .getText() as string;
  return text;
}
// Links Parser
function links(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  const evtRootName: string = "links";
  text = globals.converter
    ?._dispatch(`${evtRootName}.start`, text, options, globals)
    .getText() as string;

  // 1. Handle reference-style links: [link text] [id]
  text = linksReference(text, options, globals);

  // 2. Handle inline-style links: [link text](url "optional title")
  text = linksInline(text, options, globals);

  // 3. Handle reference-style shortcuts: [link text]
  // These must come last in case there's a [link text][1] or [link text](/foo)
  text = linksReferenceShortcut(text, options, globals);

  // 4. Handle angle brackets links -> `<http://example.com/>`
  // Must come after links, because you can use < and > delimiters in inline links like [this](<url>).
  text = linksAngleBrackets(text, options, globals);

  // 5. Handle GithubMentions (if option is enabled)
  text = linksGhMentions(text, options, globals);
  // 6. Handle <a> tags and img tags
  text = text.replace(/<a\s[^>]*>[\s\S]*<\/a>/g, (wholeMatch: string) => {
    return helpers._hashHTMLSpan(wholeMatch, globals);
  });

  text = text.replace(/<img\s[^>]*\/?>/g, (wholeMatch: string) => {
    return helpers._hashHTMLSpan(wholeMatch, globals);
  });

  // 7. Handle naked links (if option is enabled)
  text = linksNaked(text, options, globals);

  text = globals.converter
    ?._dispatch(`${evtRootName}.end`, text, options, globals)
    .getText() as string;
  return text;
}
// ================================================= End Of Links Parsers =====================================================================

// 25 Image

export function images(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  text = globals.converter
    ?._dispatch("images.before", text, options, globals)
    .getText() as string;

  const inlineRegExp =
      /!\[([^\]]*?)][ \t]*()\([ \t]?<?([\S]+?(?:\([\S]*?\)[\S]*?)?)>?(?: =([*\d]+[A-Za-z%]{0,4})x([*\d]+[A-Za-z%]{0,4}))?[ \t]*(?:(["'])([^"]*?)\6)?[ \t]?\)/g,
    crazyRegExp =
      /!\[([^\]]*?)][ \t]*()\([ \t]?<([^>]*)>(?: =([*\d]+[A-Za-z%]{0,4})x([*\d]+[A-Za-z%]{0,4}))?[ \t]*(?:(?:(["'])([^"]*?)\6))?[ \t]?\)/g,
    base64RegExp =
      /!\[([^\]]*?)][ \t]*()\([ \t]?<?(data:.+?\/.+?;base64,[A-Za-z0-9+/=\n]+?)>?(?: =([*\d]+[A-Za-z%]{0,4})x([*\d]+[A-Za-z%]{0,4}))?[ \t]*(?:(["'])([^"]*?)\6)?[ \t]?\)/g,
    referenceRegExp = /!\[([^\]]*?)] ?(?:\n *)?\[([\s\S]*?)]()()()()()/g,
    refShortcutRegExp = /!\[([^\[\]]+)]()()()()()/g;

  function writeImageTagBase64(
    wholeMatch: string,
    altText: string,
    linkId: string,
    url: string,
    width: string | number,
    height: string | number,
    m5: any,
    title: string
  ) {
    url = url.replace(/\s/g, "");
    return writeImageTag(
      wholeMatch,
      altText,
      linkId,
      url,
      width,
      height,
      m5,
      title
    );
  }

  function writeImageTagBaseUrl(
    wholeMatch: string,
    altText: string,
    linkId: string,
    url: string,
    width: string | number,
    height: string | number,
    m5: any,
    title: string
  ) {
    url = helpers.applyBaseUrl(options.relativePathBaseUrl, url);

    return writeImageTag(
      wholeMatch,
      altText,
      linkId,
      url,
      width,
      height,
      m5,
      title
    );
  }

  function writeImageTag(
    wholeMatch: string,
    altText: string,
    linkId: any,
    url: string | null,
    width: number | string,
    height: number | string,
    m5: any,
    title: string
  ) {
    var gUrls = globals.gUrls,
      gTitles = globals.gTitles,
      gDims = globals.gDimensions;

    linkId = linkId.toLowerCase();

    if (!title) {
      title = "";
    }
    // Special case for explicit empty url
    if (wholeMatch.search(/\(<?\s*>? ?(['"].*['"])?\)$/m) > -1) {
      url = "";
    } else if (url === "" || url === null) {
      if (linkId === "" || linkId === null) {
        // lower-case and turn embedded newlines into spaces
        linkId = altText.toLowerCase().replace(/ ?\n/g, " ");
      }
      url = "#" + linkId;

      if (typeof gUrls[linkId] !== "undefined") {
        url = gUrls[linkId];
        if (typeof gTitles[linkId] !== "undefined") {
          title = gTitles[linkId];
        }
        if (typeof gDims[linkId] !== "undefined") {
          width = gDims[linkId].width;
          height = gDims[linkId].height;
        }
      } else {
        return wholeMatch;
      }
    }

    altText = altText
      .replace(/"/g, "&quot;")
      //altText = showdown.helper.escapeCharacters(altText, '*_', false);
      .replace(
        helpers.regexes.asteriskDashTildeAndColon,
        helpers.escapeCharactersCallback
      );
    //url = showdown.helper.escapeCharacters(url, '*_', false);
    url = url.replace(
      helpers.regexes.asteriskDashTildeAndColon,
      helpers.escapeCharactersCallback
    );
    let result = '<img src="' + url + '" alt="' + altText + '"';

    if (title && typeof title === "string") {
      title = title
        .replace(/"/g, "&quot;")
        //title = showdown.helper.escapeCharacters(title, '*_', false);
        .replace(
          helpers.regexes.asteriskDashTildeAndColon,
          helpers.escapeCharactersCallback
        );
      result += ' title="' + title + '"';
    }

    if (width && height) {
      width = width === "*" ? "auto" : width;
      height = height === "*" ? "auto" : height;

      result += ' width="' + width + '"';
      result += ' height="' + height + '"';
    }

    result += " />";

    return result;
  }

  // First, handle reference-style labeled images: ![alt text][id]
  text = text.replace(referenceRegExp, writeImageTag);

  // Next, handle inline images:  ![alt text](url =<width>x<height> "optional title")

  // base64 encoded images
  text = text.replace(base64RegExp, writeImageTagBase64);

  // cases with crazy urls like ./image/cat1).png
  text = text.replace(crazyRegExp, writeImageTagBaseUrl);

  // normal cases
  text = text.replace(inlineRegExp, writeImageTagBaseUrl);

  // handle reference-style shortcuts: ![img text]
  text = text.replace(refShortcutRegExp, writeImageTag);

  text = globals.converter
    ?._dispatch("images.after", text, options, globals)
    .getText() as string;
  return text;
}

// 26
function spanGamut(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  text = globals.converter
    ?._dispatch("spanGamut.before", text, options, globals)
    .getText() as string;

  text = codeSpans(text, options, globals);
  text = escapeSpecialCharsWithinTagAttributes(text, options, globals);
  text = encodeBackslashEscapes(text, options, globals);

  // Process link and image tags. Images must come first,
  // because ![foo][f] looks like a link.
  text = images(text, options, globals);

  text = globals.converter
    ?._dispatch("links.before", text, options, globals)
    .getText() as string;
  text = links(text, options, globals);
  text = globals.converter
    ?._dispatch("links.after", text, options, globals)
    .getText() as string;

  //text = showdown.subParser('makehtml.autoLinks')(text, options, globals);
  //text = showdown.subParser('makehtml.simplifiedAutoLinks')(text, options, globals);
  text = emoji(text, options, globals);
  text = underline(text, options, globals);
  text = italicsAndBold(text, options, globals);
  text = strikethrough(text, options, globals);
  text = ellipsis(text, options, globals);

  // we need to hash HTML tags inside spans
  text = hashHTMLSpans(text, options, globals);

  // now we encode amps and angles
  text = encodeAmpsAndAngles(text, options, globals);

  // Do hard breaks
  if (options.simpleLineBreaks) {
    // GFM style hard breaks
    // only add line breaks if the text does not contain a block (special case for lists)
    if (!/\n\n¨K/.test(text)) {
      text = text.replace(/\n+/g, "<br />\n");
    }
  } else {
    // Vanilla hard breaks
    text = text.replace(/  +\n/g, "<br />\n");
  }

  text = globals.converter
    ?._dispatch("spanGamut.after", text, options, globals)
    .getText() as string;
  return text;
}
//
export function paragraphs(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  text = globals.converter
    ?._dispatch("paragraphs.before", text, options, globals)
    .getText() as string;
  // Strip leading and trailing lines:
  text = text.replace(/^\n+/g, "");
  text = text.replace(/\n+$/g, "");

  var grafs = text.split(/\n{2,}/g),
    grafsOut: any[] = [],
    end = grafs.length; // Wrap <p> tags

  for (var i = 0; i < end; i++) {
    var str = grafs[i];
    // if this is an HTML marker, copy it
    if (str.search(/¨(K|G)(\d+)\1/g) >= 0) {
      grafsOut.push(str);

      // test for presence of characters to prevent empty lines being parsed
      // as paragraphs (resulting in undesired extra empty paragraphs)
    } else if (str.search(/\S/) >= 0) {
      str = spanGamut(str, options, globals);
      str = str.replace(/^([ \t]*)/g, "<p>");
      str += "</p>";
      grafsOut.push(str);
    }
  }

  /** Unhashify HTML blocks */
  end = grafsOut.length;
  for (i = 0; i < end; i++) {
    var blockText = "",
      grafsOutIt = grafsOut[i],
      codeFlag = false;
    // if this is a marker for an html block...
    // use RegExp.test instead of string.search because of QML bug
    while (/¨(K|G)(\d+)\1/.test(grafsOutIt)) {
      let delim = grafsOutIt.match(/¨(K|G)(\d+)\1/)[1];

      if (delim === "K") {
        blockText = globals.gHtmlBlocks[+RegExp.$2];
      } else {
        // we need to check if ghBlock is a false positive
        if (codeFlag) {
          const aa = globals.ghCodeBlocks[+RegExp.$2];
          const bb = aa.text as string;
          // use encoded version of all text
          blockText = encodeCode(bb, options, globals);
        } else {
          blockText = globals.ghCodeBlocks[+RegExp.$2].codeblock as string;
        }
      }
      blockText = blockText.replace(/\$/g, "$$$$"); // Escape any dollar signs

      grafsOutIt = grafsOutIt.replace(/(\n\n)?¨(K|G)\d+\2(\n\n)?/, blockText);
      // Check if grafsOutIt is a pre->code
      if (/^<pre\b[^>]*>\s*<code\b[^>]*>/.test(grafsOutIt)) {
        codeFlag = true;
      }
    }
    grafsOut[i] = grafsOutIt;
  }
  text = grafsOut.join("\n");
  // Strip leading and trailing lines:
  text = text.replace(/^\n+/g, "");
  text = text.replace(/\n+$/g, "");
  return globals.converter
    ?._dispatch("paragraphs.after", text, options, globals)
    .getText() as string;
}
//
function headers(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  text = globals.converter
    ?._dispatch("headers.before", text, options, globals)
    .getText() as string;

  const headerLevelStart = isNaN(parseInt(options.headerLevelStart as string))
      ? 1
      : parseInt(options.headerLevelStart as string),
    // Set text-style headers:
    //	Header 1
    //	========
    //
    //	Header 2
    //	--------
    //
    setextRegexH1 = options.smoothLivePreview
      ? /^(.+)[ \t]*\n={2,}[ \t]*\n+/gm
      : /^(.+)[ \t]*\n=+[ \t]*\n+/gm,
    setextRegexH2 = options.smoothLivePreview
      ? /^(.+)[ \t]*\n-{2,}[ \t]*\n+/gm
      : /^(.+)[ \t]*\n-+[ \t]*\n+/gm;

  text = text.replace(setextRegexH1, function (wholeMatch: string, m1: string) {
    const _spanGamut = spanGamut(m1, options, globals);
    const hID = options.noHeaderId ? "" : `id="${headerId(m1)}"`;
    const hLevel = headerLevelStart;
    const _hashBlock = `<h${hLevel} ${hID}>${_spanGamut}</h${hLevel}>`;
    return hashBlock(_hashBlock, options, globals);
  });

  text = text.replace(setextRegexH2, (matchFound: string, m1: string) => {
    const _spanGamut = spanGamut(m1, options, globals);
    const hID = options.noHeaderId ? "" : `id="${headerId(m1)}"`;
    const hLevel = headerLevelStart + 1;
    const _hashBlock = `<h${hLevel} ${hID}>${_spanGamut}</h${hLevel}>`;
    return hashBlock(_hashBlock, options, globals);
  });

  // atx-style headers:
  //  # Header 1
  //  ## Header 2
  //  ## Header 2 with closing hashes ##
  //  ...
  //  ###### Header 6
  //
  const atxStyle = options.requireSpaceBeforeHeadingText
    ? /^(#{1,6})[ \t]+(.+?)[ \t]*#*\n+/gm
    : /^(#{1,6})[ \t]*(.+?)[ \t]*#*\n+/gm;

  text = text.replace(
    atxStyle,
    (wholeMatch: string, m1: string, m2: string) => {
      let hText = m2;
      if (options.customizedHeaderId) {
        hText = m2.replace(/\s?{([^{]+?)}\s*$/, "");
      }

      const span = spanGamut(hText, options, globals);
      const hID = options.noHeaderId ? "" : `id="${headerId(m2)}"`;
      const hLevel = headerLevelStart - 1 + m1.length;
      const header = `<h${hLevel} ${hID}>${span}</h${hLevel}>`;

      return hashBlock(header, options, globals);
    }
  );

  function headerId(m: string) {
    let title: string = "";
    let prefix: string = "";

    // It is separate from other options to allow combining prefix and customized
    if (options.customizedHeaderId) {
      const match: RegExpMatchArray | null = m.match(/{([^{]+?)}\s*$/);
      if (match && match[1]) {
        m = match[1];
      }
    }

    title = m;

    // Prefix id to prevent causing inadvertent pre-existing style matches.
    if (typeof options.prefixHeaderId === "string") {
      prefix = options.prefixHeaderId;
    } else if (options.prefixHeaderId === true) {
      prefix = "section-";
    } else {
      prefix = "";
    }

    if (!options.rawPrefixHeaderId) {
      title = prefix + title;
    }

    if (options.ghCompatibleHeaderId) {
      title = title
        .replace(/ /g, "-")
        // replace previously escaped chars (&, ¨ and $)
        .replace(/&amp;/g, "")
        .replace(/¨T/g, "")
        .replace(/¨D/g, "")
        // replace rest of the chars (&~$ are repeated as they might have been escaped)
        // borrowed from github's redcarpet (some they should produce similar results)
        .replace(/[&+$,\/:;=?@"#{}|^¨~\[\]`\\*)(%.!'<>]/g, "")
        .toLowerCase();
    } else if (options.rawHeaderId) {
      title = title
        .replace(/ /g, "-")
        // replace previously escaped chars (&, ¨ and $)
        .replace(/&amp;/g, "&")
        .replace(/¨T/g, "¨")
        .replace(/¨D/g, "$")
        // replace " and '
        .replace(/["']/g, "-")
        .toLowerCase();
    } else {
      title = title.replace(/[^\w]/g, "").toLowerCase();
    }

    if (options.rawPrefixHeaderId) {
      title = prefix + title;
    }

    if (globals.hashLinkCounts[title] as number) {
      title = title + "-" + (globals.hashLinkCounts[title] as number)++;
    } else {
      globals.hashLinkCounts[title] = 1;
    }
    return title;
  }

  text = globals.converter
    ?._dispatch("headers.after", text, options, globals)
    .getText() as string;
  return text;
}
//
function tables(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  if (!options.tables) {
    return text;
  }

  const tableRgx =
    /^ {0,3}\|?.+\|.+\n {0,3}\|?[ \t]*:?[ \t]*[-=]{2,}[ \t]*:?[ \t]*\|[ \t]*:?[ \t]*[-=]{2,}[\s\S]+?(?:\n\n|¨0)/gm;
  //singeColTblRgx = /^ {0,3}\|.+\|\n {0,3}\|[ \t]*:?[ \t]*(?:[-=]){2,}[ \t]*:?[ \t]*\|[ \t]*\n(?: {0,3}\|.+\|\n)+(?:\n\n|¨0)/gm;
  const singeColTblRgx =
    /^ {0,3}\|.+\|[ \t]*\n {0,3}\|[ \t]*:?[ \t]*[-=]{2,}[ \t]*:?[ \t]*\|[ \t]*\n( {0,3}\|.+\|[ \t]*\n)*(?:\n|¨0)/gm;

  function parseStyles(sLine: string) {
    if (/^:[ \t]*--*$/.test(sLine)) {
      return ' style="text-align:left;"';
    } else if (/^--*[ \t]*:[ \t]*$/.test(sLine)) {
      return ' style="text-align:right;"';
    } else if (/^:[ \t]*--*[ \t]*:$/.test(sLine)) {
      return ' style="text-align:center;"';
    } else {
      return "";
    }
  }

  function parseHeaders(header: string, style: string) {
    let id: string = "";
    header = header.trim();
    // support both tablesHeaderId and tableHeaderId due to error in documentation so we don't break backwards compatibility
    if (options.tablesHeaderId || options.tablesHeaderId) {
      id = `id="${header.replace(/ /g, "_").toLowerCase()}"`;
    }
    header = spanGamut(header, options, globals);

    return `<th ${id} ${style}>${header}</th>\n`;
  }

  function parseCells(cell: string, style: string) {
    const subText = spanGamut(cell, options, globals);
    return `<td ${style}>${subText}</td>\n`;
  }

  function buildTable(headers: string | any[], cells: string | any[]) {
    var tb = "<table>\n<thead>\n<tr>\n",
      tblLgn = headers.length;

    for (var i = 0; i < tblLgn; ++i) {
      tb += headers[i];
    }
    tb += "</tr>\n</thead>\n<tbody>\n";

    for (i = 0; i < cells.length; ++i) {
      tb += "<tr>\n";
      for (var ii = 0; ii < tblLgn; ++ii) {
        tb += cells[i][ii];
      }
      tb += "</tr>\n";
    }
    tb += "</tbody>\n</table>\n";
    return tb;
  }

  function parseTable(rawTable: string) {
    let i: number,
      tableLines = rawTable.split("\n");

    for (i = 0; i < tableLines.length; ++i) {
      // strip wrong first and last column if wrapped tables are used
      if (/^ {0,3}\|/.test(tableLines[i])) {
        tableLines[i] = tableLines[i].replace(/^ {0,3}\|/, "");
      }
      if (/\|[ \t]*$/.test(tableLines[i])) {
        tableLines[i] = tableLines[i].replace(/\|[ \t]*$/, "");
      }
      // parse code spans first, but we only support one line code spans

      tableLines[i] = codeSpans(tableLines[i], options, globals);
    }

    const rawHeaders = tableLines[0].split("|").map(function (s: string) {
        return s.trim();
      }),
      rawStyles = tableLines[1].split("|").map(function (s: string) {
        return s.trim();
      });
    const rawCells: string[][] = [],
      headers: string[] = [],
      styles: string[] = [],
      cells: string[][] = [];

    tableLines.shift();
    tableLines.shift();

    for (i = 0; i < tableLines.length; ++i) {
      if (tableLines[i].trim() === "") {
        continue;
      }
      rawCells.push(
        tableLines[i].split("|").map(function (s: string) {
          return s.trim();
        })
      );
    }

    if (rawHeaders.length < rawStyles.length) {
      return rawTable;
    }

    for (i = 0; i < rawStyles.length; ++i) {
      styles.push(parseStyles(rawStyles[i]));
    }

    for (i = 0; i < rawHeaders.length; ++i) {
      if (typeof styles[i] === "undefined") {
        styles[i] = "";
      }
      headers.push(parseHeaders(rawHeaders[i], styles[i]));
    }

    for (i = 0; i < rawCells.length; ++i) {
      const row: string[] = [];
      for (var ii = 0; ii < headers.length; ++ii) {
        if (typeof rawCells[i][ii] === "undefined") {
        }
        row.push(parseCells(rawCells[i][ii], styles[ii]));
      }
      cells.push(row);
    }

    return buildTable(headers, cells);
  }

  text = globals.converter
    ?._dispatch("tables.before", text, options, globals)
    .getText() as string;

  // find escaped pipe characters
  text = text.replace(/\\(\|)/g, helpers.escapeCharactersCallback);

  // parse multi column tables
  text = text.replace(tableRgx, parseTable);

  // parse one column tables
  text = text.replace(singeColTblRgx, parseTable);

  text = globals.converter
    ?._dispatch("tables.after", text, options, globals)
    .getText() as string;

  return text;
}

//
function blockQuotes(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  text = globals.converter
    ?._dispatch("blockQuotes.before", text, options, globals)
    .getText() as string;

  // add a couple extra lines after the text and endtext mark
  text = text + "\n\n";

  var rgx = /(^ {0,3}>[ \t]?.+\n(.+\n)*\n*)+/gm;

  if (options.splitAdjacentBlockquotes) {
    rgx = /^ {0,3}>[\s\S]*?(?:\n\n)/gm;
  }

  text = text.replace(rgx, function (bq) {
    // attacklab: hack around Konqueror 3.5.4 bug:
    // "----------bug".replace(/^-/g,"") == "bug"
    bq = bq.replace(/^[ \t]*>[ \t]?/gm, ""); // trim one level of quoting

    // attacklab: clean up hack
    bq = bq.replace(/¨0/g, "");

    bq = bq.replace(/^[ \t]+$/gm, ""); // trim whitespace-only lines
    bq = githubCodeBlocks(bq, options, globals);
    bq = blockGamut(bq, options, globals); // recurse

    bq = bq.replace(/(^|\n)/g, "$1  ");
    // These leading spaces screw with <pre> content, so we need to fix that:
    bq = bq.replace(/(\s*<pre>[^\r]+?<\/pre>)/gm, function (wholeMatch, m1) {
      var pre = m1;
      // attacklab: hack around Konqueror 3.5.4 bug:
      pre = pre.replace(/^  /gm, "¨0");
      pre = pre.replace(/¨0/g, "");
      return pre;
    });

    return hashBlock(
      "<blockquote>\n" + bq + "\n</blockquote>",
      options,
      globals
    );
  });

  text = globals.converter
    ?._dispatch("blockQuotes.after", text, options, globals)
    .getText() as string;
  return text;
}
//
function blockGamut(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  text = globals.converter
    ?._dispatch("blockGamut.before", text, options, globals)
    .getText() as string;

  // we parse blockquotes first so that we can have headings and hrs
  // inside blockquotes
  text = blockQuotes(text, options, globals);
  text = headers(text, options, globals);

  // Do Horizontal Rules:
  text = horizontalRule(text, options, globals);

  text = lists(text, options, globals);
  text = codeBlocks(text, options, globals);
  text = tables(text, options, globals);

  // We already ran _HashHTMLBlocks() before, in Markdown(), but that
  // was to escape raw HTML in the original Markdown source. This time,
  // we're escaping the markup we've just created, so that we don't wrap
  // <p> tags around block-level tags.
  text = hashHTMLBlocks(text, options, globals);
  text = paragraphs(text, options, globals);

  text = globals.converter
    ?._dispatch("blockGamut.after", text, options, globals)
    .getText() as string;

  return text;
}
//
function lists(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  /**
   * Process the contents of a single ordered or unordered list, splitting it
   * into individual list items.
   * @param {string} listStr
   * @param {boolean} trimTrailing
   * @returns {string}
   */
  function processListItems(listStr: string, trimTrailing: boolean): string {
    // The $g_list_level global keeps track of when we're inside a list.
    // Each time we enter a list, we increment it; when we leave a list,
    // we decrement. If it's zero, we're not in a list anymore.
    //
    // We do this because when we're not inside a list, we want to treat
    // something like this:
    //
    //    I recommend upgrading to version
    //    8. Oops, now this line is treated
    //    as a sub-list.
    //
    // As a single paragraph, despite the fact that the second line starts
    // with a digit-period-space sequence.
    //
    // Whereas when we're inside a list (or sub-list), that line will be
    // treated as the start of a sub-list. What a kludge, huh? This is
    // an aspect of Markdown's syntax that's hard to parse perfectly
    // without resorting to mind-reading. Perhaps the solution is to
    // change the syntax rules such that sub-lists must start with a
    // starting cardinal number; e.g. "1." or "a.".
    let aa = globals.gListLevel as number;
    aa++;

    // trim trailing blank lines:
    listStr = listStr.replace(/\n{2,}$/, "\n");

    // attacklab: add sentinel to emulate \z
    listStr += "¨0";

    var rgx =
        /(\n)?(^ {0,3})([*+-]|\d+[.])[ \t]+((\[([xX ])])?[ \t]*[^\r]+?(\n{1,2}))(?=\n*(¨0| {0,3}([*+-]|\d+[.])[ \t]+))/gm,
      isParagraphed = /\n[ \t]*\n(?!¨0)/.test(listStr);

    // Since version 1.5, nesting sublists requires 4 spaces (or 1 tab) indentation,
    // which is a syntax breaking change
    // activating this option reverts to old behavior
    // This will be removed in version 2.0
    if (options.disableForced4SpacesIndentedSublists) {
      rgx =
        /(\n)?(^ {0,3})([*+-]|\d+[.])[ \t]+((\[([xX ])])?[ \t]*[^\r]+?(\n{1,2}))(?=\n*(¨0|\2([*+-]|\d+[.])[ \t]+))/gm;
    }

    listStr = listStr.replace(
      rgx,
      function (wholeMatch, m1, m2, m3, m4, taskbtn, checked) {
        checked = checked && checked.trim() !== "";

        let item = outdent(m4, options, globals),
          bulletStyle = "";

        // Support for github tasklists
        if (taskbtn && options.tasklists) {
          // Style used for tasklist bullets
          bulletStyle = ' class="task-list-item';
          if (options.moreStyling) {
            bulletStyle += checked ? " task-list-item-complete" : "";
          }
          bulletStyle += '" style="list-style-type: none;"';

          item = item.replace(/^[ \t]*\[([xX ])?]/m, function () {
            var otp =
              '<input type="checkbox" disabled style="margin: 0px 0.35em 0.25em -1.6em; vertical-align: middle;"';
            if (checked) {
              otp += " checked";
            }
            otp += ">";
            return otp;
          });
        }

        // ISSUE #312
        // This input: - - - a
        // causes trouble to the parser, since it interprets it as:
        // <ul><li><li><li>a</li></li></li></ul>
        // instead of:
        // <ul><li>- - a</li></ul>
        // So, to prevent it, we will put a marker (¨A)in the beginning of the line
        // Kind of hackish/monkey patching, but seems more effective than overcomplicating the list parser
        item = item.replace(/^([-*+]|\d\.)[ \t]+[\S\n ]*/g, function (wm2) {
          return "¨A" + wm2;
        });

        // SPECIAL CASE: a heading followed by a paragraph of text that is not separated by a double newline
        // or/nor indented. ex:
        //
        // - # foo
        // bar is great
        //
        // While this does now follow the spec per se, not allowing for this might cause confusion since
        // header blocks don't need double-newlines after
        if (/^#+.+\n.+/.test(item)) {
          item = item.replace(/^(#+.+)$/m, "$1\n");
        }

        // m1 - Leading line or
        // Has a double return (multi paragraph)
        if (m1 || item.search(/\n{2,}/) > -1) {
          item = githubCodeBlocks(item, options, globals) as string;
          item = blockQuotes(item, options, globals) as string;
          item = headers(item, options, globals) as string;
          item = lists(item, options, globals) as string;
          item = codeBlocks(item, options, globals) as string;
          item = tables(item, options, globals) as string;
          item = hashHTMLBlocks(item, options, globals) as string;
          //item = showdown.subParser('makehtml.paragraphs')(item, options, globals);

          // TODO: This is a copy of the paragraph parser
          // This is a provisory fix for issue #494
          // For a permanente fix we need to rewrite the paragraph parser, passing the unhashify logic outside
          // so that we can call the paragraph parser without accidently unashifying previously parsed blocks

          // Strip leading and trailing lines:
          item = item.replace(/^\n+/g, "");
          item = item.replace(/\n+$/g, "");

          const grafs = item.split(/\n{2,}/g),
            grafsOut: string[] = [],
            end = grafs.length; // Wrap <p> tags

          for (var i = 0; i < end; i++) {
            var str = grafs[i];
            // if this is an HTML marker, copy it
            if (str.search(/¨([KG])(\d+)\1/g) >= 0) {
              grafsOut.push(str);

              // test for presence of characters to prevent empty lines being parsed
              // as paragraphs (resulting in undesired extra empty paragraphs)
            } else if (str.search(/\S/) >= 0) {
              str = spanGamut(str, options, globals) as string;
              str = str.replace(/^([ \t]*)/g, "<p>");
              str += "</p>";
              grafsOut.push(str);
            }
          }
          item = grafsOut.join("\n");
          // Strip leading and trailing lines:
          item = item.replace(/^\n+/g, "");
          item = item.replace(/\n+$/g, "");
        } else {
          // Recursion for sub-lists:
          item = lists(item, options, globals) as string;
          item = item.replace(/\n$/, ""); // chomp(item)
          item = hashHTMLBlocks(item, options, globals) as string;

          // Colapse double linebreaks
          item = item.replace(/\n\n+/g, "\n\n");

          if (isParagraphed) {
            item = paragraphs(item, options, globals) as string;
          } else {
            item = spanGamut(item, options, globals) as string;
          }
        }

        // now we need to remove the marker (¨A)
        item = item.replace("¨A", "");
        // we can finally wrap the line in list item tags
        item = "<li" + bulletStyle + ">" + item + "</li>\n";

        return item;
      }
    );

    // attacklab: strip sentinel
    listStr = listStr.replace(/¨0/g, "");
    let bb = globals.gListLevel as number;
    bb--;

    if (trimTrailing) {
      listStr = listStr.replace(/\s+$/, "");
    }

    return listStr;
  }

  function styleStartNumber(list: string, listType: string) {
    // check if ol and starts by a number different than 1
    if (listType === "ol") {
      var res = list.match(/^ *(\d+)\./);
      if (res && res[1] !== "1") {
        return ' start="' + res[1] + '"';
      }
    }
    return "";
  }

  /**
   * Check and parse consecutive lists (better fix for issue #142)
   * @param {string} list
   * @param {string} listType
   * @param {boolean} trimTrailing
   * @returns {string}
   */
  function parseConsecutiveLists(
    list: string,
    listType: string,
    trimTrailing: boolean
  ): string {
    // check if we caught 2 or more consecutive lists by mistake
    // we use the counterRgx, meaning if listType is UL we look for OL and vice versa
    var olRgx = options.disableForced4SpacesIndentedSublists
        ? /^ ?\d+\.[ \t]/gm
        : /^ {0,3}\d+\.[ \t]/gm,
      ulRgx = options.disableForced4SpacesIndentedSublists
        ? /^ ?[*+-][ \t]/gm
        : /^ {0,3}[*+-][ \t]/gm,
      counterRxg = listType === "ul" ? olRgx : ulRgx,
      result = "";

    if (list.search(counterRxg) !== -1) {
      (function parseCL(txt) {
        var pos = txt.search(counterRxg),
          style = styleStartNumber(list, listType);
        if (pos !== -1) {
          // slice
          result +=
            "\n\n<" +
            listType +
            style +
            ">\n" +
            processListItems(txt.slice(0, pos), !!trimTrailing) +
            "</" +
            listType +
            ">\n";

          // invert counterType and listType
          listType = listType === "ul" ? "ol" : "ul";
          counterRxg = listType === "ul" ? olRgx : ulRgx;

          //recurse
          parseCL(txt.slice(pos));
        } else {
          result +=
            "\n\n<" +
            listType +
            style +
            ">\n" +
            processListItems(txt, !!trimTrailing) +
            "</" +
            listType +
            ">\n";
        }
      })(list);
    } else {
      var style = styleStartNumber(list, listType);
      result =
        "\n\n<" +
        listType +
        style +
        ">\n" +
        processListItems(list, !!trimTrailing) +
        "</" +
        listType +
        ">\n";
    }

    return result;
  }

  // Start of list parsing
  var subListRgx =
    /^(( {0,3}([*+-]|\d+[.])[ \t]+)[^\r]+?(¨0|\n{2,}(?=\S)(?![ \t]*(?:[*+-]|\d+[.])[ \t]+)))/gm;
  var mainListRgx =
    /(\n\n|^\n?)(( {0,3}([*+-]|\d+[.])[ \t]+)[^\r]+?(¨0|\n{2,}(?=\S)(?![ \t]*(?:[*+-]|\d+[.])[ \t]+)))/gm;

  text = globals.converter
    ?._dispatch("lists.before", text, options, globals)
    .getText() as string;
  // add sentinel to hack around khtml/safari bug:
  // http://bugs.webkit.org/show_bug.cgi?id=11231
  text += "¨0";

  if (globals.gListLevel) {
    text = text.replace(subListRgx, function (wholeMatch, list, m2) {
      var listType = m2.search(/[*+-]/g) > -1 ? "ul" : "ol";
      return parseConsecutiveLists(list, listType, true);
    });
  } else {
    text = text.replace(mainListRgx, function (wholeMatch, m1, list, m3) {
      var listType = m3.search(/[*+-]/g) > -1 ? "ul" : "ol";
      return parseConsecutiveLists(list, listType, false);
    });
  }

  // strip sentinel
  text = text.replace(/¨0/, "");
  text = globals.converter
    ?._dispatch("lists.after", text, options, globals)
    .getText() as string;
  return text;
}
//
function stripLinkDefinitions(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  var regex =
      /^ {0,3}\[([^\]]+)]:[ \t]*\n?[ \t]*<?([^>\s]+)>?(?: =([*\d]+[A-Za-z%]{0,4})x([*\d]+[A-Za-z%]{0,4}))?[ \t]*\n?[ \t]*(?:(\n*)["|'(](.+?)["|')][ \t]*)?(?:\n+|(?=¨0))/gm,
    base64Regex =
      /^ {0,3}\[([^\]]+)]:[ \t]*\n?[ \t]*<?(data:.+?\/.+?;base64,[A-Za-z0-9+/=\n]+?)>?(?: =([*\d]+[A-Za-z%]{0,4})x([*\d]+[A-Za-z%]{0,4}))?[ \t]*\n?[ \t]*(?:(\n*)["|'(](.+?)["|')][ \t]*)?(?:\n\n|(?=¨0)|(?=\n\[))/gm;

  // attacklab: sentinel workarounds for lack of \A and \Z, safari\khtml bug
  text += "¨0";

  var replaceFunc = function (
    wholeMatch: any,
    linkId: string,
    url: string,
    width: any,
    height: any,
    blankLines: any,
    title: string
  ) {
    // if there aren't two instances of linkId it must not be a reference link so back out
    linkId = linkId.toLowerCase();
    if (text.toLowerCase().split(linkId).length - 1 < 2) {
      return wholeMatch;
    }
    if (url.match(/^data:.+?\/.+?;base64,/)) {
      // remove newlines
      globals.gUrls[linkId] = url.replace(/\s/g, "");
    } else {
      url = helpers.applyBaseUrl(options.relativePathBaseUrl, url);

      globals.gUrls[linkId] = encodeAmpsAndAngles(
        url,
        options,
        globals
      ) as string; // Link IDs are case-insensitive
    }

    if (blankLines) {
      // Oops, found blank lines, so it's not a title.
      // Put back the parenthetical statement we stole.
      return blankLines + title;
    } else {
      if (title) {
        globals.gTitles[linkId] = title.replace(/"|'/g, "&quot;");
      }
      if (options.parseImgDimensions && width && height) {
        globals.gDimensions[linkId] = {
          width: width,
          height: height,
        };
      }
    }
    // Completely remove the definition from the text
    return "";
  };

  // first we try to find base64 link references
  text = text.replace(base64Regex, replaceFunc);

  text = text.replace(regex, replaceFunc);

  // attacklab: strip sentinel
  text = text.replace(/¨0/, "");

  return text;
}
//
function runExtension(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter,
  ext: ShowdownExtension
): string {
  if (ext?.filter) {
    text = ext.filter(text, globals.converter as Converter, options);
  } else if (ext?.regex) {
    // TODO remove this when old extension loading mechanism is deprecated
    let re = ext.regex;
    if (!(re instanceof RegExp)) {
      re = new RegExp(re, "g");
    }
    text = text.replace(re, ext.replace);
  }

  return text;
}
//
function completeHTMLDocument(
  text: string,
  options: ConverterOptions,
  globals: GlobalConverter
): string {
  if (!options.completeHTMLDocument) {
    return text;
  }

  text = globals.converter
    ?._dispatch("completeHTMLDocument.before", text, options, globals)
    .getText() as string;

  var doctype = "html",
    doctypeParsed = "<!DOCTYPE HTML>\n",
    title = "",
    charset = '<meta charset="utf-8">\n',
    lang = "",
    metadata = "";

  if (typeof globals.metadata.parsed.doctype !== "undefined") {
    doctypeParsed = "<!DOCTYPE " + globals.metadata.parsed.doctype + ">\n";
    doctype = globals.metadata.parsed.doctype.toString().toLowerCase();
    if (doctype === "html" || doctype === "html5") {
      charset = '<meta charset="utf-8">';
    }
  }

  for (var meta in globals.metadata.parsed) {
    if (globals.metadata.parsed.hasOwnProperty(meta)) {
      switch (meta.toLowerCase()) {
        case "doctype":
          break;

        case "title":
          title = "<title>" + globals.metadata.parsed.title + "</title>\n";
          break;

        case "charset":
          if (doctype === "html" || doctype === "html5") {
            charset =
              '<meta charset="' + globals.metadata.parsed.charset + '">\n';
          } else {
            charset =
              '<meta name="charset" content="' +
              globals.metadata.parsed.charset +
              '">\n';
          }
          break;

        case "language":
        case "lang":
          lang = ' lang="' + globals.metadata.parsed[meta] + '"';
          metadata +=
            '<meta name="' +
            meta +
            '" content="' +
            globals.metadata.parsed[meta] +
            '">\n';
          break;

        default:
          metadata +=
            '<meta name="' +
            meta +
            '" content="' +
            globals.metadata.parsed[meta] +
            '">\n';
      }
    }
  }

  text =
    doctypeParsed +
    "<html" +
    lang +
    ">\n<head>\n" +
    title +
    charset +
    metadata +
    "</head>\n<body>\n" +
    text.trim() +
    "\n</body>\n</html>";

  text = globals.converter
    ?._dispatch("completeHTMLDocument.after", text, options, globals)
    .getText() as string;
  return text;
}

export {
  detab,
  runExtension,
  metadata,
  hashPreCodeTags,
  githubCodeBlocks,
  hashHTMLBlocks,
  hashCodeTags,
  stripLinkDefinitions,
  blockGamut,
  unhashHTMLSpans,
  unescapeSpecialChars,
  completeHTMLDocument,
};
