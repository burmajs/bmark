import type { GlobalConverter } from "./globals.js";
export const helpers = {
	escapeCharactersCallback(wholeMatch: any, m1: string) {
		var charCodeToEscape = m1.charCodeAt(0);
		return "¨E" + charCodeToEscape + "E";
	},
	isAbsolutePath(path: string) {
		// Absolute paths begin with '[protocol:]//' or '#' (anchors)
		return /(^([a-z]+:)?\/\/)|(^#)/i.test(path);
	},
	regexes: {
		asteriskDashTildeAndColon: /([*_:~])/g,
		asteriskDashAndTilde: /([*_~])/g,
	},
	_hashHTMLSpan(html: any, globals: GlobalConverter) {
		return "¨C" + (globals.gHtmlSpans.push(html) - 1) + "C";
	},
	replaceRecursiveRegExp(
		str: string,
		replacement: (arg0: any, arg1: any, arg2: any, arg3: any) => any,
		left: string | RegExp,
		right: string,
		flags: string,
	) {
		if (typeof replacement !== "function") {
			var repStr = replacement;
			replacement = () => repStr;
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
						str.slice(matchPos[i].right.start, matchPos[i].right.end),
					),
				);
				if (i < lng - 1) {
					bits.push(
						str.slice(
							matchPos[i].wholeMatch.end,
							matchPos[i + 1].wholeMatch.start,
						),
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
	regexIndexOf(
		str: string,
		regex: { [Symbol.search](string: string): number },
		fromIndex?: any,
	) {
		if (typeof str !== "string") {
			throw "InvalidArgumentError: first parameter of regexIndexOf function must be a string";
		}
		if (!(regex instanceof RegExp)) {
			throw "InvalidArgumentError: second parameter of regexIndexOf function must be an instance of RegExp";
		}
		var indexOf = str.substring(fromIndex || 0).search(regex);
		return indexOf >= 0 ? indexOf + (fromIndex || 0) : indexOf;
	},
	encodeEmailAddress(mail: string): string {
		return mail.replace(/[^\x00-\x7F]/g, (ch) => {
			const code = ch.charCodeAt(0);
			return `&#x${code.toString(16)};`;
		});
	},
	applyBaseUrl(baseUrl: any, url: string) {
		// Only prepend if given a base URL and the path is not absolute.
		if (baseUrl && !this.isAbsolutePath(url)) {
			var urlResolve = require("url").resolve;
			url = urlResolve(baseUrl, url);
		}

		return url;
	},
	splitAtIndex(str: string, index: number) {
		if (typeof str !== "string") {
			throw "InvalidArgumentError: first parameter of  splitAtIndexfunction must be a string";
		}
		return [str.substring(0, index), str.substring(index)];
	},
	stdExtName(extName: string) {
		return extName
			.replace(/[_?*+\/\\.^-]/g, "")
			.replace(/\s/g, "")
			.toLowerCase();
	},
	forEach(obj: any, callback: Function) {
		// check if obj is defined
		if (typeof obj === "undefined") {
			throw new Error("obj param is required");
		}

		if (typeof callback === "undefined") {
			throw new Error("callback param is required");
		}

		if (typeof callback !== "function") {
			throw new Error("callback param must be a function/closure");
		}

		if (typeof obj.forEach === "function") {
			obj.forEach(callback);
		} else if (Array.isArray(obj)) {
			for (var i = 0; i < obj.length; i++) {
				callback(obj[i], i, obj);
			}
		} else if (typeof obj === "object") {
			for (var prop in obj) {
				if (obj.hasOwnProperty(prop)) {
					callback(obj[prop], prop, obj);
				}
			}
		} else {
			throw new Error("obj does not seem to be an array or an iterable object");
		}
	},
};

const rgxFindMatchPos = (
	str: string,
	left: string | RegExp,
	right: string,
	flags: string,
) => {
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
