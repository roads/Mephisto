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
  LoadingScreen,
  VideoAnnotatorBaseFrontend,
} from "./components/core_components_simple";

function App() {
  const {
    blockedExplanation,
    blockedReason,
    handleFatalError,
    handleSubmit,
    initialTaskData,
    isLoading,
    providerType,
  }: {
    blockedExplanation: string;
    blockedReason: string;
    handleFatalError: Function;
    handleSubmit: Function;
    initialTaskData: ConfigAnnotatorType;
    isLoading: boolean;
    providerType: string;
  } = useMephistoTask();

  if (blockedReason !== null) {
    return (
      <div className="card bg-danger mb-4">
        <div className="card-body pt-xl-5 pb-xl-5">
          <h2 className="text-white">{blockedExplanation}</h2>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <MephistoApp
      handleFatalError={handleFatalError}
      hasTaskSpecificData={!!initialTaskData?.annotator}
      providerType={providerType}
    >
      <VideoAnnotatorBaseFrontend
        taskData={initialTaskData}
        onSubmit={handleSubmit}
        onError={handleFatalError}
      />
    </MephistoApp>
  );
}

ReactDOM.render(<App />, document.getElementById("app"));
