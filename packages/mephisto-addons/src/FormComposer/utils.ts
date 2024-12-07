/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { cloneDeep } from "lodash";
import * as React from "react";
import { replaceAll } from "../helpers";
import {
  FieldType,
  TOKEN_END_REGEX,
  TOKEN_END_SYMBOLS,
  TOKEN_START_REGEX,
  TOKEN_START_SYMBOLS,
} from "./constants";

// This list can be expanded if needed
const ACCEPTED_SCALAR_TRIGGER_ARGUMENT_TYPES: string[] = [
  "string",
  "boolean",
  "number",
  "object",
];

// TODO: Remove this after finding out what is the problem
//  with not sending `agent_id` under `subject_id` field in websocket message
export const WAIT_FOR_AGENT_ID_MSEC: number = 1000;

let tokenProcedureResultMapping: object = {};

const procedureRegex: RegExp = /(.*?)/;
const optionalSpacesRegex: RegExp = /\s*/;
const openingRegex: RegExp = new RegExp(
  TOKEN_START_REGEX.source + optionalSpacesRegex.source,
  "gi"
);
const closingRegex: RegExp = new RegExp(
  optionalSpacesRegex.source + TOKEN_END_REGEX.source,
  "gi"
);
export const procedureTokenRegex: RegExp = new RegExp(
  openingRegex.source + procedureRegex.source + closingRegex.source,
  "gi"
);

export const ProcedureName: { [key: string]: string } = {
  GET_MULTIPLE_PRESIGNED_URLS: "getMultiplePresignedUrls",
  GET_PRESIGNED_URL: "getPresignedUrl",
};

let urlToTokenProcedureMapping: { [key: string]: string } = {};

export function formatStringWithProcedureTokens(
  str: string,
  errorCallback: Function
): string {
  if (!str || typeof str !== "string") {
    return str;
  }

  if (str.includes(TOKEN_START_SYMBOLS) && str.includes(TOKEN_END_SYMBOLS)) {
    let _string: string = str;

    // Find array of pairs [[<token with brackets>, <procedure code with arguments>], ...]
    const matches: RegExpMatchArray[] = [...str.matchAll(procedureTokenRegex)];

    // Request all procedures and associate them with map key (token for this procedure)
    matches.forEach((match: RegExpMatchArray) => {
      const entireToken: string = match[0];

      // If we already have this token in map, we do not request it again
      if (!tokenProcedureResultMapping.hasOwnProperty(entireToken)) {
        const procedureCleanString: string = match[1].trim();
        const procedureName: string = procedureCleanString.split("(")[0];

        // If there's no global procedure (in `window`) with the name from the token,
        // we just skip the evaluation, and return the raw token string.
        // Normally all procedures must be defined as global vars before the form begins to render
        if (!window.hasOwnProperty(procedureName)) {
          console.error(`Could not find remote procedure ${procedureName}`);
          return str;
        }

        // Lookup the procedure in global variables and call it (note: all procedures are Promises)
        const procedurePromise: Promise<any> = eval(
          "window." + procedureCleanString
        );

        procedurePromise
          .then((response) => {
            tokenProcedureResultMapping[entireToken] = response;
          })
          .catch((error: any) => {
            if (errorCallback) {
              errorCallback(error);
            }
            console.error(
              `Could not get remote response for '${procedureName}'`,
              error
            );
          });
      }
    });

    // Override tokens with values received from the server
    Object.keys(tokenProcedureResultMapping).forEach((token: string) => {
      _string = replaceAll(_string, token, tokenProcedureResultMapping[token]);
    });

    return _string;
  }

  return str;
}

export function getFormatStringWithTokensFunction(
  inReviewState: boolean
): FormatStringWithTokensType {
  const func = inReviewState
    ? (v, _) => {
        return v;
      } // Return value as is, ignoring whole formatting
    : formatStringWithProcedureTokens;

  return func;
}

