/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "bootstrap";
import "bootstrap-select";
import * as $ from "jquery";
import * as React from "react";
import { runCustomTrigger } from "../utils";
import { checkFieldRequiredness } from "../validation/helpers";
import { Errors } from "./Errors";
import "./SelectField.css";

type ValueType = string[] | string;

type JQueryType = JQuery & {
  selectpicker: Function;
};

type SelectFieldPropsType = {
  field: ConfigSelectFieldType;
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

function SelectField({
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
}: SelectFieldPropsType) {
  const defaultValue: ValueType = field.multiple ? [] : "";
  const [value, setValue] = React.useState<ValueType>(defaultValue);

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

  function onChange(
    e: React.ChangeEvent<HTMLSelectElement>,
    fieldName: string
  ) {
    let fieldValue: ValueType = e.target.value;
    if (field.multiple) {
      fieldValue = Array.from(
        e.target.selectedOptions,
        (option: HTMLOptionElement) => option.value
      );
    }

    updateFormData(fieldName, fieldValue, e);
    _runCustomTrigger("onChange");
  }

  function onBlur(e: React.FocusEvent<HTMLSelectElement>) {
    _runCustomTrigger("onBlur");
  }

  function onFocus(e: React.FocusEvent<HTMLSelectElement>) {
    _runCustomTrigger("onFocus");
  }

  function onClick(e: React.UIEvent<HTMLSelectElement>) {
    _runCustomTrigger("onClick");
  }

  // --- Effects ---
  React.useEffect(() => {
    // Enable plugin
    const $fieldElement = $(`.selectpicker.select-${field.name}`) as JQueryType;
    $fieldElement.selectpicker();
  }, []);

  React.useEffect(() => {
    const $fieldWrapperElement = $(
      `.bootstrap-select.select-${field.name}`
    ) as JQueryType;

    if (invalid) {
      $fieldWrapperElement.addClass("is-invalid");
    } else {
      $fieldWrapperElement.removeClass("is-invalid");
    }

    setInvalidField(invalid);
  }, [invalid]);

  React.useEffect(() => {
    const $fieldElement = $(`.selectpicker.select-${field.name}`) as JQueryType;
    if (invalidField) {
      $fieldElement.addClass("is-invalid");
    } else {
      $fieldElement.removeClass("is-invalid");
    }
  }, [invalidField]);

  React.useEffect(() => {
    setErrors(validationErrors);
  }, [validationErrors]);

  React.useEffect(() => {
    // Refresh plugin after value was changed
    const $fieldElement = $(`.selectpicker.select-${field.name}`) as JQueryType;
    $fieldElement.selectpicker("refresh");

    if (value === "" || (Array.isArray(value) && value.length === 0)) {
      $fieldElement.selectpicker("deselectAll");
    }
  }, [value, disabled]);

  // Value in formData is updated
  React.useEffect(() => {
    setValue((formData[field.name] as ValueType) || defaultValue);
  }, [formData[field.name]]);

  return (
    // bootstrap classes:
    //  - form-control
    //  - is-invalid
    //  - selectpicker

    <>
      <select
        className={`
          form-control
          fc-select-field
          selectpicker
          select-${field.name}
          ${className || ""}
          ${invalidField ? "is-invalid" : ""}
        `}
        id={field.id}
        name={field.name}
        required={checkFieldRequiredness(field)}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
          !disabled && onChange(e, field.name);
          if (cleanErrorsOnChange) {
            setInvalidField(false);
            setErrors([]);
          }
        }}
        onBlur={onBlur}
        onFocus={onFocus}
        onClick={onClick}
        multiple={field.multiple}
        disabled={disabled}
        data-actions-box={field.multiple ? true : null}
        data-live-search={true}
        data-selected-text-format={field.multiple ? "count > 1" : null}
        data-title={inReviewState ? value : null}
        data-width={"100%"}
      >
        {field.options.map((option: OptionType, index: number) => {
          return (
            <option key={`option-${field.id}-${index}`} value={option.value}>
              {option.label}
            </option>
          );
        })}
      </select>

      <Errors messages={errors} />
    </>
  );
}

export { SelectField };
