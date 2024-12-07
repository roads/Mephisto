/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ReviewApp } from "mephisto-addons";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { VideoAnnotatorBaseFrontend } from "./components/core_components_simple";

ReactDOM.render(
  <ReviewApp FrontendComponent={VideoAnnotatorBaseFrontend} />,
  document.getElementById("app")
);
