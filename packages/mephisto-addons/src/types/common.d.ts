/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

declare type ConfigTaskType = { [key: string]: any };

declare type CustomTriggersType = { [key: string]: Function };

declare type CustomValidatorsType = { [key: string]: Function };

declare type CustomTriggersElementType =
  | ConfigSectionType
  | ConfigFieldType
  | ConfigSubmitButtonType;

declare type SetTaskSubmitDataType = React.Dispatch<
  React.SetStateAction<{ [key: string]: any }>
>;
