import type { GlobalConverter } from "../globals.js";
import type { ConverterOptions } from "../options.js";
import { emojis } from "./_emoji.js";

/**
 * #### Replaces all occurrences of `:emoji_name:` with the corresponding emoji unicode character.
 *
 * The regular expression used to match the `:emoji_name:` string is
 * `/:([\S]+?):/g`.
 *
 * The emoji mapping object is created by importing the `_emoji` module and
 * getting the `emojis` object from it. This object has keys like "smile" and
 * values like "\ud83d\ude03".
 *
 * We use the `replace()` method to do the actual replacement. It takes a regex
 * as the first argument and a function as the second. The function is called
 * for every match of the regex and it gets passed the whole match and the
 * match groups. The function should return the replacement string.
 *
 * The function checks if the emoji name is in the emoji mapping object. If
 * it is, it returns the corresponding emoji character. If not, it just
 * returns the original string (the `:emoji_name:` string).
 *
 * Finally, we dispatch an event after the replacement has been done so that
 * other plugins can react to it.
 *
 * @param {string} text The text to replace emoji names in
 * @param {ConverterOptions} options The options object
 * @param {GlobalConverter} globals The globals object
 * @returns {string} The text with all occurrences of `:emoji_name:` replaced
 * with the corresponding emoji unicode character
 */
export function emoji(
	text: string,
	options: ConverterOptions,
	globals: GlobalConverter,
): string {
	// We are going to replace all occurrences of :emoji_name: with the
	// corresponding emoji unicode character. This is done by creating a regular
	// expression that matches the :emoji_name: string and then replacing it
	// with the corresponding emoji character.
	//
	// The regex is as follows:
	//   /:(\S+?):/g
	//   - The \S means "one or more non-space characters"
	//   - The ?: makes the regex non-greedy, meaning it will stop at the first
	//     character that matches the regex instead of going all the way to the
	//     end of the string.
	//   - The g flag makes the regex go through the entire string and replace
	//     all occurrences, not just the first one.
	//
	// The emoji mapping object is created by importing the _emoji module and
	// getting the emojis object from it. This object has keys like "smile" and
	// values like "\ud83d\ude03".
	//
	// We use the replace() method to do the actual replacement. It takes a regex
	// as the first argument and a function as the second. The function is called
	// for every match of the regex and it gets passed the whole match and the
	// match groups. The function should return the replacement string.
	//
	// The function checks if the emoji name is in the emoji mapping object. If
	// it is, it returns the corresponding emoji character. If not, it just
	// returns the original string (the :emoji_name: string).
	const emojiRgx = /:([\S]+?):/g;

	text = text.replace(emojiRgx, (wholeMatch, emojiCode) => {
		if (emojis.hasOwnProperty(emojiCode)) {
			return emojis[emojiCode];
		}
		return wholeMatch;
	});

	// Finally, we dispatch an event after the replacement has been done so that
	// other plugins can react to it.
	text = globals.converter
		?._dispatch("emoji.after", text, options, globals)
		.getText() as string;

	return text;
}
