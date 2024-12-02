/*
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

import { ReviewApp } from "mephisto-addons";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { FormComposerBaseFrontend } from "./components/core_components_simple";

ReactDOM.render(
  <ReviewApp FrontendComponent={FormComposerBaseFrontend} />,
  document.getElementById("app")
);
