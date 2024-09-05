import fs from "fs";
import { Converter } from "./src/converter.js";
let txt = fs.readFileSync("./notes/leapyear.md", "utf8");
const aa = new Converter(txt);

const bb = aa.completeHtml({
  scriptTags: {
    head: {
      scriptNormalTags: [
        "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js",
      ],
    },
  },
});

// text = text.replace(
//   /\$\$(.*?)\$\$/gs,
//   (wm, txt) => ` <mathxxxjax>${txt} </mathxxxjax>`
// );

//console.log(text);

fs.writeFileSync("aa.html", bb);
