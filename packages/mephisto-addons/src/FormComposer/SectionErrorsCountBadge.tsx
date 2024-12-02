/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from "react";

type SectionErrorsCountBadgePropsType = {
  invalidFormFields: ValidatorsResultsType;
  sectionFields: ConfigFieldType[];
};

export function SectionErrorsCountBadge({
  invalidFormFields,
  sectionFields,
}: SectionErrorsCountBadgePropsType) {
  const allInvalidFieldnames: string[] = Object.keys(invalidFormFields);
  const sectionInvalidFields: ConfigFieldType[] = (
    sectionFields || []
  ).filter((field) => allInvalidFieldnames.includes(field.name));
  const numberErrors: number = sectionInvalidFields.length;

  return (
    // bootstrap classes:
    //  - badge
    //  - badge-danger
    //  - badge-light

    <>
      {sectionFields && numberErrors > 0 && (
        <span className={`badge badge-danger`}>
          <span className={`badge badge-light`}>{numberErrors}</span>{" "}
          <span>errors</span>
        </span>
      )}
    </>
  );
}
