/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from "react";

type SectionErrorsPropsType = {
  invalidFormFields: ValidatorsResultsType;
  sectionFields: ConfigFieldType[];
};

export function SectionErrors({
  invalidFormFields,
  sectionFields,
}: SectionErrorsPropsType) {
  const allInvalidFieldnames: string[] = Object.keys(invalidFormFields);
  const sectionInvalidFields: ConfigFieldType[] = (
    sectionFields || []
  ).filter((field) => allInvalidFieldnames.includes(field.name));
  const sectionHasErrors: boolean = sectionInvalidFields.length > 0;

  return (
    // bootstrap classes:
    //  - alert
    //  - alert-danger
    //  - container

    <>
      {sectionHasErrors && sectionFields && (
        <div className={`alert alert-danger container`} role={"alert"}>
          <b>Please fix the following errors:</b>

          <ul key={`fields-errors`}>
            {sectionFields.map((field: ConfigFieldType, fieldIndex: number) => {
              const fieldErrors = invalidFormFields[field.name] || [];
              const fieldHasErrors = fieldErrors.length > 0;

              if (!fieldHasErrors) {
                return;
              }

              return (
                <li key={`fields-errors-${fieldIndex}`}>
                  <div>{field.label}:</div>

                  <ul key={`field-errors`}>
                    {fieldErrors.map((error: string, errorIndex: number) => {
                      return (
                        <li key={`field-errors-${fieldIndex}-${errorIndex}`}>
                          {error}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}
