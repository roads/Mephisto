/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from "react";
import {
  AUDIO_TYPES_BY_EXT,
  FILE_TYPE_BY_EXT,
  FileType,
  VIDEO_TYPES_BY_EXT,
} from "../constants";
import { runCustomTrigger } from "../utils";
import { checkFieldRequiredness } from "../validation/helpers";
import { Errors } from "./Errors";
import "./FileField.css";

const DEFAULT_VALUE: string = "";

type FileFieldPropsType = {
  field: ConfigFileFieldType;
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
  onReviewFileButtonClick?: (filename: string, fieldname: string) => void;
};

function FileField({
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
  onReviewFileButtonClick,
}: FileFieldPropsType) {
  const [value, setValue] = React.useState<string>(DEFAULT_VALUE);

  const [invalidField, setInvalidField] = React.useState<boolean>(false);
  const [errors, setErrors] = React.useState<string[]>([]);

  const [fileUrl, setFileUrl] = React.useState<string>(null);
  const [fileExt, setFileExt] = React.useState<string>(null);

  const fileType: string = FILE_TYPE_BY_EXT[fileExt];

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

  function onChange(e: React.ChangeEvent<HTMLInputElement>, fieldName: string) {
    let fieldValue: FileInfoType = null;
    const input = e.target;

    // Format of JSON value of files that server requires
    input.files?.length &&
      Object.values(input.files).forEach((file) => {
        fieldValue = {
          lastModified: file.lastModified ? file.lastModified : -1,
          name: file.name ? file.name : "",
          size: file.size ? file.size : -1,
          type: file.type ? file.type : "",
          file: file,
        };
        setFileExt(fieldValue.name.split(".").pop().toLowerCase());
        setFileUrl(URL.createObjectURL(file));
      });

    updateFormData(fieldName, fieldValue, e);
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

  function setDefaultWidgetValue() {
    const initialValue: { name: string } = initialFormData
      ? (initialFormData[field.name] as { name: string })
      : { name: DEFAULT_VALUE };
    updateFormData(field.name, initialValue);
  }

  function onReviewFileClick() {
    onReviewFileButtonClick(value, field.name);
  }

  // --- Effects ---
  React.useEffect(() => {
    setDefaultWidgetValue();
  }, []);

  React.useEffect(() => {
    setInvalidField(invalid);
  }, [invalid]);

  React.useEffect(() => {
    setErrors(validationErrors);
  }, [validationErrors]);

  // Value in formData is updated
  React.useEffect(() => {
    const fieldValue: { name: string } = formData[field.name] as {
      name: string;
    };
    const fileName = fieldValue ? fieldValue.name : DEFAULT_VALUE;
    setValue(fileName);
  }, [formData[field.name]]);

  return (
    // bootstrap classes:
    //  - custom-file
    //  - is-invalid
    //  - custom-file-input
    //  - custom-file-label

    <div
      className={`
      fc-file-field
      custom-file
      ${invalidField ? "is-invalid" : ""}
    `}
    >
      <input
        className={`
          custom-file-input
          ${className || ""}
          ${invalidField ? "is-invalid" : ""}
        `}
        id={field.id}
        name={field.name}
        type={field.type}
        placeholder={field.placeholder}
        required={checkFieldRequiredness(field)}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          !disabled && onChange(e, field.name);
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

      {/*
        Button to open file in modal window in Review App.
        This button is shown over input browse button only in review state and if file was attached
      */}
      {inReviewState && value && (
        <div
          className={"review-file-button"}
          title={"View uploaded file content"}
          onClick={onReviewFileClick}
        >
          View file
        </div>
      )}

      <span className={`custom-file-label`}>{value}</span>

      <Errors messages={errors} />

      {field.show_preview && fileType && (
        <div className={"file-preview"}>
          {fileType === FileType.IMAGE && (
            <img
              id={`${field.id}_preview`}
              src={fileUrl}
              alt={`image "${value}"`}
            />
          )}
          {fileType === FileType.VIDEO && (
            <video id={`${field.id}_preview`} controls={true}>
              <source src={fileUrl} type={VIDEO_TYPES_BY_EXT[fileExt]} />
            </video>
          )}
          {fileType === FileType.AUDIO && (
            <div className={"audio-wrapper"}>
              <audio id={`${field.id}_preview`} controls={true}>
                <source src={fileUrl} type={AUDIO_TYPES_BY_EXT[fileExt]} />
              </audio>
            </div>
          )}
          {fileType === FileType.PDF && (
            <div className={"pdf-wrapper"}>
              <iframe
                id={`${field.id}_preview`}
                src={`${fileUrl}#view=fit&page=1&toolbar=0&navpanes=0`}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { FileField };
