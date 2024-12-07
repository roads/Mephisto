/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from "react";
import * as ReactDOM from "react-dom";
import {
  VideoAnnotatorBaseFrontend,
  LoadingScreen,
} from "./components/core_components_dynamic";
import { useMephistoTask, ErrorBoundary } from "mephisto-core";

/* ================= Application Components ================= */

function MainApp() {
  const {
    isLoading,
    initialTaskData,
    handleSubmit,
    handleFatalError,
  }: {
    isLoading: boolean;
    initialTaskData: ConfigAnnotatorType;
    handleSubmit: Function;
    handleFatalError: Function;
  } = useMephistoTask();

  if (isLoading || !initialTaskData) {
    return <LoadingScreen />;
  }

  return (
    <div>
      <ErrorBoundary handleError={handleFatalError}>
        <VideoAnnotatorBaseFrontend
          taskData={initialTaskData}
          onSubmit={handleSubmit}
          onError={handleFatalError}
        />
      </ErrorBoundary>
    </div>
  );
}

ReactDOM.render(<MainApp />, document.getElementById("app"));
