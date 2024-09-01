import { type GlobalConverter } from "./globals.js";
export const helpers = {
  escapeCharactersCallback(wholeMatch: any, m1: string) {
    "use strict";
    var charCodeToEscape = m1.charCodeAt(0);
    return "¨E" + charCodeToEscape + "E";
  },
  _hashHTMLSpan(html: any, globals: GlobalConverter) {
    return "¨C" + (globals.gHtmlSpans.push(html) - 1) + "C";
  },
  replaceRecursiveRegExp(
    str: string,
    replacement: (arg0: any, arg1: any, arg2: any, arg3: any) => any,
    left: string | RegExp,
    right: string,
    flags: string
  ) {
    "use strict";

    if (typeof replacement !== "function") {
      var repStr = replacement;
      replacement = function () {
        return repStr;
      };
    }

    var matchPos = rgxFindMatchPos(str, left, right, flags),
      finalStr = str,
      lng = matchPos.length;

    if (lng > 0) {
      var bits = [];
      if (matchPos[0].wholeMatch.start !== 0) {
        bits.push(str.slice(0, matchPos[0].wholeMatch.start));
      }
      for (var i = 0; i < lng; ++i) {
        bits.push(
          replacement(
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
};

const rgxFindMatchPos = (
  str: string,
  left: string | RegExp,
  right: string,
  flags: string
) => {
  "use strict";
  var f = flags || "",
    g = f.indexOf("g") > -1,
    x = new RegExp(left + "|" + right, "g" + f.replace(/g/g, "")),
    l = new RegExp(left, f.replace(/g/g, "")),
    pos = [],
    t,
    s,
    m,
    start,
    end;
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
  } while (t && (x.lastIndex = s as number));

  return pos;
};
