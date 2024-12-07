/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from "react";
import { DEFAULT_COLLAPSABLE, DEFAULT_INITIALLY_COLLAPSED } from "./constants";
import "./Section.css";
import { SectionErrors } from "./SectionErrors";
import { SectionErrorsCountBadge } from "./SectionErrorsCountBadge";
import { runCustomTrigger } from "./utils";

type SectionPropsType = {
  children: React.ReactNode;
  customTriggers: CustomTriggersType;
  data: ConfigSectionType;
  formFields: FormFieldsType;
  formState: FormStateType;
  formatStringWithTokens: FormatStringWithTokensType;
  inReviewState: boolean;
  index: number;
  invalidFormFields: ValidatorsResultsType;
  remoteProcedureCollection: RemoteProcedureCollectionType;
  sectionsFields: SectionsFieldsType;
  setRenderingErrors: SetRenderingErrorsType;
  updateFormData: UpdateFormDataType;
  setcurrentlyWorkedOnSectionName: React.Dispatch<React.SetStateAction<string>>;
};

function Section({
  children,
  customTriggers,
  data,
  formFields,
  formState,
  formatStringWithTokens,
  inReviewState,
  index,
  invalidFormFields,
  remoteProcedureCollection,
  sectionsFields,
  setRenderingErrors,
  updateFormData,
  setcurrentlyWorkedOnSectionName,
}: SectionPropsType) {
  const title: string = formatStringWithTokens(data.title, setRenderingErrors);
  const instruction: string = formatStringWithTokens(
    data.instruction,
    setRenderingErrors
  );

  const collapsable: boolean = [null, undefined].includes(data.collapsable) // Not specified in config
    ? DEFAULT_COLLAPSABLE
    : data.collapsable;

  const initiallyCollapsed: boolean = collapsable
    ? [null, undefined].includes(data.initially_collapsed) // Not specified in config
      ? DEFAULT_INITIALLY_COLLAPSED
      : data.initially_collapsed
    : false;

  const sectionFields: ConfigFieldType[] = sectionsFields[index] || [];

  const hasInvalidFields: boolean = !!sectionFields.filter((field) =>
    Object.keys(invalidFormFields).includes(field.name)
  ).length;

  function onClick() {
    // For scrolling to first invalid field in current section
    setcurrentlyWorkedOnSectionName(data.name);
  }

  function onClickSectionHeader() {
    if (inReviewState) {
      return;
    }

    runCustomTrigger({
      elementTriggersConfig: data.triggers,
      elementTriggerName: "onClick",
      customTriggers: customTriggers,
      formData: formState,
      updateFormData: updateFormData,
      element: data,
      fieldValue: null,
      formFields: formFields,
      remoteProcedureCollection: remoteProcedureCollection,
    });
  }

  return (
    <section
      className={`section ${data.classes || ""}`}
      id={data.id}
      data-id={`section-${index}`}
      data-name={data.name}
      data-invalid={hasInvalidFields}
      onClick={onClick}
    >
      {(title || instruction) && (
        // Section header is clickable for accordion
        <div
          className={`
            section-header
            alert
            alert-info
            ${collapsable ? "collapsable" : ""}
            ${hasInvalidFields ? "has-invalid-fields" : ""}
          `}
          role={"alert"}
          id={`accordion_heading_${index}`}
          onClick={onClickSectionHeader}
          data-toggle={collapsable ? "collapse" : null}
          data-target={
            collapsable ? `#accordion_collapsable_part_${index}` : null
          }
          aria-expanded={collapsable ? initiallyCollapsed : null}
          aria-controls={
            collapsable ? `accordion_collapsable_part_${index}` : null
          }
        >
          <div className="row justify-content-between">
            {/* Section name on the left side */}
            {title && (
              <h4
                className={`
                  col-8
                  section-name
                  ${collapsable ? "dropdown-toggle" : ""}
                `}
                dangerouslySetInnerHTML={{ __html: title }}
              ></h4>
            )}

            {/* Badge with errors number on the right side */}
            <div className={`col-auto`}>
              <SectionErrorsCountBadge
                sectionFields={sectionFields}
                invalidFormFields={invalidFormFields}
              />
            </div>
          </div>

          {title && instruction && <hr />}

          {instruction && (
            <p
              className={`section-instruction`}
              dangerouslySetInnerHTML={{ __html: instruction }}
            ></p>
          )}
        </div>
      )}

      {/* Collapsable part of section with fieldsets */}
      <div
        id={`accordion_collapsable_part_${index}`}
        className={`
          collapse
          ${collapsable ? "" : "non-collapsable"}
          ${initiallyCollapsed ? "" : "show"}
        `}
        aria-labelledby={`accordion_heading_${index}`}
        data-parent={`#id_accordion`}
      >
        <SectionErrors
          sectionFields={sectionFields}
          invalidFormFields={invalidFormFields}
        />

        {/* Fieldsets */}
        {children}
      </div>
    </section>
  );
}

export { Section };
