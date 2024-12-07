/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { replaceAll } from "../../../helpers";
import { FieldType } from "../../constants";
import {
  FILE_EXTENSION_ERROR_MESSAGE_KEY,
  validationErrorMessagesByName,
} from "../errorMessages";

/**
 * Check if file has correct extension
 */
export default function fileExtensionSatisfied(
  field: ConfigFieldType,
  value: FileFieldValueType,
  ...extensions: string[]
): string | null {
  if (field.type !== FieldType.FILE) {
    return null;
  }

  if (!value) {
    return null;
  }

  const fileName: string = (value.name || "").trim();
  const _extensions = extensions.map((e: string) =>
    replaceAll(e.toLowerCase(), ".", "")
  );

  const fileExtension: string = fileName.split(".").pop().toLowerCase();
  const fileHasCorrectExtension: boolean = _extensions.includes(fileExtension);

  if (!fileHasCorrectExtension) {
    const extensionsString: string = _extensions.join(", ");
    const errorMessagePattern = validationErrorMessagesByName[
      FILE_EXTENSION_ERROR_MESSAGE_KEY
    ] as Function;
    return errorMessagePattern(extensionsString, fileExtension);
  }

  return null;
}
