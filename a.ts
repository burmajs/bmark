import { bmark } from "./src/index.js";
import fs from "fs";
const a = new bmark.Converter({ completeHTMLDocument: true });
const aa = fs.readFileSync("./notes/leapyear.md", "utf8");
const b = a.toHtml(aa);

fs.writeFileSync("aa.html", b);
