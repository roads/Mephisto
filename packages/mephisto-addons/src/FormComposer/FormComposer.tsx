/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from "react";
import TaskInstructionModal from "../TaskInstructionModal/TaskInstructionModal";
import {
  DEFAULT_DYNAMIC_STATE,
  MESSAGES_IN_REVIEW_FILE_DATA_KEY,
} from "./constants";
import { Field } from "./Field";
import { FieldSet } from "./FieldSet";
import "./FormComposer.css";
import { FormErrors } from "./FormErrors";
import { FormHeaderBlock } from "./FormHeaderBlock";
import { Row } from "./Row";
import { Section } from "./Section";
import { SubmitButtonBlock } from "./SubmitButtonBlock";
import {
  getFormatStringWithTokensFunction,
  runCustomTrigger,
  setInitialDataFromSections,
  setPageTitle,
  updateDataWithDynamicSections,
} from "./utils";
import {
  prepareFormDataForSubmit,
  validateFormFields,
} from "./validation/helpers";

type FormComposerPropsType = {
  data: ConfigFormType;
  onSubmit: Function;
  finalResults: FormComposerResultsType;
  serverSubmitErrors: string[];
  setRenderingErrors: SetRenderingErrorsType;
  customValidators: CustomValidatorsType;
  customTriggers: CustomTriggersType;
  remoteProcedureCollection: RemoteProcedureCollectionType;
  setTaskSubmitData: React.Dispatch<React.SetStateAction<FormData>>;
};

