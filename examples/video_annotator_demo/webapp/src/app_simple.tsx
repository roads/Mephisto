/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { WelcomePage } from "mephisto-addons";
import { ErrorBoundary, useMephistoTask } from "mephisto-core";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import {
  LoadingScreen,
  VideoAnnotatorBaseFrontend,
} from "./components/core_components_simple";

/* ================= Application Components ================= */

type HomePagePropsType = {
  initialTaskData: ConfigAnnotatorType;
  handleSubmit: Function;
  handleFatalError: Function;
};

function HomePage({
  initialTaskData,
  handleSubmit,
  handleFatalError,
}: HomePagePropsType) {
  // In case of visiting home page but without any GET-parameters
  if (!initialTaskData?.annotator) {
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
    <>
      <VideoAnnotatorBaseFrontend
        taskData={initialTaskData}
        onSubmit={handleSubmit}
        onError={handleFatalError}
      />
    </>
  );
}

function MainApp() {
  const {
    isLoading,
    initialTaskData,
    handleFatalError,
    handleSubmit,
    blockedExplanation,
    blockedReason,
  }: {
    isLoading: boolean;
    initialTaskData: ConfigAnnotatorType;
    handleSubmit: Function;
    handleFatalError: Function;
    blockedExplanation: string;
    blockedReason: string;
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
                initialTaskData={initialTaskData}
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
