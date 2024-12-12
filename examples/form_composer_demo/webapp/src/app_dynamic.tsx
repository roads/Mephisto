/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { MephistoApp } from "mephisto-addons";
import { useMephistoTask } from "mephisto-core";
import * as React from "react";
import * as ReactDOM from "react-dom";
import {
  FormComposerBaseFrontend,
  LoadingScreen,
} from "./components/core_components_dynamic";

function App() {
  const {
    handleFatalError,
    handleSubmit,
    initialTaskData,
    isLoading,
    providerType,
  }: {
    handleFatalError: Function;
    handleSubmit: Function;
    initialTaskData: ConfigTaskType;
    isLoading: boolean;
    providerType: string;
  } = useMephistoTask();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <MephistoApp
      handleFatalError={handleFatalError}
      hasTaskSpecificData={!!initialTaskData?.form}
      providerType={providerType}
    >
      <FormComposerBaseFrontend
        taskData={initialTaskData}
        onSubmit={handleSubmit}
        onError={handleFatalError}
      />
    </MephistoApp>
  );
}

ReactDOM.render(<App />, document.getElementById("app"));