function FormComposer({
  data,
  onSubmit,
  finalResults,
  serverSubmitErrors,
  setRenderingErrors,
  customValidators,
  customTriggers,
  remoteProcedureCollection,
  setTaskSubmitData,
}: FormComposerPropsType) {
  const formComposerConfig: ConfigFormType = data;

  // State to hide submit button
  const [submitLoading, setSubmitLoading] = React.useState<boolean>(false);

  // List of unexpected server error messages
  const [submitErrors, setSubmitErrors] = React.useState<string[]>([]);

  // Invalid fields (having error messages after form validation)
  const [invalidFormFields, setInvalidFormFields] = React.useState<
    ValidatorsResultsType
  >({});

  // Form data for submission
  const [formState, setFormState] = React.useState<FormStateType>({});

  // All fields lookup by their name: { <fieldName>: <field> }
  const [formFields, setFormFields] = React.useState<FormFieldsType>({});

  // Fild list by section index for error display: { <sectionIndex>: <Array<field>> }
  const [sectionsFields, setSectionsFields] = React.useState<
    SectionsFieldsType
  >({});

  // Form instruction modal state
  const [
    formInstructionModalOpen,
    setFormInstructionModalOpen,
  ] = React.useState<boolean>(false);

  // Dynamic form elements fonfigs
  const [
    dynamicFormElementsConfig,
    setDynamicFormElementsConfig,
  ] = React.useState<DynamicFormElementsConfigType>(DEFAULT_DYNAMIC_STATE);

  // Submit block success message
  const [submitSuccessText, setSubmitSuccessText] = React.useState<
    React.ReactNode
  >(
    <>
      Thank you!
      <br />
      Your form has been submitted.
    </>
  );

  // The name of a section which we currently work with
  const [
    currentlyWorkedOnSectionName,
    setcurrentlyWorkedOnSectionName,
  ] = React.useState<string>(null);

  const inReviewState: boolean = ![undefined, null].includes(finalResults);
  const formatStringWithTokens: FormatStringWithTokensType = getFormatStringWithTokensFunction(
    inReviewState
  );

  let formTitle: string = formatStringWithTokens(
    formComposerConfig.title,
    setRenderingErrors
  );
  let formInstruction: string = formatStringWithTokens(
    formComposerConfig.instruction,
    setRenderingErrors
  );
  let showFormInstructionAsModal: boolean =
    formComposerConfig.show_instructions_as_modal || false;
  let formSections: ConfigSectionType[] = formComposerConfig.sections;
  let formSubmitButton: ConfigSubmitButtonType =
    formComposerConfig.submit_button;

  // --- Methods ---

  function updateFormData(
    fieldName: string,
    value: FieldValueType,
    e: React.UIEvent<HTMLElement>
  ) {
    if (e) {
      e.preventDefault();
    }

    setFormState((prevState: FormStateType) => {
      return {
        ...prevState,
        ...{ [fieldName]: value },
      };
    });
  }

  function scrollToFirstInvalidSection() {
    // 1. Find a section which has errors
    let invalidSectionElement: HTMLElement = null;

    // 1a. Choose a section was marked as "currently worked on"
    if (currentlyWorkedOnSectionName) {
      invalidSectionElement = document.querySelectorAll<HTMLElement>(
        `section[data-name='${currentlyWorkedOnSectionName}']`
      )[0];
    }

    // 1b. If there's no such section, then choose the first one containing errors
    if (!invalidSectionElement) {
      const firstInvalidSectionElement: HTMLElement = document.querySelectorAll<
        HTMLElement
      >("section[data-invalid='true']")[0];
      invalidSectionElement = firstInvalidSectionElement;
    }

    // 2. In the chosen section, identify the first form field element containing errors
    let firstInvalidFieldElement: HTMLElement = null;
    if (invalidSectionElement) {
      firstInvalidFieldElement = invalidSectionElement.querySelectorAll<
        HTMLElement
      >(".field[data-invalid='true']")[0];
    }

    // 3. By default we're scrolling to the identified field
    if (firstInvalidFieldElement) {
      window.scrollTo(0, firstInvalidFieldElement.offsetTop);
    }
  }

  function validateForm(): boolean {
    // Clean error state in previously invalidated fields
    setInvalidFormFields({});

    // Set new invalid fields to show errors and highlight those fields
    const _invalidFormFields: ValidatorsResultsType = validateFormFields(
      formState,
      formFields,
      customValidators
    );
    setInvalidFormFields(_invalidFormFields);

    return !Object.keys(_invalidFormFields).length;
  }

  function onSubmitForm(e: React.UIEvent<HTMLFormElement>) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setcurrentlyWorkedOnSectionName(null);

    const formIsValid: boolean = validateForm();

    if (!formIsValid) {
      return;
    }

    const formData: FormData = prepareFormDataForSubmit(formState, formFields);

    setSubmitLoading(true);

    // Pass data to `mephisto-core` library
    onSubmit(formData);
  }

  function sendMessageToReviewAppWithFileInfo(
    filename: string,
    fieldname: string
  ) {
    // Send file field information to the Review app as a message from iframe
    window.top.postMessage(
      JSON.stringify({
        [MESSAGES_IN_REVIEW_FILE_DATA_KEY]: {
          fieldname: fieldname,
          filename: filename,
        },
      }),
      "*"
    );
  }

  function onClickSubmitButton() {
    if (inReviewState) {
      return;
    }

    runCustomTrigger({
      elementTriggersConfig: formSubmitButton.triggers,
      elementTriggerName: "onClick",
      customTriggers: customTriggers,
      formData: formState,
      updateFormData: updateFormData,
      element: formSubmitButton,
      fieldValue: formSubmitButton.text,
      formFields: formFields,
      remoteProcedureCollection: remoteProcedureCollection,
      setDynamicFormElementsConfig: setDynamicFormElementsConfig,
      setInvalidFormFields: setInvalidFormFields,
      setSubmitErrors: setSubmitErrors,
      validateForm: validateForm,
    });
  }

  // --- Effects ---
  React.useEffect(() => {
    setPageTitle(formTitle);
  }, [formTitle]);

  React.useEffect(() => {
    setInitialDataFromSections(
      formSections,
      finalResults,
      setSectionsFields,
      setFormState,
      setFormFields
    );
  }, [formSections]);

  React.useEffect(() => {
    updateDataWithDynamicSections(
      dynamicFormElementsConfig.sections,
      formSections,
      finalResults,
      formState,
      setSectionsFields,
      setFormState,
      setFormFields
    );
  }, [dynamicFormElementsConfig.sections]);

  React.useEffect(() => {
    if (Object.keys(invalidFormFields).length) {
      scrollToFirstInvalidSection();
    }
  }, [invalidFormFields]);

  React.useEffect(() => {
    if (serverSubmitErrors && serverSubmitErrors.length) {
      setSubmitErrors(serverSubmitErrors);
    }
  }, [serverSubmitErrors]);

  React.useEffect(() => {
    // In case if Auto-submission enabled
    if (setTaskSubmitData) {
      const formData: FormData = prepareFormDataForSubmit(
        formState,
        formFields
      );
      setTaskSubmitData(formData);
    }
  }, [formState]);

  return (
    <form
      className={`form-composer ${formComposerConfig.classes || ""}`}
      id={formComposerConfig.id}
      method={"POST"}
      noValidate={true}
      onSubmit={onSubmitForm}
    >
      <FormHeaderBlock
        instruction={formInstruction}
        instructionModalOpen={formInstructionModalOpen}
        setInstructionModalOpen={setFormInstructionModalOpen}
        showInstructionAsModal={showFormInstructionAsModal}
        title={formTitle}
      />

      {/* Accordion with collapsable sections */}
      <div className={`accordion`} id={`id_accordion`}>
        {/* Sections */}
        {formSections.map(
          (section: ConfigSectionType, sectionIndex: number) => {
            const dynamicFieldsets: { [key: string]: ConfigFieldSetType } =
              dynamicFormElementsConfig.sections[section.name]?.fieldsets || {};

            return (
              <Section
                customTriggers={customTriggers}
                data={section}
                formFields={formFields}
                formState={formState}
                formatStringWithTokens={formatStringWithTokens}
                inReviewState={inReviewState}
                index={sectionIndex}
                invalidFormFields={invalidFormFields}
                key={`section-${sectionIndex}`}
                remoteProcedureCollection={remoteProcedureCollection}
                sectionsFields={sectionsFields}
                setRenderingErrors={setRenderingErrors}
                updateFormData={updateFormData}
                setcurrentlyWorkedOnSectionName={
                  setcurrentlyWorkedOnSectionName
                }
              >
                {section.fieldsets.map(
                  (fieldset: ConfigFieldSetType, fieldsetIndex: number) => {
                    // Do not render dynamic fieldsets here
                    const fieldsetIsDynamic: boolean = !!fieldset.lookup_name;
                    if (fieldsetIsDynamic) {
                      return;
                    }

                    return (
                      <FieldSet
                        data={fieldset}
                        formatStringWithTokens={formatStringWithTokens}
                        key={`fieldset-${fieldsetIndex}`}
                        setRenderingErrors={setRenderingErrors}
                      >
                        {fieldset.rows.map(
                          (row: ConfigRowType, rowIndex: number) => {
                            return (
                              <Row
                                data={row}
                                formatStringWithTokens={formatStringWithTokens}
                                key={`row-${rowIndex}`}
                                setRenderingErrors={setRenderingErrors}
                              >
                                {row.fields.map(
                                  (
                                    field: ConfigFieldType,
                                    fieldIndex: number
                                  ) => {
                                    return (
                                      <Field
                                        customTriggers={customTriggers}
                                        data={field}
                                        finalResults={finalResults}
                                        formFields={formFields}
                                        formState={formState}
                                        formatStringWithTokens={
                                          formatStringWithTokens
                                        }
                                        inReviewState={inReviewState}
                                        invalidFormFields={invalidFormFields}
                                        key={`field-${fieldIndex}`}
                                        remoteProcedureCollection={
                                          remoteProcedureCollection
                                        }
                                        sendMessageToReviewAppWithFileInfo={
                                          sendMessageToReviewAppWithFileInfo
                                        }
                                        dynamicFormElementsConfig={
                                          dynamicFormElementsConfig
                                        }
                                        setDynamicFormElementsConfig={
                                          setDynamicFormElementsConfig
                                        }
                                        setInvalidFormFields={
                                          setInvalidFormFields
                                        }
                                        setRenderingErrors={setRenderingErrors}
                                        setSubmitErrors={setSubmitErrors}
                                        setSubmitSuccessText={
                                          setSubmitSuccessText
                                        }
                                        submitForm={onSubmitForm}
                                        updateFormData={updateFormData}
                                        validateForm={validateForm}
                                      />
                                    );
                                  }
                                )}
                              </Row>
                            );
                          }
                        )}
                      </FieldSet>
                    );
                  }
                )}

                {Object.entries(dynamicFieldsets).map(
                  ([fieldsetIndex, fieldset]: [string, ConfigFieldSetType]) => {
                    return (
                      <FieldSet
                        data={fieldset}
                        formatStringWithTokens={formatStringWithTokens}
                        key={`fieldset-${fieldsetIndex}`}
                        setRenderingErrors={setRenderingErrors}
                      >
                        {fieldset.rows.map(
                          (row: ConfigRowType, rowIndex: number) => {
                            return (
                              <Row
                                data={row}
                                formatStringWithTokens={formatStringWithTokens}
                                key={`row-${rowIndex}`}
                                setRenderingErrors={setRenderingErrors}
                              >
                                {row.fields.map(
                                  (
                                    field: ConfigFieldType,
                                    fieldIndex: number
                                  ) => {
                                    return (
                                      <Field
                                        customTriggers={customTriggers}
                                        data={field}
                                        finalResults={finalResults}
                                        formFields={formFields}
                                        formState={formState}
                                        formatStringWithTokens={
                                          formatStringWithTokens
                                        }
                                        inReviewState={inReviewState}
                                        invalidFormFields={invalidFormFields}
                                        key={`field-${fieldIndex}`}
                                        remoteProcedureCollection={
                                          remoteProcedureCollection
                                        }
                                        sendMessageToReviewAppWithFileInfo={
                                          sendMessageToReviewAppWithFileInfo
                                        }
                                        dynamicFormElementsConfig={
                                          dynamicFormElementsConfig
                                        }
                                        setDynamicFormElementsConfig={
                                          setDynamicFormElementsConfig
                                        }
                                        setInvalidFormFields={
                                          setInvalidFormFields
                                        }
                                        setRenderingErrors={setRenderingErrors}
                                        setSubmitErrors={setSubmitErrors}
                                        setSubmitSuccessText={
                                          setSubmitSuccessText
                                        }
                                        submitForm={onSubmitForm}
                                        updateFormData={updateFormData}
                                        validateForm={validateForm}
                                      />
                                    );
                                  }
                                )}
                              </Row>
                            );
                          }
                        )}
                      </FieldSet>
                    );
                  }
                )}
              </Section>
            );
          }
        )}
      </div>

      {/* Submit button and instructions */}
      <SubmitButtonBlock
        data={formSubmitButton}
        inReviewState={inReviewState}
        invalidFormFields={invalidFormFields}
        onClick={onClickSubmitButton}
        submitLoading={submitLoading}
        submitSuccessText={submitSuccessText}
      />

      {/* Unexpected server errors */}
      {!!submitErrors.length && <FormErrors errorMessages={submitErrors} />}

      {/* Modal with form instructions */}
      {showFormInstructionAsModal && formInstruction && (
        <TaskInstructionModal
          classNameDialog={`form-instruction-dialog`}
          instructions={
            <p
              className={`form-instruction`}
              dangerouslySetInnerHTML={{ __html: formInstruction }}
            ></p>
          }
          open={formInstructionModalOpen}
          setOpen={setFormInstructionModalOpen}
          title={"Task Instructions"}
        />
      )}
    </form>
  );
}

export { FormComposer };
