import bmark from "./dist/index.js";

var a = new bmark.Converter();
a.setFlavor("github");

console.log(a.makeHtml("# Hello World"))
