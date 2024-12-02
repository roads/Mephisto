/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from "react";
import { runCustomTrigger } from "../utils";
import { checkFieldRequiredness } from "../validation/helpers";
import { Errors } from "./Errors";
import "./InputField.css";

const DEFAULT_VALUE: string = "";

type InputFieldPropsType = {
  field: ConfigInputFieldType;
  formData: FormStateType;
  updateFormData: UpdateFormDataType;
  disabled: boolean;
  initialFormData: FormComposerResultsType;
  inReviewState: boolean;
  invalid: boolean;
  validationErrors: string[];
  formFields: FormFieldsType;
  customTriggers: CustomTriggersType;
  className?: string;
  cleanErrorsOnChange?: boolean;
  remoteProcedureCollection?: RemoteProcedureCollectionType;
};

function InputField({
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
  className,
  cleanErrorsOnChange,
  remoteProcedureCollection,
}: InputFieldPropsType) {
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

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Update widget value
    setValue(e.target.value);
    // Update form data
    updateFormData(field.name, e.target.value, e);
    // Run custom triggers
    _runCustomTrigger("onChange");
  }

  function onBlur(e: React.FocusEvent<HTMLInputElement>) {
    _runCustomTrigger("onBlur");
  }

  function onFocus(e: React.FocusEvent<HTMLInputElement>) {
    _runCustomTrigger("onFocus");
  }

  function onClick(e: React.UIEvent<HTMLInputElement>) {
    _runCustomTrigger("onClick");
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
    const formDataValue: string = formData[field.name] as string;

    // Do not update value until it was updated only outside the widget.
    // Otherwise, it will put cursor caret to the end of string every typed character
    if (formDataValue !== value) {
      setValue(formDataValue || DEFAULT_VALUE);
    }
  }, [formData[field.name]]);

  return (
    // bootstrap classes:
    //  - form-control
    //  - is-invalid

    <>
      <input
        className={`
          form-control
          fc-input-field
          ${className || ""}
          ${invalidField ? "is-invalid" : ""}
        `}
        id={field.id}
        name={field.name}
        type={field.type}
        placeholder={field.placeholder}
        required={checkFieldRequiredness(field)}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          !disabled && onChange(e);
          if (cleanErrorsOnChange) {
            setInvalidField(false);
            setErrors([]);
          }
        }}
        onBlur={onBlur}
        onFocus={onFocus}
        onClick={onClick}
        disabled={disabled}
      />

      <Errors messages={errors} />
    </>
  );
}

export { InputField };
