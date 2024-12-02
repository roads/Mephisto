/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from "react";

const DEFAULT_VALUE: string = "";

type HiddenFieldPropsType = {
  field: ConfigInputFieldType;
  formData: FormStateType;
  updateFormData: UpdateFormDataType;
  disabled: boolean;
};

function HiddenField({
  field,
  formData,
  updateFormData,
  disabled,
}: HiddenFieldPropsType) {
  const [value, setValue] = React.useState<string>(DEFAULT_VALUE);

  // --- Effects ---
  // Value in formData is updated
  React.useEffect(() => {
    setValue((formData[field.name] as string) || DEFAULT_VALUE);
  }, [formData[field.name]]);

  return (
    // bootstrap classes:
    //  - form-control

    <>
      <input
        className={`
          form-control
        `}
        id={field.id}
        name={field.name}
        type={field.type}
        required={false}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          !disabled && updateFormData(field.name, e.target.value, e);
        }}
      />
    </>
  );
}

export { HiddenField };
