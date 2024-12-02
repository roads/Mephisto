/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from "react";
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

type FieldPropsType = {
  customTriggers: CustomTriggersType;
  data: ConfigFieldType;
  finalResults: FormComposerResultsType;
  formFields: FormFieldsType;
  formState: FormStateType;
  formatStringWithTokens: FormatStringWithTokensType;
  inReviewState: boolean;
  invalidFormFields: FieldsErrorsType;
  remoteProcedureCollection: RemoteProcedureCollectionType;
  sendMessageToReviewAppWithFileInfo: (
    filename: string,
    fieldname: string
  ) => void;
  dynamicFormElementsConfig: DynamicFormElementsConfigType;
  setDynamicFormElementsConfig: SetDynamicFormElementsConfigType;
  setInvalidFormFields: React.Dispatch<React.SetStateAction<FieldsErrorsType>>;
  setRenderingErrors: SetRenderingErrorsType;
  setSubmitErrors: React.Dispatch<React.SetStateAction<string[]>>;
  setSubmitSuccessText: React.Dispatch<React.SetStateAction<string>>;
  submitForm: SubmitFormType;
  updateFormData: UpdateFormDataType;
  validateForm: Function;
};

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
}: FieldPropsType) {
  const label: string = formatStringWithTokens(data.label, setRenderingErrors);
  const tooltip: string = formatStringWithTokens(
    data.tooltip,
    setRenderingErrors
  );
  const help: string = data.help;
  const isInvalid: boolean = !!(invalidFormFields[data.name] || []).length;
  const validationErrors: string[] = invalidFormFields[data.name] || [];
  const disabled: boolean =
    inReviewState || dynamicFormElementsConfig.disables[data.name] === true;
  const loading: boolean =
    dynamicFormElementsConfig.loadings[data.name] === true;

  return (
    <div
      // `col-12` - full width for screens <576px
      // `col-sm-12` - full width for screens ≥576px
      // `col-md` - adaptive sise for all screens ≥768px (2 cols - both 50%, 3 cols - 33.3%, etc)
      className={`
        field
        form-group
        col-12
        col-sm-12
        col-md
        ${checkFieldRequiredness(data) ? "required" : ""}
        ${data.type === FieldType.HIDDEN ? "hidden-type" : ""}
        ${data.classes || ""}
      `}
      title={tooltip}
      data-name={data.name}
      data-invalid={isInvalid}
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
          field={data as ConfigInputFieldType}
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
          field={data as ConfigTextareaFieldType}
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
          field={data as ConfigCheckboxFieldType}
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
          field={data as ConfigRadioFieldType}
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
          field={data as ConfigSelectFieldType}
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
          field={data as ConfigFileFieldType}
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
          field={data as ConfigHiddenFieldType}
          formData={formState}
          updateFormData={updateFormData}
          disabled={disabled}
        />
      )}

      {data.type === FieldType.BUTTON && (
        <ButtonField
          field={data as ConfigButtonFieldType}
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
