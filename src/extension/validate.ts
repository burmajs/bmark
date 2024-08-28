import { bmark } from "../lib/bmark.js";
import { type BmarkExtension } from "./type.js";
type Validate = {
  valid: boolean;
  error: string;
};
/**
 * ### Validate extension
 */
export function validate(
  extension: BmarkExtension[] | BmarkExtension,
  name: string | null
): Validate {
  "use strict";
  const errMsg = name
    ? "Error in " + name + " extension->"
    : "Error in unnamed extension";
  const ret: Validate = {
    valid: true,
    error: "",
  };
  // Ensure extension is always treated as an array
  if (!Array.isArray(extension)) {
    extension = [extension];
  }
  for (let i = 0; i < extension.length; ++i) {
    const baseMsg = errMsg + " sub-extension " + i + ": ",
      ext = extension[i];
    if (typeof ext !== "object") {
      ret.valid = false;
      ret.error = baseMsg + "must be an object, but " + typeof ext + " given";
      return ret;
    }

    if (!bmark.helper.isString(ext.type)) {
      ret.valid = false;
      ret.error =
        baseMsg +
        'property "type" must be a string, but ' +
        typeof ext.type +
        " given";
      return ret;
    }

    var type = (ext.type = ext.type.toLowerCase());

    // normalize extension type
    if (type === "language") {
      type = ext.type = "lang";
    }

    if (type === "html") {
      type = ext.type = "output";
    }

    if (type !== "lang" && type !== "output" && type !== "listener") {
      ret.valid = false;
      ret.error =
        baseMsg +
        "type " +
        type +
        ' is not recognized. Valid values: "lang/language", "output/html" or "listener"';
      return ret;
    }

    if (type === "listener") {
      if (bmark.helper.isUndefined(ext.listeners)) {
        ret.valid = false;
        ret.error =
          baseMsg +
          '. Extensions of type "listener" must have a property called "listeners"';
        return ret;
      }
    } else {
      if (
        bmark.helper.isUndefined(ext.filter) &&
        bmark.helper.isUndefined(ext.regex)
      ) {
        ret.valid = false;
        ret.error =
          baseMsg +
          type +
          ' extensions must define either a "regex" property or a "filter" method';
        return ret;
      }
    }

    if (ext.listeners) {
      if (typeof ext.listeners !== "object") {
        ret.valid = false;
        ret.error =
          baseMsg +
          '"listeners" property must be an object but ' +
          typeof ext.listeners +
          " given";
        return ret;
      }
      for (var ln in ext.listeners) {
        if (ext.listeners.hasOwnProperty(ln)) {
          if (typeof ext.listeners[ln] !== "function") {
            ret.valid = false;
            ret.error =
              baseMsg +
              '"listeners" property must be an hash of [event name]: [callback]. listeners.' +
              ln +
              " must be a function but " +
              typeof ext.listeners[ln] +
              " given";
            return ret;
          }
        }
      }
    }

    if (ext.filter) {
      if (typeof ext.filter !== "function") {
        ret.valid = false;
        ret.error =
          baseMsg +
          '"filter" must be a function, but ' +
          typeof ext.filter +
          " given";
        return ret;
      }
    } else if (ext.regex) {
      if (bmark.helper.isString(ext.regex)) {
        ext.regex = new RegExp(ext.regex, "g");
      }
      if (!(ext.regex instanceof RegExp)) {
        ret.valid = false;
        ret.error =
          baseMsg +
          '"regex" property must either be a string or a RegExp object, but ' +
          typeof ext.regex +
          " given";
        return ret;
      }
      if (bmark.helper.isUndefined(ext.replace)) {
        ret.valid = false;
        ret.error =
          baseMsg +
          '"regex" extensions must implement a replace string or function';
        return ret;
      }
    }
  }
  return ret;
}
