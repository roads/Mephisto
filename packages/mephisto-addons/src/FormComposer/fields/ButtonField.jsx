/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { runCustomTrigger } from "../utils";
import "./ButtonField.css";
import { Errors } from "./Errors.jsx";

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
}) {
  const [value, setValue] = React.useState(field.value);

  const [errors, setErrors] = React.useState([]);

  // Methods
  function _runCustomTrigger(triggerName) {
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

  function onClick(e) {
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
    const formDataValue = formData[field.name];

    if (formDataValue === undefined) {
      return;
    }

    // Do not update value until it was updated only outside the widget.
    // Otherwise, it will put cursor caret to the end of string every typed character
    if (formDataValue !== value) {
      setValue(formDataValue || field.value);
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
