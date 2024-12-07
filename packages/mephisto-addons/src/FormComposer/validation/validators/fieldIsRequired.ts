/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { FieldType } from "../../constants";
import {
  REQUIRED_ERROR_MESSAGE_KEY,
  validationErrorMessagesByName,
} from "../errorMessages";

/**
 * Check if value is not empty
 */
export default function fieldIsRequired(
  field: ConfigFieldType,
  value: FieldValueType,
  required: boolean
): string | null {
  if (!required) {
    return null;
  }

  let _value: FieldValueType = value;
  if (typeof _value === "string") {
    _value = (_value || "").trim();
  } else if (field.type === FieldType.CHECKBOX) {
    const numberOfSelectedValues = Object.values(value || {}).filter(
      (v) => v === true
    ).length;
    _value = numberOfSelectedValues ? value : null;
  } else if (field.type === FieldType.SELECT && field["multiple"] === true) {
    _value = ((value as SelectFieldValueType) || []).length > 0 ? value : null;
  }

  const fieldIsEmpty: boolean = ["", null, undefined].includes(_value as any);

  if (fieldIsEmpty) {
    return validationErrorMessagesByName[REQUIRED_ERROR_MESSAGE_KEY] as string;
  }

  return null;
}
