/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ReviewApp } from "mephisto-addons";
import React from "react";
import ReactDOM from "react-dom";
import { BaseFrontend } from "./components/core_components.jsx";

ReactDOM.render(
  <ReviewApp FrontendComponent={BaseFrontend} />,
  document.getElementById("app")
);
