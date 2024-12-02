/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ErrorBoundary, useMephistoTask } from "mephisto-core";
import * as React from "react";
import * as ReactDOM from "react-dom";
import {
  FormComposerBaseFrontend,
  LoadingScreen,
} from "./components/core_components_dynamic";

/* ================= Application Components ================= */

function MainApp() {
  const {
    isLoading,
    initialTaskData,
    handleSubmit,
    handleFatalError,
  }: {
    isLoading: boolean;
    initialTaskData: ConfigTaskType;
    handleSubmit: Function;
    handleFatalError: Function;
  } = useMephistoTask();

  if (isLoading || !initialTaskData) {
    return <LoadingScreen />;
  }

  return (
    <div>
      <ErrorBoundary handleError={handleFatalError}>
        <FormComposerBaseFrontend
          taskData={initialTaskData}
          onSubmit={handleSubmit}
          onError={handleFatalError}
        />
      </ErrorBoundary>
    </div>
  );
}

ReactDOM.render(<MainApp />, document.getElementById("app"));
