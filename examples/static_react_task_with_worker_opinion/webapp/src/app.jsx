/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { MephistoApp } from "mephisto-addons";
import { PROVIDER_TYPE, useMephistoTask } from "mephisto-core";
import React from "react";
import ReactDOM from "react-dom";
import {
  Instructions,
  LoadingScreen,
  OnboardingComponent,
  StaticReactTaskFrontend,
} from "./components/core_components.jsx";

function App() {
  const {
    blockedExplanation,
    blockedReason,
    handleFatalError,
    handleSubmit,
    initialTaskData,
    isLoading,
    isOnboarding,
    isPreview,
    providerType,
  } = useMephistoTask();

  const isInhouseProvider = providerType === PROVIDER_TYPE.INHOUSE;

  if (blockedReason !== null) {
    return (
      <div className="card bg-danger mb-4">
        <div className="card-body pt-xl-5 pb-xl-5">
          <h2 className="text-white">{blockedExplanation}</h2>
        </div>
      </div>
    );
  }

  if (isPreview && !isInhouseProvider) {
    return <Instructions />;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isOnboarding) {
    return <OnboardingComponent onSubmit={handleSubmit} />;
  }

  return (
    <MephistoApp
      handleFatalError={handleFatalError}
      hasTaskSpecificData={!!initialTaskData?.text}
      providerType={providerType}
    >
      <Instructions />

      <StaticReactTaskFrontend
        taskData={initialTaskData}
        onSubmit={handleSubmit}
        isOnboarding={isOnboarding}
        onError={handleFatalError}
      />
    </MephistoApp>
  );
}

ReactDOM.render(<App />, document.getElementById("app"));
