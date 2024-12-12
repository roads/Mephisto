/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { MephistoApp } from "mephisto-addons";
import { useMephistoRemoteProcedureTask } from "mephisto-core";
import * as React from "react";
import * as ReactDOM from "react-dom";
import {
  FormComposerBaseFrontend,
  LoadingScreen,
} from "./components/core_components_dynamic_remote_procedure";

function App() {
  const {
    handleFatalError,
    handleSubmit,
    initialTaskData,
    isLoading,
    providerType,
    remoteProcedure,
  }: {
    handleFatalError: Function;
    handleSubmit: Function;
    initialTaskData: ConfigTaskType;
    isLoading: boolean;
    providerType: string;
    remoteProcedure: RemoteProcedureCollectionType;
  } = useMephistoRemoteProcedureTask();

  if (isLoading) {
    return <LoadingScreen />;
  }

  let _initialTaskData: ConfigTaskType = initialTaskData;
  if (initialTaskData && initialTaskData.hasOwnProperty("task_data")) {
    _initialTaskData = initialTaskData.task_data;
  }

  return (
    <MephistoApp
      handleFatalError={handleFatalError}
      hasTaskSpecificData={!!_initialTaskData?.form}
      providerType={providerType}
    >
      <FormComposerBaseFrontend
        taskData={_initialTaskData}
        onSubmit={handleSubmit}
        onError={handleFatalError}
        remoteProcedure={remoteProcedure}
      />
    </MephistoApp>
  );
}

ReactDOM.render(<App />, document.getElementById("app"));
