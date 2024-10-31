/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import "./Row.css";

function Row({ children, data, formatStringWithTokens, setRenderingErrors }) {
  const help = formatStringWithTokens(data.help, setRenderingErrors);

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
