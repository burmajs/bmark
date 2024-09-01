import { parsers, registerParser } from "../parser.js"; //2nd
import { helpers } from "../helpers.js";
import { emojis } from "./emoji.js";
//
registerParser("encodeCode", (text, options, globals) => {
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
});
// 2
/**
 * Convert all tabs to spaces
 */

registerParser("detab", (text, options, globals) => {
  text = globals.converter
    ?._dispatch("detab.before", text, options, globals)
    .getText() as string;

  // expand first n-1 tabs
  text = text.replace(/\t(?=\t)/g, "    "); // g_tab_width

  // replace the nth with two sentinels
  text = text.replace(/\t/g, "¨A¨B");

  // use the sentinel to anchor our regex so it doesn't explode
  text = text.replace(/¨B(.+?)¨A/g, function (wholeMatch, m1) {
    var leadingText = m1,
      numSpaces = 4 - (leadingText.length % 4); // g_tab_width

    // there *must* be a better way to do this:
    for (var i = 0; i < numSpaces; i++) {
      leadingText += " ";
    }

    return leadingText;
  });

  // clean up sentinels
  text = text.replace(/¨A/g, "    "); // g_tab_width
  text = text.replace(/¨B/g, "");

  text = globals.converter
    ?._dispatch("detab.after", text, options, globals)
    .getText() as string;
  return text;
});
// 3
/**
 * Remove one level of line-leading tabs or spaces
 */
registerParser("outdent", function (text, options, globals) {
  "use strict";
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
});
// 4
registerParser("hashBlock", function (text, options, globals) {
  "use strict";
  text = globals.converter
    ?._dispatch("hashBlock.before", text, options, globals)
    .getText() as string;
  text = text.replace(/(^\n+|\n+$)/g, "");
  text = "\n\n¨K" + (globals.gHtmlBlocks.push(text) - 1) + "K\n\n";
  text = globals.converter
    ?._dispatch("hashBlock.after", text, options, globals)
    .getText() as string;
  return text;
});
//5
registerParser("ellipsis", function (text, options, globals) {
  "use strict";

  if (!options.ellipsis) {
    return text;
  }

  text = globals.converter
    ?._dispatch("ellipsis.before", text, options, globals)
    .getText() as string;

  text = text.replace(/\.\.\./g, "…");

  text = globals.converter
    ?._dispatch("ellipsis.after", text, options, globals)
    .getText() as string;

  return text;
});
// 6
/**
 * Turn emoji codes into emojis
 *
 */
registerParser("emoji", function (text, options, globals) {
  "use strict";

  if (!options.emoji) {
    return text;
  }

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
});
// 7
/**
 * Smart processing for ampersands and angle brackets that need to be encoded.
 */
registerParser("encodeAmpsAndAngles", function (text, options, globals) {
  "use strict";
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
});
// 8
/**
 * Returns the string, with after processing the following backslash escape sequences.
 *
 * attacklab: The polite way to do this is with the new escapeCharacters() function:
 *
 *    text = escapeCharacters(text,"\\",true);
 *    text = escapeCharacters(text,"`*_{}[]()>#+-.!",true);
 *
 * ...but we're sidestepping its use of the (slow) RegExp constructor
 * as an optimization for Firefox.  This function gets called a LOT.
 */
registerParser("encodeBackslashEscapes", function (text, options, globals) {
  "use strict";
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
});
//9
/**
 * Within tags -- meaning between < and > -- encode [\ ` * _ ~ =] so they
 * don't conflict with their use in Markdown for code, italics and strong.
 */
registerParser(
  "escapeSpecialCharsWithinTagAttributes",
  function (text, options, globals) {
    "use strict";
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
);
//10
registerParser("hashElement", function (text, options, globals) {
  "use strict";

  return function (wholeMatch, m1) {
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
});
//11
registerParser("italicsAndBold", function (text, options, globals) {
  "use strict";

  text = globals.converter
    ?._dispatch("italicsAndBold.before", text, options, globals)
    .getText() as string;

  // it's faster to have 3 separate regexes for each case than have just one
  // because of backtracing, in some cases, it could lead to an exponential effect
  // called "catastrophic backtrace". Ominous!

  function parseInside(txt, left, right) {
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

  // Now parse asterisks
  /*
      if (options.literalMidWordAsterisks) {
        text = text.replace(/([^*]|^)\B\*\*\*(\S[\s\S]+?)\*\*\*\B(?!\*)/g, function (wm, lead, txt) {
          return parseInside (txt, lead + '<strong><em>', '</em></strong>');
        });
        text = text.replace(/([^*]|^)\B\*\*(\S[\s\S]+?)\*\*\B(?!\*)/g, function (wm, lead, txt) {
          return parseInside (txt, lead + '<strong>', '</strong>');
        });
        text = text.replace(/([^*]|^)\B\*(\S[\s\S]+?)\*\B(?!\*)/g, function (wm, lead, txt) {
          return parseInside (txt, lead + '<em>', '</em>');
        });
      } else {
      */
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
});
//12
/**
 * Parse metadata at the top of the document
 */
registerParser("metadata", function (text, options, globals) {
  "use strict";

  if (!options.metadata) {
    return text;
  }

  text = globals.converter
    ?._dispatch("metadata.before", text, options, globals)
    .getText() as string;

  function parseMetadataContents(content) {
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
      function (wm: any, key: string | number, value: string | undefined) {
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
});
//13
registerParser("strikethrough", function (text, options, globals) {
  "use strict";

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
});
//14
registerParser("underline", function (text, options, globals) {
  "use strict";

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
});
//15
/**
 * Swap back in all the special characters we've hidden.
 */
registerParser("unescapeSpecialChars", function (text, options, globals) {
  "use strict";
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
});
//16
/**
 * Hash span elements that should not be parsed as markdown
 */
registerParser("hashHTMLSpans", function (text, options, globals) {
  "use strict";
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
});
//17
/**
 * Unhash HTML spans
 */
registerParser("unhashHTMLSpans", function (text, options, globals) {
  "use strict";
  text = globals.converter
    ?._dispatch("unhashHTMLSpans.before", text, options, globals)
    .getText() as string;

  for (var i = 0; i < globals.gHtmlSpans.length; ++i) {
    var repText = globals.gHtmlSpans[i],
      // limiter to prevent infinite loop (assume 10 as limit for recurse)
      limit = 0;

    while (/¨C(\d+)C/.test(repText)) {
      var num = RegExp.$1;
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
});

export { parsers };
