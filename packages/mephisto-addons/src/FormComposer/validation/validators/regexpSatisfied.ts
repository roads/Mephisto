/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { FieldType } from "../../constants";
import {
  REGEXP_ERROR_MESSAGE_KEY,
  validationErrorMessagesByName,
} from "../errorMessages";

/**
 * Check if string-value matches RegExp
 */
export default function regexpSatisfied(
  field: ConfigFieldType,
  value: string,
  regexp: string,
  regexpFlags: string
): string | null {
  if (
    [FieldType.INPUT, FieldType.TEXTAREA, FieldType.EMAIL].includes(field.type)
  ) {
    const _value: string = (value || "").trim();

    const _regexpParams: string = regexpFlags || "igm";
    const _regexp: RegExp = new RegExp(regexp, _regexpParams);

    if (!_regexp.test(_value)) {
      return validationErrorMessagesByName[REGEXP_ERROR_MESSAGE_KEY] as string;
    }
  }

  return null;
}
