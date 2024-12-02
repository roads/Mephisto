/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from "react";
import "./Row.css";

type RowPropsType = {
  children: React.ReactNode;
  data: ConfigRowType;
  formatStringWithTokens: FormatStringWithTokensType;
  setRenderingErrors: SetRenderingErrorsType;
};

function Row({
  children,
  data,
  formatStringWithTokens,
  setRenderingErrors,
}: RowPropsType) {
  const help: string = formatStringWithTokens(data.help, setRenderingErrors);

  return (
    <div className={`row ${data.classes || ""}`} id={data.id}>
      {/* Fields */}
      {children}

      {help && (
        <div
          className={`row-help container`}
          dangerouslySetInnerHTML={{ __html: help }}
        ></div>
      )}
    </div>
  );
}

export { Row };
