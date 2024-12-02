/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { FieldType } from "../../constants";
import {
  MIN_LENGTH_ERROR_MESSAGE_KEY,
  MIN_LENGTH_ITEMS_ERROR_MESSAGE_KEY,
  validationErrorMessagesByName,
} from "../errorMessages";

/**
 * Check if minimum length of value is not less than specified value
 */
export default function minLengthSatisfied(
  field: ConfigFieldType,
  value: FieldValueType,
  minLength: number
): string | null {
  let valueLength: number = 0;
  const _minLength: number = Math.floor(minLength);
  let errorMessagePattern = validationErrorMessagesByName[
    MIN_LENGTH_ERROR_MESSAGE_KEY
  ] as Function;
  let errorMessage = errorMessagePattern(_minLength);

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
      MIN_LENGTH_ITEMS_ERROR_MESSAGE_KEY
    ] as Function;
    errorMessage = errorMessagePattern(_minLength);
  }

  if (field.type === FieldType.SELECT && field["multiple"] === true) {
    const _value = (value as SelectFieldValueType) || [];
    valueLength = _value.length;
    errorMessagePattern = validationErrorMessagesByName[
      MIN_LENGTH_ITEMS_ERROR_MESSAGE_KEY
    ] as Function;
    errorMessage = errorMessagePattern(_minLength);
  }

  if (valueLength < _minLength) {
    return errorMessage;
  }

  return null;
}
