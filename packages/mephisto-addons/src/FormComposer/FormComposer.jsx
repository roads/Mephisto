/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import TaskInstructionModal from "../TaskInstructionModal/TaskInstructionModal.jsx";
import {
  DEFAULT_DYNAMIC_STATE,
  MESSAGES_IN_REVIEW_FILE_DATA_KEY,
} from "./constants";
import { Field } from "./Field.jsx";
import { FieldSet } from "./FieldSet.jsx";
import "./FormComposer.css";
import { FormErrors } from "./FormErrors.jsx";
import { FormHeaderBlock } from "./FormHeaderBlock.jsx";
import { Row } from "./Row.jsx";
import { Section } from "./Section.jsx";
import { SubmitButtonBlock } from "./SubmitButtonBlock.jsx";
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

function FormComposer({
  data,
  onSubmit,
  finalResults,
  serverSubmitErrors,
  setRenderingErrors,
  customValidators,
  customTriggers,
  remoteProcedureCollection,
}) {
  const formComposerConfig = data;

  // State to hide submit button
  const [submitLoading, setSubmitLoading] = React.useState(false);

  // List of unexpected server error messages
  const [submitErrors, setSubmitErrors] = React.useState([]);

  // Invalid fields (having error messages after form validation)
  const [invalidFormFields, setInvalidFormFields] = React.useState({});

  // Form data for submission
  const [formState, setFormState] = React.useState({});

  // All fields lookup by their name: { <fieldName>: <field> }
  const [formFields, setFormFields] = React.useState({});

  // Fild list by section index for error display: { <sectionIndex>: <Array<field>> }
  const [sectionsFields, setSectionsFields] = React.useState({});

  // Form instruction modal state
  const [
    formInstructionModalOpen,
    setFormInstructionModalOpen,
  ] = React.useState(false);

  // Dynamic form elements fonfigs
  const [
    dynamicFormElementsConfig,
    setDynamicFormElementsConfig,
  ] = React.useState(DEFAULT_DYNAMIC_STATE);

  // Submit block success message
  const [submitSuccessText, setSubmitSuccessText] = React.useState(
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
  ] = React.useState(null);

  const inReviewState = finalResults !== null;
  const formatStringWithTokens = getFormatStringWithTokensFunction(
    inReviewState
  );

  let formTitle = formatStringWithTokens(
    formComposerConfig.title,
    setRenderingErrors
  );
  let formInstruction = formatStringWithTokens(
    formComposerConfig.instruction,
    setRenderingErrors
  );
  let showFormInstructionAsModal =
    formComposerConfig.show_instructions_as_modal || false;
  let formSections = formComposerConfig.sections;
  let formSubmitButton = formComposerConfig.submit_button;

  // --- Methods ---

  function updateFormData(fieldName, value, e) {
    if (e) {
      e.preventDefault();
    }

    setFormState((prevState) => {
      return {
        ...prevState,
        ...{ [fieldName]: value },
      };
    });
  }

  function scrollToFirstInvalidSection() {
    // 1. Find a section which has errors
    let invalidSectionElement = null;

    // 1a. Choose a section was marked as "currently worked on"
    if (currentlyWorkedOnSectionName) {
      invalidSectionElement = document.querySelectorAll(
        `section[data-name='${currentlyWorkedOnSectionName}']`
      )[0];
    }

    // 1b. If there's no such section, then choose the first one containing errors
    if (!invalidSectionElement) {
      const firstInvalidSectionElement = document.querySelectorAll(
        "section[data-invalid='true']"
      )[0];
      invalidSectionElement = firstInvalidSectionElement;
    }

    // 2. In the chosen section, identify the first form field element containing errors
    let firstInvalidFieldElement = null;
    if (invalidSectionElement) {
      firstInvalidFieldElement = invalidSectionElement.querySelectorAll(
        ".field[data-invalid='true']"
      )[0];
    }

    // 3. By default we're scrolling to the identified field
    if (firstInvalidFieldElement) {
      window.scrollTo(0, firstInvalidFieldElement.offsetTop);
    }
  }

  function validateForm() {
    // Clean error state in previously invalidated fields
    setInvalidFormFields({});

    // Set new invalid fields to show errors and highlight those fields
    const _invalidFormFields = validateFormFields(
      formState,
      formFields,
      customValidators
    );
    setInvalidFormFields(_invalidFormFields);

    return !Object.keys(_invalidFormFields).length;
  }

  function onSubmitForm(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setcurrentlyWorkedOnSectionName(null);

    const formIsValid = validateForm();

    if (!formIsValid) {
      return;
    }

    const formData = prepareFormDataForSubmit(formState, formFields);

    setSubmitLoading(true);

    // Pass data to `mephisto-core` library
    onSubmit(formData);
  }

  function sendMessageToReviewAppWithFileInfo(filename, fieldname) {
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
        {formSections.map((section, sectionIndex) => {
          const dynamicFieldsets =
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
              setcurrentlyWorkedOnSectionName={setcurrentlyWorkedOnSectionName}
            >
              {section.fieldsets.map((fieldset, fieldsetIndex) => {
                // Do not render dynamic fieldsets here
                const fieldsetIsDynamic = fieldset.lookup_name;
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
                    {fieldset.rows.map((row, rowIndex) => {
                      return (
                        <Row
                          data={row}
                          formatStringWithTokens={formatStringWithTokens}
                          key={`row-${rowIndex}`}
                          setRenderingErrors={setRenderingErrors}
                        >
                          {row.fields.map((field, fieldIndex) => {
                            return (
                              <Field
                                customTriggers={customTriggers}
                                data={field}
                                finalResults={finalResults}
                                formFields={formFields}
                                formState={formState}
                                formatStringWithTokens={formatStringWithTokens}
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
                                setInvalidFormFields={setInvalidFormFields}
                                setRenderingErrors={setRenderingErrors}
                                setSubmitErrors={setSubmitErrors}
                                setSubmitSuccessText={setSubmitSuccessText}
                                submitForm={onSubmitForm}
                                updateFormData={updateFormData}
                                validateForm={validateForm}
                              />
                            );
                          })}
                        </Row>
                      );
                    })}
                  </FieldSet>
                );
              })}

              {Object.entries(dynamicFieldsets).map(
                ([fieldsetIndex, fieldset]) => {
                  return (
                    <FieldSet
                      data={fieldset}
                      formatStringWithTokens={formatStringWithTokens}
                      key={`fieldset-${fieldsetIndex}`}
                      setRenderingErrors={setRenderingErrors}
                    >
                      {fieldset.rows.map((row, rowIndex) => {
                        return (
                          <Row
                            data={row}
                            formatStringWithTokens={formatStringWithTokens}
                            key={`row-${rowIndex}`}
                            setRenderingErrors={setRenderingErrors}
                          >
                            {row.fields.map((field, fieldIndex) => {
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
                                  setInvalidFormFields={setInvalidFormFields}
                                  setRenderingErrors={setRenderingErrors}
                                  setSubmitErrors={setSubmitErrors}
                                  setSubmitSuccessText={setSubmitSuccessText}
                                  submitForm={onSubmitForm}
                                  updateFormData={updateFormData}
                                  validateForm={validateForm}
                                />
                              );
                            })}
                          </Row>
                        );
                      })}
                    </FieldSet>
                  );
                }
              )}
            </Section>
          );
        })}
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
