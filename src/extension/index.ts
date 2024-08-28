import { bmark } from "../lib/bmark.js";
import { type BmarkExtension, BmarkExtensions } from "./type.js";
import { validate } from "./validate.js";
export interface Bextensions {
  registerExtension(
    name: string,
    ext:
      | (() => BmarkExtension[] | BmarkExtension)
      | BmarkExtension[]
      | BmarkExtension
  ): void;
  getExtension(name: string): BmarkExtension[];
  getAllExtensions(): BmarkExtensions;
  removeExtension(name: string): void;
  resetExtensions(): void;
  validateExtension(ext: BmarkExtension[] | BmarkExtension): boolean;
}

export let extensions: BmarkExtensions = {};
export const bextensions: Bextensions = {
  getExtension(name) {
    "use strict";

    if (!bmark.helper.isString(name)) {
      throw Error("Extension 'name' must be a string");
    }
    const extName = bmark.helper.stdExtName(name);

    if (!extensions.hasOwnProperty(extName)) {
      throw Error("Extension named " + name + " is not registered!");
    }
    return extensions[extName];
  },
  registerExtension(name, ext) {
    "use strict";

    if (!bmark.helper.isString(name)) {
      throw Error("Extension 'name' must be a string");
    }
    const extName = bmark.helper.stdExtName(name);
    // Expand extension if it's wrapped in a function
    if (typeof ext === "function") {
      ext = ext();
    }
    // Ensure extension is always treated as an array
    if (!Array.isArray(ext)) {
      ext = [ext];
    }
    const validExtension = validate(ext, extName);

    if (validExtension.valid) {
      extensions[extName] = ext;
    } else {
      throw Error(validExtension.error);
    }
  },
  getAllExtensions() {
    return extensions;
  },
  removeExtension(name) {
    "use strict";
    delete extensions[name];
  },
  resetExtensions() {
    "use strict";
    extensions = {};
  },
  validateExtension(ext) {
    "use strict";

    const validateExtension = validate(ext, null);
    if (!validateExtension.valid) {
      console.warn(validateExtension.error);
      return false;
    }
    return true;
  },
};
