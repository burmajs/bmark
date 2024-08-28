import { _emoji } from "./emoji.js";
import { BmarkEvent } from "./event.js";
import type { HelpersTypes } from "../types.js";

export const helper: HelpersTypes = {
  /**
   * Check if var is string
   */
  isString(test: any): test is string {
    "use strict";
    return typeof test === "string";
  },
  /**
   * Check if var is a function
   */
  isFunction(test: any) {
    "use strict";
    return typeof test === "function";
  },
  /**
   * isArray helper function
   */
  isArray(test: any) {
    let isArray: ((arg: string) => boolean) | ((arg0: any) => any);
    if (!Array.isArray) {
      isArray = function (arg: string) {
        return Object.prototype.toString.call(arg) === "[object Array]";
      };
    } else {
      isArray = Array.isArray;
    }
    return isArray(test);
  },
  /**
   * Check if value is undefined
   *
   * input - The value to check.
   * Returns - `true` if `test` is `undefined`, else `false`.
   */
  isUndefined(test: any) {
    "use strict";
    return typeof test === "undefined";
  },
  /**
   * ForEach helper function
   * Iterates over Arrays and Objects (own properties only)
   * @static
   * @param {*} obj
   * @param {function} callback Accepts 3 params: 1. value, 2. key, 3. the original array/object
   */
  forEach(obj: any, callback: Function): void {
    "use strict";
    // check if obj is defined
    if (this.isUndefined(obj)) {
      throw new Error("obj param is required");
    }

    if (this.isUndefined(callback)) {
      throw new Error("callback param is required");
    }

    if (!this.isFunction(callback)) {
      throw new Error("callback param must be a function/closure");
    }

    if (typeof obj.forEach === "function") {
      obj.forEach(callback);
    } else if (this.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        callback(obj[i], i, obj);
      }
    } else if (typeof obj === "object") {
      for (let prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          callback(obj[prop], prop, obj);
        }
      }
    } else {
      throw new Error("obj does not seem to be an array or an iterable object");
    }
  },
  /**
   * Standardidize extension name
   * @static
   * @param {string} s extension name
   * @returns {string}
   */
  stdExtName(s: string): string {
    "use strict";
    return s
      .replace(/[_?*+\/\\.^-]/g, "")
      .replace(/\s/g, "")
      .toLowerCase();
  },
  /**
   * Callback used to escape characters when passing through String.replace
   * @static
   * @param {string} wholeMatch
   * @param {string} m1
   * @returns {string}
   */
  escapeCharactersCallback(wholeMatch: any, m1: any): string {
    "use strict";
    const charCodeToEscape = m1.charCodeAt(0);
    return "¨E" + charCodeToEscape + "E";
  },
  /**
   * Escape characters in a string
   */
  escapeCharacters(
    text: string,
    charsToEscape: string,
    afterBackslash: boolean
  ) {
    "use strict";
    // First we have to escape the escape characters so that
    // we can build a character class out of them
    var regexString =
      "([" + charsToEscape.replace(/([\[\]\\])/g, "\\$1") + "])";

    if (afterBackslash) {
      regexString = "\\\\" + regexString;
    }

    var regex = new RegExp(regexString, "g");
    text = text.replace(regex, this.escapeCharactersCallback);

    return text;
  },
  /**
   * matchRecursiveRegExp
   *
   * (c) 2007 Steven Levithan <stevenlevithan.com>
   * MIT License
   *
   * Accepts a string to search, a left and right format delimiter
   * as regex patterns, and optional regex flags. Returns an array
   * of matches, allowing nested instances of left/right delimiters.
   * Use the "g" flag to return all matches, otherwise only the
   * first is returned. Be careful to ensure that the left and
   * right format delimiters produce mutually exclusive matches.
   * Backreferences are not supported within the right delimiter
   * due to how it is internally combined with the left delimiter.
   * When matching strings whose format delimiters are unbalanced
   * to the left or right, the output is intentionally as a
   * conventional regex library with recursion support would
   * produce, e.g. "<<x>" and "<x>>" both produce ["x"] when using
   * "<" and ">" as the delimiters (both strings contain a single,
   * balanced instance of "<x>").
   *
   * examples:
   *
   * ```js
   * matchRecursiveRegExp("test", "\\(", "\\)")
   * returns: []
   * matchRecursiveRegExp("<t<<e>><s>>t<>", "<", ">", "g")
   * returns: ["t<<e>><s>", ""]
   * matchRecursiveRegExp("<div id=\"x\">test</div>", "<div\\b[^>]*>", "</div>", "gi")
   * returns: ["test"]
   * ```
   */
  matchRecursiveRegExp(str: any, left: any, right: any, flags: any): any[][] {
    "use strict";

    const matchPos = rgxFindMatchPos(str, left, right, flags),
      results = [];

    for (let i = 0; i < matchPos.length; ++i) {
      results.push([
        str.slice(matchPos[i].wholeMatch.start, matchPos[i].wholeMatch.end),
        str.slice(matchPos[i].match.start, matchPos[i].match.end),
        str.slice(matchPos[i].left.start, matchPos[i].left.end),
        str.slice(matchPos[i].right.start, matchPos[i].right.end),
      ]);
    }
    return results;
  },
  replaceRecursiveRegExp(
    str: string,
    replacement: string | Function,
    left: string,
    right: string,
    flags: string
  ): string {
    "use strict";

    if (!this.isFunction(replacement)) {
      const repStr = replacement;
      replacement = function () {
        return repStr;
      };
    }

    const matchPos = rgxFindMatchPos(str, left, right, flags);
    let finalStr = str;
    const lng = matchPos.length;

    if (lng > 0) {
      let bits = [];
      if (matchPos[0].wholeMatch.start !== 0) {
        bits.push(str.slice(0, matchPos[0].wholeMatch.start));
      }
      for (let i = 0; i < lng; ++i) {
        bits.push(
          (replacement as Function)(
            str.slice(matchPos[i].wholeMatch.start, matchPos[i].wholeMatch.end),
            str.slice(matchPos[i].match.start, matchPos[i].match.end),
            str.slice(matchPos[i].left.start, matchPos[i].left.end),
            str.slice(matchPos[i].right.start, matchPos[i].right.end)
          )
        );
        if (i < lng - 1) {
          bits.push(
            str.slice(
              matchPos[i].wholeMatch.end,
              matchPos[i + 1].wholeMatch.start
            )
          );
        }
      }
      if (matchPos[lng - 1].wholeMatch.end < str.length) {
        bits.push(str.slice(matchPos[lng - 1].wholeMatch.end));
      }
      finalStr = bits.join("");
    }
    return finalStr;
  },
  /**
   * Returns the index within the passed String object of the first occurrence of the specified regex,
   * starting the search at fromIndex. Returns -1 if the value is not found.
   *
   * @param {string} str string to search
   * @param {RegExp} regex Regular expression to search
   * @param {int} [fromIndex = 0] Index to start the search
   * @returns {Number}
   * @throws InvalidArgumentError
   */
  regexIndexOf(str: string, regex: RegExp, fromIndex?: any): number {
    "use strict";
    if (!this.isString(str)) {
      throw "InvalidArgumentError: first parameter of `regexIndexOf` method must be a string";
    }
    if (!(regex instanceof RegExp)) {
      throw "InvalidArgumentError: second parameter of `regexIndexOf` method must be an instance of RegExp";
    }
    var indexOf = str.substring(fromIndex || 0).search(regex);
    return indexOf >= 0 ? indexOf + (fromIndex || 0) : indexOf;
  },
  /**
   * Splits the passed string object at the defined index, and returns an array composed of the two substrings
   * @param {string} str string to split
   * @param {int} index index to split string at
   * @returns {[string,string]}
   * @throws InvalidArgumentError
   */
  splitAtIndex(str: string, index: number): [string, string] {
    "use strict";
    if (!this.isString(str)) {
      throw "InvalidArgumentError: first parameter of `splitAtIndex` method must be a string";
    }
    return [str.substring(0, index), str.substring(index)];
  },
  // RNG seeded with mail, so that we can get determined results for each email.
  encodeEmailAddress(mail: string): string {
    "use strict";
    const encode = [
      function (ch: { charCodeAt: (arg0: number) => string }) {
        return "&#" + ch.charCodeAt(0) + ";";
      },
      function (ch: {
        charCodeAt: (arg0: number) => {
          (): any;
          new (): any;
          toString: { (arg0: number): string; new (): any };
        };
      }) {
        return "&#x" + ch.charCodeAt(0).toString(16) + ";";
      },
      function (ch: any) {
        return ch;
      },
    ];
    const rand = mulberry32(xmur3(mail));
    mail = mail.replace(/./g, function (ch) {
      if (ch === "@") {
        // this *must* be encoded. I insist.
        ch = encode[Math.floor(rand * 2)](ch);
      } else {
        let r = rand;
        // roughly 10% raw, 45% hex, 45% dec
        ch = r > 0.9 ? encode[2](ch) : r > 0.45 ? encode[1](ch) : encode[0](ch);
      }
      return ch;
    });

    return mail;
  },
  repeat(str: string, count: number): string {
    "use strict";
    // use built-in method if it's available
    if (!this.isUndefined(String.prototype.repeat)) {
      return str.repeat(count);
    }
    str = "" + str;
    if (count < 0) {
      throw new RangeError("repeat count must be non-negative");
    }
    if (count === Infinity) {
      throw new RangeError("repeat count must be less than infinity");
    }
    count = Math.floor(count);
    if (str.length === 0 || count === 0) {
      return "";
    }
    // Ensuring count is a 31-bit integer allows us to heavily optimize the
    // main part. But anyway, most current (August 2014) browsers can't handle
    // strings 1 << 28 chars or longer, so:
    /*jshint bitwise: false*/
    if (str.length * count >= 1 << 28) {
      throw new RangeError(
        "repeat count must not overflow maximum string size"
      );
    }
    /*jshint bitwise: true*/
    var maxCount = str.length * count;
    count = Math.floor(Math.log(count) / Math.log(2));
    while (count) {
      str += str;
      count--;
    }
    str += str.substring(0, maxCount - str.length);
    return str;
  },
  /**
   * String.prototype.padEnd polyfill
   *
   * @param {string} str
   * @param {int} targetLength
   * @param {string} [padString]
   * @returns {string}
   */
  padEnd(
    str: string,
    targetLength: number,
    padString?: string | undefined
  ): string {
    "use strict";
    targetLength = targetLength >> 0; //floor if number or convert non-number to 0;
    if (str.length > targetLength) {
      return String(str);
    } else {
      targetLength = targetLength - str.length;
      const aa = padString as string;
      if (targetLength > aa.length) {
        padString += this.repeat(aa, targetLength / aa.length); //append to original to ensure we are longer than needed
      }
      return String(str) + aa.slice(0, targetLength);
    }
  },
  /**
   * Unescape HTML entities
   * @param txt
   * @returns {string}
   */
  unescapeHTMLEntities(txt: any): string {
    "use strict";

    return txt
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");
  },
  _hashHTMLSpan(html: any, globals: any): string {
    return "¨C" + (globals.gHtmlSpans.push(html) - 1) + "C";
  },
  /**
   * Prepends a base URL to relative paths.
   *
   * @param {string} baseUrl the base URL to prepend to a relative path
   * @param {string} url the path to modify, which may be relative
   * @returns {string} the full URL
   */
  applyBaseUrl(baseUrl: string, url: string): string {
    // Only prepend if given a base URL and the path is not absolute.
    if (baseUrl && !this.isAbsolutePath(url)) {
      var urlResolve = require("url").resolve;
      url = urlResolve(baseUrl, url);
    }

    return url;
  },
  /**
   * Checks if the given path is absolute.
   *
   * @param {string} path the path to test for absolution
   * @returns {boolean} `true` if the given path is absolute, else `false`
   */
  isAbsolutePath(path: string): boolean {
    // Absolute paths begin with '[protocol:]//' or '#' (anchors)
    return /(^([a-z]+:)?\/\/)|(^#)/i.test(path);
  },

  /**
   * Common regexes.
   * We declare some common regexes to improve performance
   */
  regexes: {
    asteriskDashTildeAndColon: /([*_:~])/g,
    asteriskDashAndTilde: /([*_~])/g,
  },
  Event: BmarkEvent,
  emoji: _emoji,
};
// ========================================================================================================
/**
 * POLYFILLS
 */
