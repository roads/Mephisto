/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { WelcomePage } from "mephisto-addons";
import { ErrorBoundary, useMephistoRemoteProcedureTask } from "mephisto-core";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import {
  FormComposerBaseFrontend,
  LoadingScreen,
} from "./components/core_components";

/* ================= Application Components ================= */

type HomePagePropsType = {
  handleFatalError: Function;
  handleSubmit: Function;
  initialTaskData: ConfigTaskType;
  remoteProcedure: RemoteProcedureCollectionType;
};

function HomePage({
  handleFatalError,
  handleSubmit,
  initialTaskData,
  remoteProcedure,
}: HomePagePropsType) {
  // In case of visiting home page but without any GET-parameters
  if (!initialTaskData?.form) {
    return (
      <div className={"container text-center mt-xl-5"}>
        <h2 className={"mb-xl-5"}>Welcome to Mephisto</h2>

        <div>
          <a href={"/welcome"}>Click here</a> to proceed to your tasks.
        </div>
      </div>
    );
  }

  // If all GET-parameters were passed and server returned task data
  return (
    <FormComposerBaseFrontend
      taskData={initialTaskData}
      onSubmit={handleSubmit}
      onError={handleFatalError}
      remoteProcedure={remoteProcedure}
    />
  );
}

function MainApp() {
  const {
    isLoading,
    initialTaskData,
    remoteProcedure,
    handleSubmit,
    handleFatalError,
  }: {
    isLoading: boolean;
    initialTaskData: ConfigTaskType;
    remoteProcedure: RemoteProcedureCollectionType;
    handleSubmit: Function;
    handleFatalError: Function;
  } = useMephistoRemoteProcedureTask();

  if (isLoading) {
    return <LoadingScreen />;
  }

  let _initialTaskData: ConfigTaskType = initialTaskData;
  if (initialTaskData && initialTaskData.hasOwnProperty("task_data")) {
    _initialTaskData = initialTaskData.task_data;
  }

  return (
    <div>
      <ErrorBoundary handleError={handleFatalError}>
        <Routes>
          <Route path="/welcome" element={<WelcomePage />} />

          <Route
            path="/"
            element={
              <HomePage
                handleFatalError={handleFatalError}
                handleSubmit={handleSubmit}
                initialTaskData={_initialTaskData}
                remoteProcedure={remoteProcedure}
              />
            }
          />
        </Routes>
      </ErrorBoundary>
    </div>
  );
}

ReactDOM.render(
  <BrowserRouter>
    <MainApp />
  </BrowserRouter>,
  document.getElementById("app")
);
