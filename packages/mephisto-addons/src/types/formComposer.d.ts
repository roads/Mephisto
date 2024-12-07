/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

declare type ConfigFormType = { [key: string]: any };

declare type ConfigItemType = { [key: string]: any };

declare type ConfigTriggerType = string | Array<any>;

declare type ConfigTriggersType = {
  [key: string]: ConfigTriggerType;
};

declare type ConfigValidatorType = string | number | boolean | Array<any>;

declare type ConfigValidatorsType = {
  [key: string]: ConfigValidatorType;
};

declare interface DefaultConfigSectionType {
  classes?: string;
  collapsable?: boolean;
  id?: string;
  initially_collapsed?: boolean;
  instruction?: string;
  name?: string;
  title?: string;
  triggers?: ConfigTriggersType;
}

declare type ConfigSectionType = DefaultConfigSectionType & {
  fieldsets: ConfigFieldSetType[];
};

declare type ConfigFieldSetType = {
  classes?: string;
  help?: string;
  id?: string;
  instruction?: string;
  lookup_name?: string;
  name?: string;
  rows: ConfigRowType[];
  title?: string;
};

declare type ConfigRowType = {
  classes?: string;
  fields: ConfigFieldType[];
  help?: string;
  id?: string;
};

interface ConfigCommonFieldType {
  classes?: string;
  classes_input_element?: string;
  help?: string;
  icon?: string;
  id?: string;
  label: string;
  name: string;
  placeholder?: string;
  tooltip?: string;
  triggers?: ConfigTriggersType;
  type: string;
  validators?: ConfigValidatorsType;
  value?: string | object | Array<string | number>;
}

declare interface ConfigInputFieldType extends ConfigCommonFieldType {}

declare interface ConfigTextareaFieldType extends ConfigCommonFieldType {}

declare type OptionType = {
  checked?: boolean;
  label: string;
  value: string;
};

declare interface ConfigCheckboxFieldType extends ConfigCommonFieldType {
  options: OptionType[];
  value?: { [key: string]: boolean };
}

declare interface ConfigRadioFieldType extends ConfigCommonFieldType {
  options: OptionType[];
}

declare interface ConfigSelectFieldType extends ConfigCommonFieldType {
  multiple: boolean;
  options: OptionType[];
  value?: string | Array<string | number>;
}

declare interface ConfigFileFieldType extends ConfigCommonFieldType {
  show_preview: boolean;
}

declare interface ConfigHiddenFieldType extends ConfigCommonFieldType {}

declare interface ConfigButtonFieldType extends ConfigCommonFieldType {}

declare type ConfigFieldType =
  | ConfigInputFieldType
  | ConfigTextareaFieldType
  | ConfigCheckboxFieldType
  | ConfigRadioFieldType
  | ConfigSelectFieldType
  | ConfigFileFieldType
  | ConfigHiddenFieldType
  | ConfigButtonFieldType;

declare type ConfigSubmitButtonType = {
  classes?: string;
  classes_button_element?: string;
  id?: string;
  instruction?: string;
  text: string;
  tooltip?: string;
  triggers?: ConfigTriggersType;
};

declare type FieldsErrorsType = { [key: string]: string[] };

declare type SectionsFieldsType = { [key: number]: ConfigFieldType[] };

declare type FormFieldsType = { [key: string]: ConfigFieldType };

declare type FileFieldValueType = { name: string };
declare type CheckboxFieldValueType = object;
declare type SelectFieldValueType = string[];

declare type FieldValueType =
  | string
  | number
  | SelectFieldValueType
  | number[]
  | CheckboxFieldValueType
  | FileFieldValueType;

declare type FormStateType = { [key: string]: FieldValueType };

declare type FormatStringWithTokensType = (
  str: string,
  errorCallback?: React.Dispatch<React.SetStateAction<string[]>>
) => string;

declare type SubmitFormType = (e?: React.UIEvent<HTMLElement>) => void;

declare type UpdateFormDataType = (
  fieldName: string,
  value: FieldValueType,
  e?:
    | React.UIEvent<HTMLElement>
    | React.ChangeEvent<HTMLElement>
    | React.FocusEvent<HTMLInputElement>
) => void;

declare type SetRenderingErrorsType = React.Dispatch<
  React.SetStateAction<string[]>
>;

declare type DynamicConfigSectionType = DefaultConfigSectionType & {
  fieldsets: { [key: string]: ConfigFieldSetType };
};

declare type DynamicFormElementsConfigType = {
  disables: { [key: string]: boolean };
  loadings: { [key: string]: boolean };
  sections: { [key: string]: DynamicConfigSectionType };
};

declare type FormComposerResultsType = FormStateType;

declare type FileInfoType = {
  lastModified: string | number;
  name: string;
  size: number;
  type: string;
  file: File;
};

declare type SetDynamicFormElementsConfigType = React.Dispatch<
  React.SetStateAction<DynamicFormElementsConfigType>
>;

declare type ValidatorFunctionsByConfigNameType = { [key: string]: Function };

declare type ValidatorsResultsType = { [key: string]: string[] };

declare type RemoteProcedureCollectionType = (functionName: string) => Function;
