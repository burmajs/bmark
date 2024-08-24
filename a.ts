import bmark from "./dist/index.js";
import fs from "fs";

const aa = fs.readFileSync("./README.md", "utf-8");

console.log(bmark(aa));
