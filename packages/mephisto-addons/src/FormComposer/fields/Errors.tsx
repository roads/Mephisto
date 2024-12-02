/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from "react";

type ErrorsPropsType = {
  className?: string;
  messages: string[];
};

export function Errors({ className, messages }: ErrorsPropsType) {
  return (
    // bootstrap classes:
    //  - invalid-feedback

    <>
      {messages && messages.length > 0 && (
        <div className={`invalid-feedback ${className || ""}`}>
          {messages.map((message: string, i: number) => {
            return <div key={`message-${i}`}>{message}</div>;
          })}
        </div>
      )}
    </>
  );
}