export function getUrlsFromString(
  str: string,
  mapping: { [key: string]: string }
): string[] {
  let urls: string[] = [];

  if (str.includes(TOKEN_START_SYMBOLS) && str.includes(TOKEN_END_SYMBOLS)) {
    // Find array of pairs [[<token with brackets>, <procedure code with arguments>], ...]
    const matches: RegExpMatchArray[] = [...str.matchAll(procedureTokenRegex)];
    matches.forEach((match: RegExpMatchArray) => {
      const entireToken: string = match[0];
      const procedureCodeClean: string = match[1].trim();

      if (
        procedureCodeClean.includes(ProcedureName.GET_MULTIPLE_PRESIGNED_URLS)
      ) {
        const procedureCodeWithUrlMatches: RegExpMatchArray[] = [
          ...procedureCodeClean.matchAll(/\(\"(.+?)\"\)/gi),
        ];
        if (
          procedureCodeWithUrlMatches.length &&
          procedureCodeWithUrlMatches[0].length === 2
        ) {
          const procedureCodeUrl: string = procedureCodeWithUrlMatches[0][1];
          urls.push(procedureCodeUrl);
          mapping[procedureCodeUrl] = entireToken;
        }
      }
    });
  }

  return [...new Set(urls)];
}

export function _getAllUrlsToPresign(formConfig: ConfigItemType): string[] {
  let urls = new Set<string>();

  function _extractUrlsToPresignFromConfigItem(configItem: ConfigItemType) {
    Object.values(configItem).forEach((value: FieldValueType) => {
      if (typeof value === "string") {
        const valueUrls: string[] = getUrlsFromString(
          value,
          urlToTokenProcedureMapping
        );
        if (valueUrls.length) {
          urls = new Set([...urls, ...valueUrls]);
        }
      }
    });
  }

  // Any form object (form, section, field, etc.) whose attributes can contain tokens
  const configItemsToFindUrls: ConfigItemType[] = [];
  configItemsToFindUrls.push(formConfig);
  formConfig.sections.map((section: ConfigSectionType) => {
    configItemsToFindUrls.push(section);
    section.fieldsets.map((fieldset: ConfigFieldSetType) => {
      configItemsToFindUrls.push(fieldset);
      fieldset.rows.map((row: ConfigRowType) => {
        configItemsToFindUrls.push(row);
        row.fields.map((field: ConfigFieldType) => {
          configItemsToFindUrls.push(field);
        });
      });
    });
  });

  configItemsToFindUrls.forEach((formItem: ConfigItemType) => {
    _extractUrlsToPresignFromConfigItem(formItem);
  });

  return [...urls];
}

export function _replaceUrlsWithPresignedUrlsInFormData(
  taskData: ConfigTaskType,
  presignedUrls: Array<[string, string]>
): ConfigTaskType {
  function _replaceTokensWithUrlsConfigItem(
    configItem: ConfigItemType,
    originalUrl: string,
    presignedUrl: string
  ) {
    Object.entries(configItem).forEach(
      ([key, value]: [string, FieldValueType]) => {
        if (typeof value === "string") {
          const token: string = urlToTokenProcedureMapping[originalUrl];
          if (token) {
            configItem[key] = replaceAll(value, token, presignedUrl);
          }
        }
      }
    );
  }

  let _taskData: ConfigTaskType = cloneDeep(taskData);
  presignedUrls.forEach(([originalUrl, presignedUrl]: [string, string]) => {
    // Any form object (form, section, field, etc.) whose attributes can contain tokens
    const configItemsToFindUrls: ConfigItemType[] = [];

    configItemsToFindUrls.push(_taskData.form);

    _taskData.form.sections.forEach((section: ConfigSectionType) => {
      configItemsToFindUrls.push(section);
      section.fieldsets.map((fieldset: ConfigFieldSetType) => {
        configItemsToFindUrls.push(fieldset);
        fieldset.rows.map((row: ConfigRowType) => {
          configItemsToFindUrls.push(row);
          row.fields.map((field: ConfigFieldType) => {
            configItemsToFindUrls.push(field);
          });
        });
      });
    });

    configItemsToFindUrls.forEach((formItem: ConfigItemType) => {
      _replaceTokensWithUrlsConfigItem(formItem, originalUrl, presignedUrl);
    });

    return _taskData;
  });

  return _taskData;
}

function _prepareFormDataWithUrlsToPresign(
  taskConfigData: ConfigTaskType,
  setFormDataState: React.Dispatch<React.SetStateAction<ConfigFormType>>,
  setLoadingFormDataState: React.Dispatch<React.SetStateAction<boolean>>,
  setFormComposerRenderingErrorsState: React.Dispatch<
    React.SetStateAction<string>
  >
) {
  // Get URLs to presign from the whole config
  const urlsToPresign: string[] = _getAllUrlsToPresign(taskConfigData.form);

  // If there's nothing to do, just set initial config as is
  if (!urlsToPresign.length) {
    setFormDataState(taskConfigData.form);
    return false;
  }

  // Procedure `getMultiplePresignedUrls` must be set up to perform this preparation
  if (!window.hasOwnProperty(ProcedureName.GET_MULTIPLE_PRESIGNED_URLS)) {
    console.error(
      `'${ProcedureName.GET_MULTIPLE_PRESIGNED_URLS}' function was not defined on the server side.`
    );
    return false;
  }

  // Enable preloader
  setLoadingFormDataState(true);

  // Make a request to the server. Note: timeout is a hack (see the comment next to the constant)
  setTimeout(() => {
    window
      // @ts-ignore We added this function into `window` on previous steps
      .getMultiplePresignedUrls({ urls: urlsToPresign })
      .then((response) => {
        setLoadingFormDataState(false);

        if (Array.isArray(response)) {
          const updatedTaskData: ConfigTaskType = _replaceUrlsWithPresignedUrlsInFormData(
            taskConfigData,
            response
          );
          setFormDataState(updatedTaskData.form);
        } else {
          console.log(
            "Incorrect data returned from remote procedure `getMultiplePresignedUrls`"
          );
        }
      })
      .catch((error: any) => {
        setLoadingFormDataState(false);
        setFormComposerRenderingErrorsState(String(error));
      });
  }, WAIT_FOR_AGENT_ID_MSEC);
}

export function prepareFormData(
  taskConfigData: ConfigTaskType,
  setFormDataState: React.Dispatch<React.SetStateAction<ConfigFormType>>,
  setLoadingFormDataState: React.Dispatch<React.SetStateAction<boolean>>,
  setFormComposerRenderingErrorsState: React.Dispatch<
    React.SetStateAction<string>
  >
) {
  // 1. Presign URLs
  _prepareFormDataWithUrlsToPresign(
    taskConfigData,
    setFormDataState,
    setLoadingFormDataState,
    setFormComposerRenderingErrorsState
  );

  // 2. TODO: Add additional steps here
}

function _prepareRemoteProceduresForPresignUrls(
  remoteProcedureCollection: RemoteProcedureCollectionType
) {
  if (!remoteProcedureCollection) {
    return;
  }

  window[ProcedureName.GET_PRESIGNED_URL] = remoteProcedureCollection(
    ProcedureName.GET_PRESIGNED_URL
  );
  window[ProcedureName.GET_MULTIPLE_PRESIGNED_URLS] = remoteProcedureCollection(
    ProcedureName.GET_MULTIPLE_PRESIGNED_URLS
  );
}

export function prepareRemoteProcedures(
  remoteProcedureCollection: RemoteProcedureCollectionType
) {
  // 1. Presign URLs
  _prepareRemoteProceduresForPresignUrls(remoteProcedureCollection);

  // 2. TODO: Add additional steps here
}

export function setPageTitle(title: string) {
  const titleElement: HTMLElement = document.querySelector("title");
  titleElement.innerText = title;
}

export function isObjectEmpty(_object: object): boolean {
  return Object.keys(_object).length === 0;
}

export function runCustomTrigger({
  // Args used in this util
  elementTriggersConfig, // 'triggers' value defined in 'unit_config.json' file
  elementTriggerName, // Name of a trigger
  customTriggers, // Collection of custom trigger functions
  // Args passed directly into the trigger function
  formData, // React state for the entire form
  updateFormData, // callback to set the React state
  element, // "field", "section", or "submit button" element that invoked this trigger
  fieldValue, // (optional) Current field value, if the `element` is a form field
  formFields, // (optional) Object containing all form fields as defined in 'unit_config.json'
  remoteProcedureCollection, // (optional) Collection or remote procedures
  setDynamicFormElementsConfig, // (optional) Setter for React state with dynamic elements
  setInvalidFormFields, // (optional) Setter for React state with form fields errors
  setSubmitErrors, // (optional) Setter for React state with form submit errors
  setSubmitSuccessText, // (optional) Setter for React state with success text next to submit button
  submitForm, // (optional) Function that submits form
  validateForm, // (optional) Function that validates whole form
}: {
  elementTriggersConfig: ConfigTriggersType;
  elementTriggerName: string;
  customTriggers: CustomTriggersType;
  formData: FormStateType;
  updateFormData: UpdateFormDataType;
  element: CustomTriggersElementType;
  fieldValue?: FieldValueType;
  formFields?: FormFieldsType;
  remoteProcedureCollection?: RemoteProcedureCollectionType;
  setDynamicFormElementsConfig?: SetDynamicFormElementsConfigType;
  setInvalidFormFields?: React.Dispatch<React.SetStateAction<FieldsErrorsType>>;
  setSubmitErrors?: React.Dispatch<React.SetStateAction<string[]>>;
  setSubmitSuccessText?: React.Dispatch<React.SetStateAction<string>>;
  submitForm?: SubmitFormType;
  validateForm?: Function;
}) {
  // Exit if the element that doesn't have any triggers defined (no logs required)
  if (!elementTriggersConfig || isObjectEmpty(elementTriggersConfig)) {
    return;
  }

  const elementTriggerConfig: ConfigTriggerType =
    elementTriggersConfig[elementTriggerName];

  // Exit if the element doesn't have this specific triggers defined (no logs required)
  if (!elementTriggerConfig) {
    return;
  }

  // Exit if the element has this trigger set, but custom triggers were not passed
  if (!customTriggers) {
    console.error(
      `Ignoring trigger "${elementTriggerName}" invokation - no custom triggers passed.`
    );
    return;
  }

  // Extract name of custom trigger function from the trigger config.
  // Exit if trigger config doesn't contain custom function name
  let triggerFnName: string;

  const triggerConfigIsArray: boolean = Array.isArray(elementTriggerConfig);
  const triggerConfigIsScalar: boolean =
    !triggerConfigIsArray && // because `typeof <array> === "object"`
    ACCEPTED_SCALAR_TRIGGER_ARGUMENT_TYPES.includes(
      typeof elementTriggerConfig
    );

  if (triggerConfigIsArray && [1, 2].includes(elementTriggerConfig.length)) {
    triggerFnName = elementTriggerConfig[0];
  } else if (triggerConfigIsScalar) {
    triggerFnName = elementTriggerConfig as any;
  } else {
    console.error(
      `Invalid format of trigger "${elementTriggerName}" config: ${elementTriggerConfig}. ` +
        `It must be either a string (function name), ` +
        `or a list (first element is function name, second element is its args).`
    );
    return;
  }

  // Get Custom trigger function
  const triggerFn: Function = customTriggers[triggerFnName];

  // Exit if the custom function was not defined
  if (!triggerFn) {
    console.error(
      `Function not found for trigger "${elementTriggerName}". ` +
        `Please ensure a functionwith that name is defined in 'custom_triggers.js' file ` +
        `and 'unit_config.json' indicates correct custom function name for this trigger config.`
    );
    return;
  }

  // Extract arguments of custom trigger function from the trigger config.
  let triggerFnArgs: Array<any>;
  if (triggerConfigIsScalar) {
    // If trigger config doesn't contain arguments, we just won't pass any trigger arguments
    triggerFnArgs = [];
  } else if (
    triggerConfigIsArray &&
    [1, 2].includes(elementTriggerConfig.length)
  ) {
    triggerFnArgs = elementTriggerConfig[1];
    // if trigger function arg is a scalar, turn it into a 1-item array, for consistency
    triggerFnArgs = Array.isArray(triggerFnArgs)
      ? triggerFnArgs
      : [triggerFnArgs];
  } else {
    console.error(
      `Trigger "${elementTriggerName}" config for "${elementTriggerName}" ` +
        `is longer than 2 items: ${elementTriggerConfig}`
    );
    return;
  }

  // Run custom trigger
  try {
    triggerFn({
      formData: formData,
      updateFormData: updateFormData,
      element: element,
      fieldValue: fieldValue,
      formFields: formFields,
      remoteProcedureCollection: remoteProcedureCollection,
      setDynamicFormElementsConfig: setDynamicFormElementsConfig,
      validateForm: validateForm,
      setInvalidFormFields: setInvalidFormFields,
      setSubmitErrors: setSubmitErrors,
      setSubmitSuccessText: setSubmitSuccessText,
      submitForm: submitForm,
      triggerArgs: triggerFnArgs,
    });
  } catch (error) {
    const textAboutElement = fieldValue
      ? `Field "${JSON.stringify(element)}" value: ${fieldValue}. `
      : `Element config name: ${elementTriggerName}. `;
    console.error(
      `Running custom trigger error. ` +
        textAboutElement +
        `Element trigger name: ${elementTriggerName}. ` +
        `Element trigger config: ${elementTriggerConfig}. ` +
        `Trigger function name: ${triggerFnName}. ` +
        `Trigger function args: ${triggerFnArgs}. ` +
        `Error: ${error}.`
    );
  }
}

export function getDefaultFormFieldValue(
  field: ConfigFieldType,
  initialFormData: FormComposerResultsType
): FieldValueType {
  if (initialFormData) {
    return initialFormData[field.name];
  }

  if (field.value !== undefined) {
    return field.value;
  }

  if (
    [
      FieldType.EMAIL,
      FieldType.HIDDEN,
      FieldType.INPUT,
      FieldType.NUMBER,
      FieldType.PASSWORD,
      FieldType.RADIO,
      FieldType.TEXTAREA,
    ].includes(field.type)
  ) {
    return "";
  } else if (field.type === FieldType.CHECKBOX) {
    const allItemsNotCheckedValue: { [key: string]: boolean } = Object.assign(
      {},
      ...field["options"].map((o: OptionType) => ({ [o.value]: !!o.checked }))
    );
    return allItemsNotCheckedValue;
  } else if (field.type === FieldType.SELECT) {
    return field["multiple"] ? [] : "";
  }

  return null;
}

/**
 * A helper function to check during development, that your custom triggers
 * assign correct values to form fields (in case you want to change them programmatically).
 * @param {object} field FormComposer field
 * @param {any} value FormComposer field value
 * @param {boolean} writeConsoleLog If `true`, writes detailed error logs in browser console
 * @return {boolean} If `true`, the field value is valid
 */
export function validateFieldValue(
  field: ConfigFieldType,
  value: FieldValueType,
  writeConsoleLog: boolean
): boolean {
  // No need to validate absence of value
  if ([null, undefined].includes(value)) {
    return true;
  }

  if ([null, undefined].includes(field)) {
    console.error(`Argument 'field' cannot be '${field}'.`);
    return false;
  }

  let valueIsValid: boolean = true;
  let logMessage: string = "";

  if (
    [
      FieldType.EMAIL,
      FieldType.HIDDEN,
      FieldType.INPUT,
      FieldType.NUMBER,
      FieldType.PASSWORD,
      FieldType.RADIO,
      FieldType.TEXTAREA,
    ].includes(field.type)
  ) {
    if (typeof value !== "string") {
      valueIsValid = false;
      logMessage = `Value must be a 'string' for field '${field.name}' with type '${field.type}'.`;
    } else {
      if (field.type === FieldType.RADIO) {
        const availableOptions: string[] = Object.values(field["options"]).map(
          (o: OptionType) => o.value
        );

        if (!availableOptions.includes(value)) {
          valueIsValid = false;
          logMessage =
            `Incorrect value for field '${field.name}' with type '${field.type}'. ` +
            `Available options: ${availableOptions}. `;
        }
      }
    }
  } else if (field.type === FieldType.CHECKBOX) {
    if (typeof value === "object" && !Array.isArray(value)) {
      const availableOptions: string[] = Object.values(field["options"]).map(
        (o: OptionType) => o.value
      );

      const allParamsAreBooleansWithCorrectOption: boolean = Object.entries(
        value
      ).every(([k, v]: [string, FieldValueType]) => {
        return availableOptions.includes(k) && typeof v === "boolean";
      });

      if (!allParamsAreBooleansWithCorrectOption) {
        valueIsValid = false;
        logMessage =
          `All value parameters must be 'boolean' ` +
          `for field '${field.name}' with type '${field.type}'. ` +
          `Available options: ${availableOptions}. `;
      }
    } else {
      valueIsValid = false;
      logMessage =
        `Value must be an 'object' with boolean parameters ` +
        `for field '${field.name}' with type '${field.type}'.`;
    }
  } else if (field.type === FieldType.SELECT) {
    if (field["multiple"]) {
      if (!Array.isArray(value)) {
        valueIsValid = false;
        logMessage =
          `Value must be an 'array' for field '${field.name}' with type '${field.type}' ` +
          `and '"multiple": true'.`;
      } else {
        const availableOptions: string[] = Object.values(field["options"]).map(
          (o: OptionType) => o.value
        );

        const allParamsAreStringsWithCorrectOption: boolean = value.every(
          (v: FieldValueType) => {
            return typeof v === "string" && availableOptions.includes(v);
          }
        );

        if (!allParamsAreStringsWithCorrectOption) {
          valueIsValid = false;
          logMessage =
            `All value parameters must be 'string' ` +
            `for field '${field.name}' with type '${field.type}' and '"multiple": true'. ` +
            `Available options: ${availableOptions}. `;
        }
      }
    } else {
      if (typeof value !== "string") {
        valueIsValid = false;
        logMessage =
          `Value must be a 'string' ` +
          `for field '${field.name}' with type '${field.type}' and '"multiple": false'.`;
      }
    }
  }

  if (writeConsoleLog && !valueIsValid && logMessage) {
    logMessage += ` You passed value '${JSON.stringify(
      value
    )}' with type '${typeof value}'`;
    console.error(logMessage);
  }

  if (writeConsoleLog && valueIsValid) {
    console.info(
      `Value '${JSON.stringify(value)}' for field '${field.name}' ` +
        `with type '${typeof value}' is valid`
    );
  }

  return valueIsValid;
}

/**
 * Prepare all main FormComposer states with data from sections
 * @param {array} formSections FormComposer sections from task config
 * @param {object} finalResults initial form data (e.g. it can be not empty in TaskReview app)
 * @param {Function} setSectionsFields Setter for `sectionsFields` state
 * @param {Function} setFormState Setter for `formState` state
 * @param {Function} setFormFields Setter for `formFields` state
 */
export function setInitialDataFromSections(
  formSections: ConfigSectionType[],
  finalResults: FormComposerResultsType,
  setSectionsFields: React.Dispatch<React.SetStateAction<SectionsFieldsType>>,
  setFormState: React.Dispatch<React.SetStateAction<FormStateType>>,
  setFormFields: React.Dispatch<React.SetStateAction<FormFieldsType>>
) {
  if (formSections.length) {
    const _fields: FormFieldsType = {};
    const initialFormData: FormStateType = {};

    formSections.map((section: ConfigSectionType, sectionIndex: number) => {
      const _sectionFields: ConfigFieldType[] = [];

      // Set fields to Form fields and Section fields
      section.fieldsets.map((fieldset: ConfigFieldSetType) => {
        // Do not add fields from dynamic fieldsets
        const fieldsetIsDynamic: boolean = !!fieldset.lookup_name;
        if (fieldsetIsDynamic) {
          return;
        }

        fieldset.rows.map((row: ConfigRowType) => {
          row.fields.map((field: ConfigFieldType) => {
            _fields[field.name] = field;
            initialFormData[field.name] = getDefaultFormFieldValue(
              field,
              finalResults
            );
            _sectionFields.push(field);
          });
        });
      });

      setSectionsFields((prevState: SectionsFieldsType) => {
        return {
          ...prevState,
          ...{ [sectionIndex]: _sectionFields },
        };
      });
    });

    setFormState(initialFormData);
    setFormFields(_fields);
  }
}

/**
 * Update all main FormComposer states with data from dynamic sections
 * @param {object} dynamicSections dynamic FormComposer sections from triggers
 * @param {array} formSections FormComposer sections from task config
 * @param {object} finalResults initial form data (e.g. it can be not empty in TaskReview app)
 * @param {object} formState actual form data
 * @param {Function} setSectionsFields Setter for `sectionsFields` state
 * @param {Function} setFormState Setter for `formState` state
 * @param {Function} setFormFields Setter for `formFields` state
 */
export function updateDataWithDynamicSections(
  dynamicSections: DynamicFormElementsConfigType["sections"],
  formSections: ConfigSectionType[],
  finalResults: FormStateType,
  formState: FormStateType,
  setSectionsFields: React.Dispatch<React.SetStateAction<SectionsFieldsType>>,
  setFormState: React.Dispatch<React.SetStateAction<FormStateType>>,
  setFormFields: React.Dispatch<React.SetStateAction<FormFieldsType>>
) {
  if (Object.keys(dynamicSections).length) {
    const newFields: FormFieldsType = {};
    const initialFormDataForNewFields: FormStateType = {};

    Object.entries(dynamicSections).map(
      ([sectionName, section]: [string, DynamicConfigSectionType]) => {
        let sectionIndex: number = formSections.length;
        formSections.map((section: ConfigSectionType, i: number) => {
          if (section.name === sectionName) {
            sectionIndex = i;
          }
        });
        const _sectionFields: ConfigFieldType[] = [];

        // Set fields to Form fields and Section fields
        Object.values(section.fieldsets).map((fieldset: ConfigFieldSetType) => {
          fieldset.rows.map((row: ConfigRowType) => {
            row.fields.map((field: ConfigFieldType) => {
              newFields[field.name] = field;
              const initialFieldValue: FieldValueType = formState[field.name];
              if (initialFieldValue === undefined) {
                initialFormDataForNewFields[
                  field.name
                ] = getDefaultFormFieldValue(field, finalResults);
              }
              _sectionFields.push(field);
            });
          });
        });

        setSectionsFields((prevState: SectionsFieldsType) => {
          const prevSection: ConfigFieldType[] = prevState[sectionIndex] || [];

          const updatedSectionFields: ConfigFieldType[] = [
            ...prevSection,
            ..._sectionFields,
          ];

          return {
            ...prevState,
            ...{ [sectionIndex]: updatedSectionFields },
          };
        });
      }
    );

    setFormState((prevState: FormStateType) => {
      return {
        ...prevState,
        ...initialFormDataForNewFields,
      };
    });
    setFormFields((prevState: FormFieldsType) => {
      return {
        ...prevState,
        ...newFields,
      };
    });
  }
}