// use this instead of builtin is undefined for IE8 compatibility
type _Console = Partial<Console>;
let console: _Console = {};
if (typeof console === "undefined") {
  console = {
    warn: function (msg) {
      "use strict";
      alert(msg);
    },
    log: function (msg) {
      "use strict";
      alert(msg);
    },
    error: function (msg) {
      "use strict";
      throw msg;
    },
  };
}

// Math.imul() polyfill
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul
if (!Math.imul) {
  Math.imul = function (opA, opB) {
    opB |= 0; // ensure that opB is an integer. opA will automatically be coerced.
    // floating points give us 53 bits of precision to work with plus 1 sign bit
    // automatically handled for our convienence:
    // 1. 0x003fffff /*opA & 0x000fffff*/ * 0x7fffffff /*opB*/ = 0x1fffff7fc00001
    //    0x1fffff7fc00001 < Number.MAX_SAFE_INTEGER /*0x1fffffffffffff*/
    var result = (opA & 0x003fffff) * opB;
    // 2. We can remove an integer coersion from the statement above because:
    //    0x1fffff7fc00001 + 0xffc00000 = 0x1fffffff800001
    //    0x1fffffff800001 < Number.MAX_SAFE_INTEGER /*0x1fffffffffffff*/
    if (opA & 0xffc00000 /*!== 0*/) {
      result += ((opA & 0xffc00000) * opB) | 0;
    }
    return result | 0;
  };
}
function rgxFindMatchPos(
  str: any,
  left: any,
  right: any,
  flags: any
): {
  left: {
    start: number | undefined;
    end: number | undefined;
  };
  match: {
    start: number | undefined;
    end: number;
  };
  right: {
    start: number;
    end: number;
  };
  wholeMatch: {
    start: number | undefined;
    end: number;
  };
}[] {
  "use strict";
  let f = flags || "";
  let g = f.indexOf("g") > -1;
  let x = new RegExp(left + "|" + right, "g" + f.replace(/g/g, ""));
  let l = new RegExp(left, f.replace(/g/g, ""));
  let pos = [];
  let t: any;
  let s: any;
  let m: any;
  let start: any;
  let end: any;

  do {
    t = 0;
    while ((m = x.exec(str))) {
      if (l.test(m[0])) {
        if (!t++) {
          s = x.lastIndex;
          start = s - m[0].length;
        }
      } else if (t) {
        if (!--t) {
          end = m.index + m[0].length;
          var obj = {
            left: { start: start, end: s },
            match: { start: s, end: m.index },
            right: { start: m.index, end: end },
            wholeMatch: { start: start, end: end },
          };
          pos.push(obj);
          if (!g) {
            return pos;
          }
        }
      }
    }
  } while (t && (x.lastIndex = s));

  return pos;
}

/**
 * MurmurHash3's mixing function
 * https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript/47593316#47593316
 *
 */
function xmur3(str: string): number {
  for (var i = 0, h = 1779033703 ^ str.length; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  const aa = () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
  return aa();
}

/**
 * Random Number Generator
 * https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript/47593316#47593316
 *
 */

function mulberry32(a: number): number {
  let t = (a += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
