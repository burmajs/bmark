import { registerParser, runParser } from "../parser.js"; //2nd
import { helpers } from "../helpers.js";
import { parsers } from "./independents.js";
import { subParser } from "../../notes/index.js";

//18
/**
 * Process Markdown `<pre><code>` blocks.
 */
registerParser("codeBlocks", function (text, options, globals) {
  "use strict";

  text = globals.converter
    ?._dispatch("codeBlocks.before", text, options, globals)
    .getText() as string;

  // sentinel workarounds for lack of \A and \Z, safari\khtml bug
  text += "¨0";

  var pattern =
    /(?:\n\n|^)((?:(?:[ ]{4}|\t).*\n+)+)(\n*[ ]{0,3}[^ \t\n]|(?=¨0))/g;
  text = text.replace(pattern, function (wholeMatch, m1, m2) {
    var codeblock = m1,
      nextChar = m2,
      end = "\n";

    codeblock = runParser("outdent")(codeblock, options, globals);
    codeblock = runParser("encodeCode")(codeblock, options, globals);
    codeblock = runParser("detab")(codeblock, options, globals);
    codeblock = codeblock.replace(/^\n+/g, ""); // trim leading newlines
    codeblock = codeblock.replace(/\n+$/g, ""); // trim trailing newlines

    if (options.omitCodeBlocks) {
      end = "";
    }

    codeblock = "<pre><code>" + codeblock + end + "</code></pre>";

    return runParser("hashBlock")(codeblock, options, globals) + nextChar;
  });

  // strip sentinel
  text = text.replace(/¨0/, "");

  text = globals.converter
    ?._dispatch("codeBlocks.after", text, options, globals)
    .getText() as string;
  return text;
});
//19
/**
 *
 *   *  Backtick quotes are used for <code></code> spans.
 *
 *   *  You can use multiple backticks as the delimiters if you want to
 *     include literal backticks in the code span. So, this input:
 *
 *         Just type ``foo `bar` baz`` at the prompt.
 *
 *       Will translate to:
 *
 *         <p>Just type <code>foo `bar` baz</code> at the prompt.</p>
 *
 *    There's no arbitrary limit to the number of backticks you
 *    can use as delimters. If you need three consecutive backticks
 *    in your code, use four for delimiters, etc.
 *
 *  *  You can use spaces to get literal backticks at the edges:
 *
 *         ... type `` `bar` `` ...
 *
 *       Turns to:
 *
 *         ... type <code>`bar`</code> ...
 */
registerParser("codeSpans", function (text, options, globals) {
  "use strict";

  text = globals.converter
    ?._dispatch("codeSpans.before", text, options, globals)
    .getText() as string;

  if (typeof text === "undefined") {
    text = "";
  }
  text = text.replace(
    /(^|[^\\])(`+)([^\r]*?[^`])\2(?!`)/gm,
    function (wholeMatch, m1, m2, m3) {
      var c = m3;
      c = c.replace(/^([ \t]*)/g, ""); // leading whitespace
      c = c.replace(/[ \t]*$/g, ""); // trailing whitespace
      c = runParser("encodeCode")(c, options, globals);
      c = m1 + "<code>" + c + "</code>";
      c = runParser("hashHTMLSpans")(c, options, globals);
      return c;
    }
  );

  text = globals.converter
    ?._dispatch("codeSpans.after", text, options, globals)
    .getText() as string;
  return text;
});
//20
/**
 * Hash and escape <pre><code> elements that should not be parsed as markdown
 */
registerParser("hashPreCodeTags", function (text, options, globals) {
  "use strict";
  text = globals.converter
    ?._dispatch("hashPreCodeTags.before", text, options, globals)
    .getText() as string;

  var repFunc = function (wholeMatch, match, left, right) {
    // encode html entities
    var codeblock =
      left + subParser("encodeCode")(match, options, globals) + right;
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
});
//20
/**
 * Hash and escape <code> elements that should not be parsed as markdown
 */
registerParser("hashCodeTags", function (text, options, globals) {
  "use strict";
  text = globals.converter
    ?._dispatch("hashCodeTags.before", text, options, globals)
    .getText() as string;

  var repFunc = function (wholeMatch, match, left, right) {
    var codeblock =
      left + runParser("encodeCode")(match, options, globals) + right;
    return "¨C" + (globals.gHtmlSpans.push(codeblock) - 1) + "C";
  };

  // Hash naked <code>
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
});
//21
/**
 * Handle github codeblocks prior to running HashHTML so that
 * HTML contained within the codeblock gets escaped properly
 * Example:
 * ```ruby
 *     def hello_world(x)
 *       puts "Hello, #{x}"
 *     end
 * ```
 */
registerParser("githubCodeBlocks", function (text, options, globals) {
  "use strict";

  // early exit if option is not enabled
  if (!options.ghCodeBlocks) {
    return text;
  }

  text = globals.converter
    ?._dispatch("githubCodeBlocks.before", text, options, globals)
    .getText() as string;

  text += "¨0";

  text = text.replace(
    /(?:^|\n) {0,3}(```+|~~~+) *([^\n\t`~]*)\n([\s\S]*?)\n {0,3}\1/g,
    function (wholeMatch, delim, language, codeblock) {
      var end = options.omitCodeBlocks ? "" : "\n";

      // if the language has spaces followed by some other chars, according to the spec we should just ignore everything
      // after the first space
      language = language.trim().split(" ")[0];

      // First parse the github code block
      codeblock = runParser("encodeCode")(codeblock, options, globals);
      codeblock = runParser("detab")(codeblock, options, globals);
      codeblock = codeblock.replace(/^\n+/g, ""); // trim leading newlines
      codeblock = codeblock.replace(/\n+$/g, ""); // trim trailing whitespace

      codeblock =
        "<pre><code" +
        (language
          ? ' class="' + language + " language-" + language + '"'
          : "") +
        ">" +
        codeblock +
        end +
        "</code></pre>";

      codeblock = runParser("hashBlock")(codeblock, options, globals);

      // Since GHCodeblocks can be false positives, we need to
      // store the primitive text and the parsed text in a global var,
      // and then return a token
      return (
        "\n\n¨G" +
        (globals.ghCodeBlocks.push({ text: wholeMatch, codeblock: codeblock }) -
          1) +
        "G\n\n"
      );
    }
  );

  // attacklab: strip sentinel
  text = text.replace(/¨0/, "");

  return globals.converter
    ?._dispatch("githubCodeBlocks.after", text, options, globals)
    .getText() as string;
});

export { parsers };
