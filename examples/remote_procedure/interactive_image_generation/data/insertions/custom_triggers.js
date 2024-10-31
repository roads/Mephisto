// NOTE: that `mephisto-addons` library must be set in webpack config as an alias.

function _getFieldsetIndexFromName(elementName) {
  return elementName.match(/__(.*)__/).pop();
}

function _getValueFromFormState(formData, fieldName, fieldsetIndex) {
  let fieldValue = null;
  Object.entries(formData).map(([name, value]) => {
    if (name.startsWith(fieldName) && name.endsWith(`__${fieldsetIndex}__`)) {
      fieldValue = value;
    }
  });
  return fieldValue;
}

function _setButtonLoading(setDynamicFormElementsConfig, buttonName, value) {
  setDynamicFormElementsConfig((prevState) => {
    const newLoadings = {
      ...prevState.loadings,
      ...{ [buttonName]: value },
    };

    return {
      ...prevState,
      ...{ loadings: newLoadings },
    };
  });
}

function _getFieldsetFieldNames(buttonName) {
  const currentFielsetHtmlElement = document
    .querySelector(`[name="${buttonName}"]`)
    .closest("fieldset");
  const fieldsElements = currentFielsetHtmlElement.querySelectorAll(".field");
  return [...fieldsElements].map((i) => i.dataset.name);
}

function _setFieldsetDisabled(setDynamicFormElementsConfig, buttonName, value) {
  const fieldNames = _getFieldsetFieldNames(buttonName);

  setDynamicFormElementsConfig((prevState) => {
    const newDisables = {
      ...prevState.disables,
      ...{ [buttonName]: value },
    };

    fieldNames.forEach((fieldName) => {
      newDisables[fieldName] = value;
    });

    return {
      ...prevState,
      ...{ disables: newDisables },
    };
  });
}

function _addNewFieldset(
  setDynamicFormElementsConfig,
  sectionName,
  fieldsetName,
  fieldsetConfig
) {
  setDynamicFormElementsConfig((prevState) => {
    const section = prevState.sections[sectionName] || {};

    const fieldsets = section.fieldsets || {};
    fieldsets[fieldsetName] = fieldsetConfig;
    section.fieldsets = fieldsets;

    const newSections = {
      ...prevState.sections,
      ...{ [sectionName]: section },
    };

    return {
      ...prevState,
      ...{ sections: newSections },
    };
  });
}

function _checkIfResponseHasErrors(
  response,
  buttonElement,
  setDynamicFormElementsConfig,
  setSubmitErrors,
  setInvalidFormFields,
  setSubmitSuccessText,
  submitForm
) {
  const errors = response.errors || [];
  const validationErrors = response.validation_errors || {};

  // Unexpected errors handling
  if (errors.length > 0) {
    // Got a server-side processing error.
    // Because the error isn't caused by direct Worker's action,
    // we should save Worker's submission (which includes paying them for the task),
    // and evaluate it later during Task resuls review.
    setSubmitSuccessText("Thank you for your attempt, form submitted.");
    submitForm();
    alert(
      `Unexpected errors happened:` +
        `\n - ${errors.join("\n - ")}` +
        `\n\nDo not worry, we submitted your job and it will be evaluated.`
    );
    return true;
  }

  // Validation errors handling
  if (Object.keys(validationErrors).length > 0) {
    const currentFieldnames = _getFieldsetFieldNames(buttonElement.name);
    const currentPromptFieldName = currentFieldnames.find((fn) =>
      fn.startsWith("prompt")
    );
    setInvalidFormFields({
      [currentPromptFieldName]: validationErrors["prompt"],
    });

    _setFieldsetDisabled(
      setDynamicFormElementsConfig,
      buttonElement.name,
      false
    );
    return true;
  }

  return false;
}

