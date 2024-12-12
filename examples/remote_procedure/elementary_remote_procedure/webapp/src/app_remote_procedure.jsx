/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { MephistoApp } from "mephisto-addons";
import {
  MephistoContext,
  PROVIDER_TYPE,
  useMephistoRemoteProcedureTask,
} from "mephisto-core";
import React from "react";
import ReactDOM from "react-dom";
import {
  ElementaryRemoteProcedureTaskFrontend,
  LoadingScreen,
} from "./components/core_components_remote_procedure.jsx";

function App() {
  let mephistoProps = useMephistoRemoteProcedureTask();

  let {
    blockedExplanation,
    blockedReason,
    handleFatalError,
    handleSubmit,
    initialTaskData,
    isLoading,
    isOnboarding,
    isPreview,
    previewHtml,
    providerType,
    remoteProcedure,
    taskConfig,
  } = mephistoProps;

  const handleRemoteCall = remoteProcedure("handle_with_model");

  const isInhouseProvider = providerType === PROVIDER_TYPE.INHOUSE;

  let _initialTaskData = initialTaskData;
  if (initialTaskData && initialTaskData.hasOwnProperty("task_data")) {
    _initialTaskData = initialTaskData.task_data;
  }

  if (isOnboarding) {
    // TODO You can use this as an opportunity to display anything you want for
    // an onboarding agent

    // At the moment, this task has no onboarding
    return <h1>This task doesn't currently have an onboarding example set</h1>;
  }

  if (blockedReason !== null) {
    return <h1>{blockedExplanation}</h1>;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isPreview && !isInhouseProvider) {
    if (!taskConfig?.has_preview) {
      return (
        <div className={"preview-screen"}>
          <div
            dangerouslySetInnerHTML={{
              __html: taskConfig?.task_description,
            }}
          />
        </div>
      );
    }

    if (previewHtml === null) {
      return <div>Loading...</div>;
    }

    return <div dangerouslySetInnerHTML={{ __html: previewHtml }} />;
  }

  return (
    <MephistoApp
      handleFatalError={handleFatalError}
      hasTaskSpecificData={!!_initialTaskData?.has_data}
      providerType={providerType}
    >
      <MephistoContext.Provider value={mephistoProps}>
        <div className={"container"} id={"ui-container"}>
          <ElementaryRemoteProcedureTaskFrontend
            taskData={initialTaskData}
            handleRemoteCall={handleRemoteCall}
            handleSubmit={handleSubmit}
          />
        </div>
      </MephistoContext.Provider>
    </MephistoApp>
  );
}

ReactDOM.render(<App />, document.getElementById("app"));
