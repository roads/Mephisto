/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export function pluralizeString(
  str: string,
  num: number,
  str_plural?: string
): string {
  if (num !== 1) {
    if (!!str_plural) {
      return str_plural;
    } else {
      let pluralizedEnding = "";
      if (str.endsWith("s") || str.endsWith("ch")) {
        pluralizedEnding = "es";
      } else if (str.endsWith("z")) {
        pluralizedEnding = "zes";
      } else {
        pluralizedEnding = "s";
      }
      return `${str}${pluralizedEnding}`;
    }
  }

  return str;
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

/**
 * Aleternative for `String.prototype.replaceAll()` for older browsers
 */
export function replaceAll(
  originalString: string,
  stringToReplace: string,
  replacement: string
): string {
  return originalString.replace(
    new RegExp(escapeRegExp(stringToReplace), "g"),
    replacement
  );
}

export function generateRandomString(len: number, chars?: string): string {
  chars =
    chars || "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let randomString: string = "";

  for (let i: number = 0; i < len; i++) {
    let randomPoz: number = Math.floor(Math.random() * chars.length);
    randomString += chars.substring(randomPoz, randomPoz + 1);
  }

  return randomString;
}
