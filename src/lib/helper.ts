import { helper, type HelpersTypes } from "../helpers/index.js";

export interface BHelper {
  helper: HelpersTypes;
}

export const bhelpers: BHelper = {
  helper: helper,
};
