import { Converter } from "./src/converter.js";
import fs from "fs";

const bb = fs.readFileSync("./notes/leapyear.md", "utf-8");
const aa = new Converter(bb);
//fs.writeFileSync("aa.html", aa.completeHtml());
aa.setOption({ name: "jsx", value: true });
aa.setDefaultOptions();
console.log(aa.getOption("jsx"));
