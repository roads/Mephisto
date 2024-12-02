/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { FieldType } from "../../constants";
import {
  MAX_LENGTH_ERROR_MESSAGE_KEY,
  MAX_LENGTH_ITEMS_ERROR_MESSAGE_KEY,
  validationErrorMessagesByName,
} from "../errorMessages";

/**
 * Check if maximum length of value is not bigger than specified value
 */
export default function maxLengthSatisfied(
  field: ConfigFieldType,
  value: FieldValueType,
  maxLength: number
): string | null {
  let valueLength: number = 0;
  const _maxLength: number = Math.floor(maxLength);
  let errorMessagePattern = validationErrorMessagesByName[
    MAX_LENGTH_ERROR_MESSAGE_KEY
  ] as Function;
  let errorMessage: string = errorMessagePattern(_maxLength);

  if (
    [FieldType.INPUT, FieldType.TEXTAREA, FieldType.EMAIL].includes(field.type)
  ) {
    const _value = ((value as string) || "").trim();
    valueLength = _value.length;
  }

  if (field.type === FieldType.CHECKBOX) {
    const _value = (value as CheckboxFieldValueType) || {};
    valueLength = Object.entries(_value).filter(
      ([k, v]: [string, boolean]) => v === true
    ).length;
    errorMessagePattern = validationErrorMessagesByName[
      MAX_LENGTH_ITEMS_ERROR_MESSAGE_KEY
    ] as Function;
    errorMessage = errorMessagePattern(_maxLength);
  }

  if (field.type === FieldType.SELECT && field["multiple"] === true) {
    const _value = (value as SelectFieldValueType) || [];
    valueLength = _value.length;
    errorMessagePattern = validationErrorMessagesByName[
      MAX_LENGTH_ITEMS_ERROR_MESSAGE_KEY
    ] as Function;
    errorMessage = errorMessagePattern(_maxLength);
  }

  if (valueLength > _maxLength) {
    return errorMessage;
  }

  return null;
}
