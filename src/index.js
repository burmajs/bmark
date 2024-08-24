const mark = () => {
  const mdBlockSyntax = (argObj) => {
    const delimiter = argObj.config.delimiter;
    const mathDelimiter = argObj.config.mathDelimiter;
    const codeLangPrefix = argObj.config.codeLangPrefix;
    const spacesForNest = argObj.config.spacesForNest;
    const latexEnv = argObj.config.latexEnv;
    const cArray = new Array();
    // The order is important.
    /* CB */
    cArray.push({
      // Code block with code name
      tag: "CB",
      priority: 100,
      matchRegex: /^`{3}.*?\n[\s\S]*?\n`{3}$/gm,
      converter: (argBlock) => {
        const temp = argBlock.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        if (/^`{3}.+$/m.test(argBlock)) {
          return temp.replace(
            /^`{3}(.+?)\n([\s\S]*)\n`{3}$/,

            `<pre><code class="${codeLangPrefix}$1">$2</code></pre>`
          );
        } else {
          return temp.replace(
            /^`{3}\n([\s\S]*)\n`{3}$/,
            "<pre><code>$1</code></pre>"
          );
        }
      },
      matchedString: new Array(),
    });
    /*Math Environment*/
    var mathRegEx = "";
    for (let jj = 0; jj < (latexEnv || []).length; jj++) {
      mathRegEx +=
        "^\\\\begin{" +
        latexEnv[jj] +
        "} *.*$\\n(^ *.+ *$\\n)*^[ .]*\\\\end{" +
        latexEnv[jj] +
        "} *$|";
    }
    mathRegEx = mathRegEx.replace(/\|$/, "");
    /* ME */
    cArray.push({
      tag: "ME",
      priority: 85,
      matchRegex: new RegExp(mathRegEx, "gm"),
      converter: (argBlock) => '<div class="mdpmath">' + argBlock + "</div>",
      matchedString: new Array(),
    });
    /* Math blocks */
    var mathRegEx = "";
    for (let jj = 0; jj < (mathDelimiter || []).length; jj++) {
      mathRegEx +=
        "^" +
        mathDelimiter[jj][0] +
        " *.*$\\n(^ *.+ *$\\n)*^[ .]*" +
        mathDelimiter[jj][1] +
        "$|";
    }
    mathRegEx = mathRegEx.replace(/\|$/, "");
    /* MB */
    cArray.push({
      tag: "MB",
      priority: 80,
      matchRegex: new RegExp(mathRegEx, "gm"),
      converter: (argBlock) =>
        '<div class="mdpmath">' + argBlock.replace(/^\n*|\n*$/g, "") + "</div>",
      matchedString: new Array(),
    });
    /* HTML comment block */
    cArray.push({
      tag: "CM",
      priority: 70,
      matchRegex: /^<!--[\s\S]*?-->$/gm,
      converter: (argBlock) => argBlock.replace(/^(<!--[\s\S]*?-->)$/, "$1"),
      matchedString: new Array(),
    });
    /* HD */
    cArray.push({
      tag: "HD",
      priority: 60,
      provisionalText: "\n" + delimiter + "HD" + delimiter + "\n", // to divide list, \n is added.
      matchRegex: /^#{1,} +.+$/gm,
      converter: (argBlock) => {
        var num = argBlock.match(/^#{1,}(?= )/)[0].length;
        var temp = argBlock
          .replace(/"/g, "")
          .replace(
            /^\n*#{1,} +(.+?)[\s#]*$/,
            "<h" + num + ' id="$1">$1</h' + num + ">"
          );
        return Obj.mdInlineParser(temp);
      },
      matchedString: new Array(),
    });
    /* Horizontal Rule */
    cArray.push({
      tag: "HR",
      priority: 50,
      provisionalText: "\n" + delimiter + "HR" + delimiter + "\n", // to divide list, \n is added.
      matchRegex: /^ *[-+*=] *[-+*=] *[-+*=][-+*= ]*$/gm,
      converter: (argBlock) => "<hr>",
      matchedString: new Array(),
    });
    /*   Blockquote*/
    cArray.push({
      tag: "BQ",
      priority: 40,
      matchRegex: /^ *> *[\s\S]*?(?=\n\n)/gm,
      converter: (argBlock) => {
        var temp = argBlock.replace(/^\n*([\s\S]*)\n*$/, "$1");
        return Obj.mdInlineParser(Obj.mdBlockquoteParser(temp));
      },
      matchedString: new Array(),
    });
    /* Table */
    cArray.push({
      tag: "TB",
      priority: 30,
      matchRegex: /^\|.+?\| *\n\|[-:| ]*\| *\n\|.+?\|[\s\S]*?(?=\n\n)/gm,
      converter: (argBlock) => {
        argBlock = Obj.mdInlineParserFormer(argBlock);
        var temp = argBlock.replace(/^\n*([\s\S]*)\n*$/, "$1");
        return Obj.mdInlineParserLatter(Obj.mdTBParser(temp));
      },
      matchedString: new Array(),
    });
    /* List */
    cArray.push({
      tag: "LT",
      priority: 20,
      matchRegex: new RegExp(
        "^ *\\d+?\\. [\\s\\S]*?$(?!\\n\\s*^ *\\d+?\\. |\\n\\s*^ {2,}.+$)(?=\\n\\n)" +
          "|" +
          "^ *[-+*] [\\s\\S]*?$(?!\\n\\s*^ *[-+*] |\\n\\s*^ {2,}.+$)(?=\\n\\n)",
        "gm"
      ),
      converter: (argBlock) => {
        var temp = argBlock.replace(/^\n*([\s\S]*)\n*$/, "$1");
        return Obj.mdInlineParser(Obj.mdListParser(temp, spacesForNest));
      },
      matchedString: new Array(),
    });
    // Paragraph
    cArray.push({
      tag: "PP",
      priority: 0,
      matchRegex: new RegExp(
        "^.(?!" + delimiter[0] + ".{2}" + delimiter + ")[\\s\\S]*?\\n$",
        "gm"
      ),
      converter: (argBlock) => {
        var temp = "<p>" + argBlock.replace(/^\n*|\n*$/g, "") + "</p>";
        return Obj.mdInlineParser(temp);
      },
      matchedString: new Array(),
    });
    return cArray;
  };
  //====================================
  const mdInlineSyntax = (argObj) => {
    const subsDollar = argObj.config.subsDollar;
    const cArray = new Array();
    // inline code
    cArray.push({
      tag: "IC",
      priority: 100,
      matchRegex: /`.+?`/g,
      converter: (argBlock) =>
        "<code>" +
        argBlock
          .replace(/`(.+?)`/g, "$1")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;") +
        "</code>",
      matchedString: new Array(),
    });
    // inline math
    cArray.push({
      tag: "IM",
      priority: 90,
      matchRegex: new RegExp(subsDollar + ".+?" + subsDollar, "g"),
      converter: (argBlock) => '<span class="mdpmath">' + argBlock + "</span>",
      matchedString: new Array(),
    });
    // math reference
    cArray.push({
      tag: "RF",
      priority: 70,
      provisionalText: '<span class="mdpmath">\\$1ref{$2}</span>',
      matchRegex: /\\(eq)?ref{(.*)}/g,
      converter: (argBlock) => null,
      matchedString: new Array(),
    });
    // img
    cArray.push({
      tag: "IG",
      priority: 60,
      provisionalText: '<img src="$2" alt="$1">',
      matchRegex: /!\[(.*?)\]\((.+?)\)/g,
      converter: (argBlock) => null,
      matchedString: new Array(),
    });
    // Anchor Link
    cArray.push({
      tag: "AC", // Just for use array management.
      priority: 50,
      provisionalText: '<a href="$2">$1</a>', // the string is used for replace.
      matchRegex: /\[(.+?)\]\((.+?)\)/g, // the RexExp is used for replace.
      converter: (argBlock) => null,
      matchedString: new Array(),
    });
    // Strong
    cArray.push({
      tag: "SO", // Just for use array management.
      priority: 40,
      provisionalText: "<strong>$1</strong>",
      matchRegex: /\*\*(.+?)\*\*/g,
      converter: (argBlock) => null,
      matchedString: new Array(),
    });
    // Emphasize
    cArray.push({
      tag: "EM", // Just for use array management.
      priority: 30,
      provisionalText: "<em>$1</em>",
      matchRegex: /\*(.+?)\*/g,
      converter: (argBlock) => null,
      matchedString: new Array(),
    });
    // Strike
    cArray.push({
      tag: "SI", // Just for use array management.
      priority: 20,
      provisionalText: "<strike>$1</strike>",
      matchRegex: /~~(.+?)~~/g,
      converter: (argBlock) => null,
      matchedString: new Array(),
    });
    return cArray;
  };
  //=========================================================================================================
  const Obj = {
    config: {
      delimiter: "&&", // delimiter for structure expression
      subsDollar: "&MDPDL&",
      mathDelimiter: new Array(["$$", "$$"], ["\\\\\\[", "\\\\\\]"]),
      // in Regex form, = "$$ ... $$", and "\[ ... \]"
      latexEnv: new Array("equation", "eqnarray", "align", "align\\*"),
      spacesForNest: 2, // number of spaces for nested lists.
      codeLangPrefix: "language-", // ```clang ... ``` -> <pre><code class="language-clang"> ... </code></pre>
      tabTo: "  ", // \t -> two spaces
    },
    blockSyntax: new Array(),
    inlineSyntax: new Array(),
    addBlockSyntax: (argSyntax) => {
      if (argSyntax.tag == null || argSyntax.tag == "") {
        console.log("tag is required.");
        return false;
      }
      if (!Number.isInteger(argSyntax.priority)) {
        console.log("priority should be integer from 0 to 100.");
        return false;
      }
      argSyntax.priority = Math.min(100, argSyntax.priority);
      argSyntax.priority = Math.max(0, argSyntax.priority);
      Obj.removeBlockSyntax(argSyntax.tag);
      for (let ii = 0; ii < (Obj.blockSyntax || []).length; ii++) {
        if (argSyntax.priority > Obj.blockSyntax[ii].priority) {
          Obj.blockSyntax.splice(ii, 0, argSyntax);
          return true;
        }
      }
      return false;
    },
    removeBlockSyntax: (argTag) => {
      for (let ii = 0; ii < (Obj.blockSyntax || []).length; ii++)
        if (Obj.blockSyntax[ii].tag == argTag) {
          Obj.blockSyntax.splice(ii, 1);
          return true;
        }
      return false;
    },
    addInlineSyntax: (argSyntax) => {
      if (argSyntax.tag == null || argSyntax.tag == "") {
        console.log("tag is required.");
        return false;
      }
      if (!Number.isInteger(argSyntax.priority)) {
        console.log("priority should be integer from 0 to 100.");
        return false;
      }
      argSyntax.priority = Math.min(100, argSyntax.priority);
      argSyntax.priority = Math.max(0, argSyntax.priority);
      Obj.removeInlineSyntax(argSyntax.tag);
      for (let ii = 0; ii < (Obj.inlineSyntax || []).length; ii++) {
        if (argSyntax.priority > Obj.inlineSyntax[ii].priority) {
          Obj.inlineSyntax.splice(ii, 0, argSyntax);
          return true;
        }
      }
      return false;
    },
    removeInlineSyntax: (argTag) => {
      for (let ii = 0; ii < (Obj.inlineSyntax || []).length; ii++)
        if (Obj.inlineSyntax[ii].tag == argTag) {
          Obj.inlineSyntax.splice(ii, 1);
          return true;
        }
      return false;
    },
    mdInlineParserFormer: (argText) => {
      const cAr = Obj.inlineSyntax;
      for (let ii = 0; ii < (cAr || []).length; ii++) {
        cAr[ii].matchedString = argText.match(cAr[ii].matchRegex);
        for (let jj = 0; jj < (cAr[ii].matchedString || []).length; jj++) {
          cAr[ii].matchedString[jj] = cAr[ii].converter(
            cAr[ii].matchedString[jj]
          );
        }
        if (typeof cAr[ii].provisionalText == "undefined")
          cAr[ii].provisionalText =
            Obj.config.delimiter +
            Obj.config.delimiter +
            cAr[ii].tag +
            Obj.config.delimiter +
            Obj.config.delimiter;
        argText = argText.replace(cAr[ii].matchRegex, cAr[ii].provisionalText);
      }
      return argText;
    },
    mdInlineParserLatter: (argText) => {
      const delimiter = Obj.config.delimiter;
      const cAr = Obj.inlineSyntax;
      for (let ii = 0; ii < (cAr || []).length; ii++) {
        for (let jj = 0; jj < (cAr[ii].matchedString || []).length; jj++) {
          argText = argText.replace(
            delimiter + delimiter + cAr[ii].tag + delimiter + delimiter,
            cAr[ii].matchedString[jj]
          );
        }
      }
      return argText;
    },
    mdInlineParser: (argText) => {
      argText = Obj.mdInlineParserFormer(argText);
      return Obj.mdInlineParserLatter(argText);
    },
    mdTBParser: (argText) => {
      let retText = "";
      const lineText = argText.split(/\n/);
      // For 2nd line
      let items = lineText[1]
        .replace(/^\|\s*/, "")
        .replace(/\s*\|$/, "")
        .split(/\s*\|\s*/g);
      const alignText = new Array();
      for (let jj = 0; jj < items.length; jj++)
        if (/^:[\s-]+:$/.test(items[jj]))
          alignText.push(" style='text-align:center'"); // center align
        else if (/^:[\s-]+$/.test(items[jj]))
          alignText.push(" style='text-align:left'"); // left align
        else if (/^[\s-]+:$/.test(items[jj]))
          alignText.push(" style='text-align:right'"); // right align
        else alignText.push("");
      // For 1st line
      retText = "<table>\n";
      retText += "<thead><tr>\n";
      items = lineText[0]
        .replace(/^\|\s*/, "")
        .replace(/\s*\|$/, "")
        .split(/\s*\|\s*/g);
      for (let jj = 0; jj < alignText.length; jj++)
        retText += "<th" + alignText[jj] + ">" + items[jj] + "</th>\n";
      // For 3rd and more
      retText += "</tr></thead>\n";
      retText += "<tbody>\n";
      for (let kk = 2; kk < lineText.length; kk++) {
        lineText[kk] = lineText[kk].replace(/^\|\s*/, "");
        items = lineText[kk].split(/\s*\|+\s*/g);
        const colDivText = lineText[kk].replace(/\s/g, "").match(/\|+/g);
        retText += "<tr>\n";
        let num = 0;
        for (let jj = 0; jj < (colDivText || []).length; jj++) {
          if (colDivText[jj] == "|") {
            retText += "<td" + alignText[num] + ">" + items[jj] + "</td>\n";
            num += 1;
          } else {
            retText +=
              "<td" +
              alignText[num] +
              " colspan='" +
              colDivText[jj].length +
              "'>" +
              items[jj] +
              "</td>\n";
            num += colDivText[jj].length;
          }
        }
        retText += "</tr>\n";
      }
      retText += "</tbody></table>";
      return retText;
    },
    mdListParser: (argText, spacesForNest) => {
      const checkListDepth = (argLine) => {
        const listType = checkListType(argLine);
        let spaceRegex;
        if (listType == "OL") spaceRegex = /^\s*?(?=\d+\.\s+.*?$)/;
        else spaceRegex = /^\s*?(?=[-+*]\s+.*?$)/;
        let depth;
        const spaceText = argLine.match(spaceRegex);
        if (spaceText == null) depth = 0;
        else depth = spaceText[0].length;
        return depth;
      };
      const checkListType = (argLine) => {
        argLine = argLine.replace(/\n/g, "");
        const olRegex = /^\s*?\d+\.\s+.*?$/;
        const ulRegex = /^\s*?[-+*]\s+.*?$/;
        if (olRegex.test(argLine)) return "OL";
        else if (ulRegex.test(argLine)) return "UL";
        else return "RW";
      };
      let loose;
      if (/^ *$/m.test(argText)) loose = true;
      else loose = false;
      const lines = argText.split(/\n/g);
      const depth = checkListDepth(lines[0]);
      const listType = checkListType(lines[0]);
      let retText = "";
      let listRegex;
      if (listType == "OL") listRegex = /^\s*?\d+\.\s+(.*?)$/;
      else listRegex = /^\s*?[-+*]\s+(.*?)$/;
      retText += "<" + listType.toLowerCase() + "><li>";
      let lineDepth, lineType;
      let tempText = "";
      for (let jj = 0; jj < (lines || []).length; jj++) {
        lineDepth = checkListDepth(lines[jj]);
        lineType = checkListType(lines[jj]);
        if (lineDepth == depth && lineType == listType) {
          // add new item
          if (tempText != "") {
            retText += Obj.mdListParser(
              tempText.replace(/\n*$/, ""),
              spacesForNest
            ).replace(/\n*$/, "");
            tempText = "";
          }
          if (loose)
            retText +=
              "</li>\n<li><p>" + lines[jj].replace(listRegex, "$1") + "</p>\n";
          else
            retText +=
              "</li>\n<li>" + lines[jj].replace(listRegex, "$1") + "\n";
        } else if (lineDepth >= depth + Obj.config.spacesForNest) {
          // create nested list
          tempText += lines[jj] + "\n";
        } else {
          // simple paragraph
          if (tempText != "") {
            tempText += lines[jj] + "\n";
          } else {
            if (loose) retText += "<p>" + lines[jj] + "</p>\n";
            else retText += lines[jj] + "\n";
          }
        }
      }
      if (tempText != "") {
        retText += Obj.mdListParser(
          tempText.replace(/\n*$/, ""),
          spacesForNest
        ).replace(/\n*$/, "");
      }

      retText += "</li></" + listType.toLowerCase() + ">";
      return retText.replace(/<li>\n*<\/li>/g, "");
    },
    mdBlockquoteParser: (argText) => {
      let retText = "<blockquote>\n";
      argText = argText.replace(/\n\s*(?=[^>])/g, " ");
      argText = argText.replace(/^\s*>\s*/, "").replace(/\n\s*>\s*/g, "\n");
      const lineText = argText.split(/\n/);
      let tempText = "";
      for (let kk = 0; kk < (lineText || []).length; kk++) {
        if (/^\s*>\s*/.test(lineText[kk])) {
          tempText += lineText[kk] + "\n";
        } else {
          if (tempText != "") {
            retText += Obj.mdBlockquoteParser(tempText) + "\n";
            tempText = "";
          }
          retText += lineText[kk] + "\n";
        }
      }
      if (tempText != "") retText += Obj.mdBlockquoteParser(tempText);
      return retText + "\n</blockquote>";
    },
    analyzeStructure: (argText) => {
      const cAr = Obj.blockSyntax;
      // pre-formatting
      argText = argText.replace(/\r\n?/g, "\n"); // Commonize line break codes between Win and mac.
      argText = argText.replace(/\t/g, Obj.config.tabTo);
      argText = argText.replace(/\$/g, Obj.config.subsDollar);
      argText = "\n" + argText + "\n\n";

      // Convert to Structure Notation
      for (let ii = 0; ii < (cAr || []).length; ii++) {
        cAr[ii].matchedString = argText.match(cAr[ii].matchRegex);
        if (typeof cAr[ii].provisionalText == "undefined")
          cAr[ii].provisionalText =
            Obj.config.delimiter + cAr[ii].tag + Obj.config.delimiter;
        argText = argText.replace(cAr[ii].matchRegex, cAr[ii].provisionalText);
      }
      argText = argText.replace(/\n{2,}/g, "\n");
      // console.log(argText);	// to see structure
      return argText;
    },
    render: (argText) => {
      const cAr = Obj.blockSyntax;
      const delimiter = Obj.config.delimiter;

      argText = Obj.analyzeStructure(argText);

      // Restore to html
      for (let ii = (cAr || []).length - 1; ii >= 0; ii--) {
        for (let jj = 0; jj < (cAr[ii].matchedString || []).length; jj++) {
          argText = argText.replace(
            delimiter + cAr[ii].tag + delimiter,
            cAr[ii].converter(cAr[ii].matchedString[jj])
          );
        }
      }
      argText = argText.replace(new RegExp(Obj.config.subsDollar, "g"), "$");
      return argText;
    },
  };
  // ================================================================================
  // Assuming Obj is an instance of a class that has a config property of type Config
  if (typeof argConfig !== "undefined") {
    const keys = Object.keys(argConfig);
    for (let ii = 0; ii < (keys || []).length; ii++) {
      Obj.config[keys[ii]] = argConfig[keys[ii]];
    }
  }

  for (let ii = 0; ii < (Obj.config.mathDelimiter || []).length; ii++) {
    for (let jj = 0; jj < (Obj.config.mathDelimiter[ii] || []).length; jj++) {
      Obj.config.mathDelimiter[ii][jj] = Obj.config.mathDelimiter[ii][
        jj
      ].replace(/\$/g, Obj.config.subsDollar);
    }
  }
  //========================================================================================
  Obj.blockSyntax = mdBlockSyntax(Obj);
  Obj.inlineSyntax = mdInlineSyntax(Obj);
  return Obj;
};
const bmark = (text) => mark().render(text);
export default bmark;
