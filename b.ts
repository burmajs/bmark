//import { parsers } from "./a.ts";
import fs from "fs";
//const par = parsers;
import { registerParser, runParser, removeParser } from "./src/parser.js";

// registerParser("cc", (text, options, globals) => {
//   text = `Hello ${text}`;
//   return text;
// });

// fs.writeFileSync(
//   "mm.json",
//   JSON.stringify(parsers, (key, value) => {
//     if (typeof value === "function") {
//       return value.toString();
//     }
//     return value;
//   })
// );

// console.log(parsers)
const ee = (text: string) => (text = `Hello ${text}`)
const par = {
  aa: ee,
  bb: (text: string) => {
    text = run("aa")(text);
    return `Hi ${text}`;
  },
};

const run = (name: string) => {
  if (!par.hasOwnProperty(name)) {
    throw new Error(`${name} not registered.`);
  }
  return par[name];
};

console.log(run("cc")("Joe"));
