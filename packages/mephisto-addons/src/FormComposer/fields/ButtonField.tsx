/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from "react";
import { runCustomTrigger } from "../utils";
import "./ButtonField.css";
import { Errors } from "./Errors";

type ValueType = string;

type ButtonFieldPropsType = {
  field: ConfigButtonFieldType;
  formData: FormStateType;
  updateFormData: UpdateFormDataType;
  disabled: boolean;
  inReviewState: boolean;
  validationErrors: string[];
  formFields: FormFieldsType;
  customTriggers: CustomTriggersType;
  className?: string;
  cleanErrorsOnClick?: boolean;
  remoteProcedureCollection?: RemoteProcedureCollectionType;
  setDynamicFormElementsConfig: SetDynamicFormElementsConfigType;
  setInvalidFormFields: React.Dispatch<React.SetStateAction<FieldsErrorsType>>;
  setSubmitErrors: React.Dispatch<React.SetStateAction<string[]>>;
  setSubmitSuccessText: React.Dispatch<React.SetStateAction<string>>;
  submitForm: SubmitFormType;
  loading: boolean;
  validateForm: Function;
};

function ButtonField({
  field,
  formData,
  updateFormData,
  disabled,
  inReviewState,
  validationErrors,
  formFields,
  customTriggers,
  className,
  cleanErrorsOnClick,
  remoteProcedureCollection,
  setDynamicFormElementsConfig,
  setInvalidFormFields,
  setSubmitErrors,
  setSubmitSuccessText,
  submitForm,
  loading,
  validateForm,
}: ButtonFieldPropsType) {
  const [value, setValue] = React.useState<ValueType>(field.value as ValueType);

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
      setDynamicFormElementsConfig: setDynamicFormElementsConfig,
      setInvalidFormFields: setInvalidFormFields,
      setSubmitErrors: setSubmitErrors,
      setSubmitSuccessText: setSubmitSuccessText,
      submitForm: submitForm,
      validateForm: validateForm,
    });
  }

  function onClick(e: React.UIEvent<HTMLButtonElement>) {
    e.preventDefault();

    if (disabled) {
      return;
    }

    if (cleanErrorsOnClick) {
      setErrors([]);
    }

    _runCustomTrigger("onClick");
  }

  // --- Effects ---

  React.useEffect(() => {
    setErrors(validationErrors);
  }, [validationErrors]);

  // Value in formData is updated
  React.useEffect(() => {
    const formDataValue = formData[field.name] as ValueType;

    if (formDataValue === undefined) {
      return;
    }

    // Do not update value until it was updated only outside the widget.
    // Otherwise, it will put cursor caret to the end of string every typed character
    if (formDataValue !== value) {
      setValue(formDataValue || (field.value as ValueType));
    }
  }, [formData[field.name]]);

  return (
    // bootstrap classes:
    //  - btn
    //  - spinner-border
    //  - text-secondary
    //  - visually-hidden

    <>
      <button
        className={`
          btn
          fc-button-field
          ${className || ""}
        `}
        id={field.id}
        name={field.name}
        type={"button"}
        onClick={onClick}
        disabled={disabled}
      >
        {loading ? (
          <>
            <span
              className={`spinner-border spinner-border-sm`}
              aria-hidden={"true"}
            ></span>
            <span className={`visually-hidden`} role={"status"}>
              Loading...
            </span>
          </>
        ) : (
          value
        )}
      </button>

      <Errors messages={errors} />
    </>
  );
}

export { ButtonField };
