/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-select/dist/css/bootstrap-select.min.css";
import "./app_dynamic";
import "./css/style.css";

// To import custom styles added by users in `insertions` directory
// we search for all CSS files in that directory and import them dynamically during webpack build
function importAll(context: __WebpackModuleApi.RequireContext) {
  context.keys().forEach(context);
}

const cssInsertions: __WebpackModuleApi.RequireContext = require.context(
  process.env.WEBAPP__GENERATOR__INSERTIONS_DIR,
  true,
  /\.css$/i
);
importAll(cssInsertions);