// --- Trigger function ---
export function requestNextFieldSet({
  formData, // React state for the entire form
  updateFormData, // callback to set the React state
  element, // "field", "section", or "submit button" element that invoked this trigger
  fieldValue, // (optional) current field value, if the `element` is a form field
  formFields, // Object containing all form fields as defined in 'unit_config.json'
  remoteProcedureCollection, // (optional) Collection or remote procedures
  setDynamicFormElementsConfig, // (optional) Setter for React state with dynamic elements
  validateForm, // (optional) Function that validates whole form
  setInvalidFormFields, // (optional) Setter for React state with form fields errors
  setSubmitErrors, // (optional) Setter for React state with form submit errors
  setSubmitSuccessText, // (optional) Setter for React state with success text next to submit button
  submitForm, // (optional) Function that submits form
  triggerArgs, // Trigger-specific arguments (taken from form config)
}) {
  // 1. Extract trigger arguments
  const [
    sectionName, // First argument from `unit_config`
    fieldsetLookupName, // Second argument from `unit_config`
  ] = triggerArgs;

  console.log(
    'Trigger "requestNextFieldSet" called with arguments: ',
    sectionName,
    fieldsetLookupName
  );

  // 2. See which button was pressed
  const currentButtonHtmlElement = document.querySelector(`#${element.id}`);
  const startButtonPressed = element.name === "start";
  const updateButtonPressed = !startButtonPressed;

  // 3. When we press "Start" or "Update" button, we validate full form and if it's not valid,
  // we wait for worker to fix all errors before continue
  const formIsValid = validateForm();
  if (!formIsValid) {
    return;
  }

  // 4. Set request data
  let score = 0;
  let prompt = "";

  if (startButtonPressed) {
    prompt = formData["prompt_0"];
  } else if (updateButtonPressed) {
    const currentFieldsetIndex = _getFieldsetIndexFromName(element.name);

    score = parseInt(
      _getValueFromFormState(formData, "score", currentFieldsetIndex)
    );
    prompt = _getValueFromFormState(formData, "prompt", currentFieldsetIndex);
  }

  // 5. Request for next fieldset
  const getNextFieldsetFn = remoteProcedureCollection("getNextFieldset");
  const requestArgs = {
    fieldset_lookup_name: fieldsetLookupName,
    prompt: prompt,
    score: score,
    section_name: sectionName,
  };

  // 6. Temprorarily disable current fieldset and the button
  _setButtonLoading(setDynamicFormElementsConfig, element.name, true);
  _setFieldsetDisabled(setDynamicFormElementsConfig, element.name, true);

  // 7. Make request
  getNextFieldsetFn(requestArgs)
    .then((response) => {
      console.log("Response from server: ", response);

      // 7.1. Disable loading on the button
      _setButtonLoading(setDynamicFormElementsConfig, element.name, false);

      // 7.2. Check if response has any error
      const hasErrors = _checkIfResponseHasErrors(
        response,
        element,
        setDynamicFormElementsConfig,
        setSubmitErrors,
        setInvalidFormFields,
        setSubmitSuccessText,
        submitForm
      );
      if (hasErrors) {
        return;
      }

      // 7.3. If task finished
      const hasFinished = response.finished;
      if (hasFinished) {
        if (response.submit_message) {
          setSubmitSuccessText(response.submit_message);
          submitForm();
        }
      }
      // 7.4. If server returns a new fieldset
      else {
        const nextFieldset = response.fieldset_config;
        const nextFieldsetName =
          `${sectionName}` +
          `.${nextFieldset.lookup_name}` +
          `.${response.current_answer_index}`;

        // Hide button row
        const currentRowHtmlElement = currentButtonHtmlElement.closest(".row");
        currentRowHtmlElement.style.display = "none";

        // Add new fieldset into dynamic state to show it in the UI
        _addNewFieldset(
          setDynamicFormElementsConfig,
          sectionName,
          nextFieldsetName,
          nextFieldset
        );
      }
    })
    .catch((error) => {
      // 7.5. Any unexpected js error during this request
      _setButtonLoading(setDynamicFormElementsConfig, element.name, false);
      _setFieldsetDisabled(setDynamicFormElementsConfig, element.name, false);
      console.log(`Calling remote procedure "getNextFieldset"  error: `, error);
    });
}
