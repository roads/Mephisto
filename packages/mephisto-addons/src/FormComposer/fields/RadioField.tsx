/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from "react";
import { runCustomTrigger } from "../utils";
import { Errors } from "./Errors";
import "./RadioField.css";

const DEFAULT_VALUE: string = "";

type RadioFieldPropsType = {
  field: ConfigRadioFieldType;
  formData: FormStateType;
  updateFormData: UpdateFormDataType;
  disabled: boolean;
  initialFormData: FormComposerResultsType;
  inReviewState: boolean;
  invalid: boolean;
  validationErrors: string[];
  formFields: FormFieldsType;
  customTriggers: CustomTriggersType;
  cleanErrorsOnChange?: boolean;
  remoteProcedureCollection?: RemoteProcedureCollectionType;
};

function RadioField({
  field,
  formData,
  updateFormData,
  disabled,
  initialFormData,
  inReviewState,
  invalid,
  validationErrors,
  formFields,
  customTriggers,
  cleanErrorsOnChange,
  remoteProcedureCollection,
}: RadioFieldPropsType) {
  const [value, setValue] = React.useState<string>(DEFAULT_VALUE);

  const [invalidField, setInvalidField] = React.useState<boolean>(false);
  const [errors, setErrors] = React.useState<string[]>([]);

  // Methods
  function _runCustomTrigger(triggerName: string) {
    if (inReviewState) {
      return;
    }

    runCustomTrigger({
      elementTriggersConfig: field.triggers,
      elementTriggerName: triggerName,
      customTriggers: customTriggers,
      formData: formData,
      updateFormData: updateFormData,
      element: field,
      fieldValue: value,
      formFields: formFields,
      remoteProcedureCollection: remoteProcedureCollection,
    });
  }

  function onClick(e: React.UIEvent<HTMLDivElement>) {
    _runCustomTrigger("onClick");
  }

  function onChange(e: React.UIEvent<HTMLDivElement>, optionValue: string) {
    updateFormData(field.name, optionValue, e);
    _runCustomTrigger("onChange");
  }

  // --- Effects ---
  React.useEffect(() => {
    setInvalidField(invalid);
  }, [invalid]);

  React.useEffect(() => {
    setErrors(validationErrors);
  }, [validationErrors]);

  // Value in formData is updated
  React.useEffect(() => {
    setValue((formData[field.name] as string) || DEFAULT_VALUE);
  }, [formData[field.name]]);

  return (
    // bootstrap classes:
    //  - form-check
    //  - is-invalid
    //  - disabled
    //  - form-check-input
    //  - form-check-label

    <div className={`fc-radio-field`} data-name={field.name} onClick={onClick}>
      {field.options.map((option, index) => {
        const checked = value === option.value;

        return (
          <div
            key={`option-${field.id}-${index}`}
            className={`
              form-check
              ${field.type}
              ${disabled ? "disabled" : ""}
              ${invalidField ? "is-invalid" : ""}
            `}
            onClick={(e: React.UIEvent<HTMLDivElement>) => {
              !disabled && onChange(e, option.value);
              if (cleanErrorsOnChange) {
                setInvalidField(false);
                setErrors([]);
              }
            }}
          >
            <span
              className={`form-check-input ${checked ? "checked" : ""}`}
              id={`${field.id}-${index}`}
            />
            <span className={`form-check-label`}>{option.label}</span>
          </div>
        );
      })}

      <Errors messages={errors} />
    </div>
  );
}

export { RadioField };
