/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { FieldType } from "./constants";
import "./Field.css";
import {
  ButtonField,
  CheckboxField,
  FileField,
  HiddenField,
  InputField,
  RadioField,
  SelectField,
  TextareaField,
} from "./fields";
import { checkFieldRequiredness } from "./validation/helpers";

function Field({
  customTriggers,
  data,
  finalResults,
  formFields,
  formState,
  formatStringWithTokens,
  inReviewState,
  invalidFormFields,
  remoteProcedureCollection,
  sendMessageToReviewAppWithFileInfo,
  dynamicFormElementsConfig,
  setDynamicFormElementsConfig,
  setInvalidFormFields,
  setRenderingErrors,
  setSubmitErrors,
  setSubmitSuccessText,
  submitForm,
  updateFormData,
  validateForm,
}) {
  const label = formatStringWithTokens(data.label, setRenderingErrors);
  const tooltip = formatStringWithTokens(data.tooltip, setRenderingErrors);
  const help = data.help;
  const isInvalid = !!(invalidFormFields[data.name] || []).length;
  const validationErrors = invalidFormFields[data.name] || [];
  const disabled =
    inReviewState || dynamicFormElementsConfig.disables[data.name] === true;
  const loading = dynamicFormElementsConfig.loadings[data.name] === true;

  return (
    <div
      className={`
        field
        form-group
        col
        ${checkFieldRequiredness(data) ? "required" : ""}
        ${data.type === FieldType.HIDDEN ? "hidden-type" : ""}
        ${data.classes || ""}
      `}
      title={tooltip}
      data-name={data.name}
    >
      {data.icon && <i>{data.icon}</i>}

      {label && <label htmlFor={data.id}>{label}</label>}

      {[
        FieldType.INPUT,
        FieldType.EMAIL,
        FieldType.PASSWORD,
        FieldType.NUMBER,
      ].includes(data.type) && (
        <InputField
          field={data}
          formData={formState}
          updateFormData={updateFormData}
          disabled={disabled}
          initialFormData={finalResults}
          inReviewState={inReviewState}
          invalid={isInvalid}
          validationErrors={validationErrors}
          formFields={formFields}
          customTriggers={customTriggers}
          className={data.classes_input_element}
          cleanErrorsOnChange={true}
          remoteProcedureCollection={remoteProcedureCollection}
        />
      )}

      {data.type === FieldType.TEXTAREA && (
        <TextareaField
          field={data}
          formData={formState}
          updateFormData={updateFormData}
          disabled={disabled}
          initialFormData={finalResults}
          inReviewState={inReviewState}
          invalid={isInvalid}
          validationErrors={validationErrors}
          formFields={formFields}
          customTriggers={customTriggers}
          className={data.classes_input_element}
          cleanErrorsOnChange={true}
          remoteProcedureCollection={remoteProcedureCollection}
        />
      )}

      {data.type === FieldType.CHECKBOX && (
        <CheckboxField
          field={data}
          formData={formState}
          updateFormData={updateFormData}
          disabled={disabled}
          initialFormData={finalResults}
          inReviewState={inReviewState}
          invalid={isInvalid}
          validationErrors={validationErrors}
          formFields={formFields}
          customTriggers={customTriggers}
          cleanErrorsOnChange={true}
          remoteProcedureCollection={remoteProcedureCollection}
        />
      )}

      {data.type === FieldType.RADIO && (
        <RadioField
          field={data}
          formData={formState}
          updateFormData={updateFormData}
          disabled={disabled}
          initialFormData={finalResults}
          inReviewState={inReviewState}
          invalid={isInvalid}
          validationErrors={validationErrors}
          formFields={formFields}
          customTriggers={customTriggers}
          cleanErrorsOnChange={true}
          remoteProcedureCollection={remoteProcedureCollection}
        />
      )}

      {data.type === FieldType.SELECT && (
        <SelectField
          field={data}
          formData={formState}
          updateFormData={updateFormData}
          disabled={disabled}
          initialFormData={finalResults}
          inReviewState={inReviewState}
          invalid={isInvalid}
          validationErrors={validationErrors}
          formFields={formFields}
          customTriggers={customTriggers}
          className={data.classes_input_element}
          cleanErrorsOnChange={true}
          remoteProcedureCollection={remoteProcedureCollection}
        />
      )}

      {data.type === FieldType.FILE && (
        <FileField
          field={data}
          formData={formState}
          updateFormData={updateFormData}
          disabled={disabled}
          initialFormData={finalResults}
          inReviewState={inReviewState}
          invalid={isInvalid}
          validationErrors={validationErrors}
          onReviewFileButtonClick={sendMessageToReviewAppWithFileInfo}
          formFields={formFields}
          customTriggers={customTriggers}
          className={data.classes_input_element}
          cleanErrorsOnChange={true}
          remoteProcedureCollection={remoteProcedureCollection}
        />
      )}

      {data.type === FieldType.HIDDEN && (
        <HiddenField
          field={data}
          formData={formState}
          updateFormData={updateFormData}
          disabled={disabled}
        />
      )}

      {data.type === FieldType.BUTTON && (
        <ButtonField
          field={data}
          formData={formState}
          updateFormData={updateFormData}
          disabled={disabled}
          inReviewState={inReviewState}
          validationErrors={validationErrors}
          formFields={formFields}
          customTriggers={customTriggers}
          className={data.classes_input_element}
          cleanErrorsOnClick={true}
          remoteProcedureCollection={remoteProcedureCollection}
          setDynamicFormElementsConfig={setDynamicFormElementsConfig}
          setInvalidFormFields={setInvalidFormFields}
          setSubmitErrors={setSubmitErrors}
          setSubmitSuccessText={setSubmitSuccessText}
          submitForm={submitForm}
          loading={loading}
          validateForm={validateForm}
        />
      )}

      {help && (
        <small
          className={`field-help form-text text-muted`}
          dangerouslySetInnerHTML={{
            __html: help,
          }}
        ></small>
      )}
    </div>
  );
}

export { Field };
