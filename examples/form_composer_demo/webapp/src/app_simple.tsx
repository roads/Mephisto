/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { WelcomePage, WorkerOpinion } from "mephisto-addons";
import {
  ErrorBoundary,
  isWorkerOpinionEnabled,
  useMephistoTask,
} from "mephisto-core";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import {
  FormComposerBaseFrontend,
  LoadingScreen,
  OnboardingComponent,
} from "./components/core_components_simple";

let WITH_WORKER_OPINION: boolean = isWorkerOpinionEnabled();

/* ================= Application Components ================= */

type HomePagePropsType = {
  isLoading?: boolean;
  initialTaskData: ConfigTaskType;
  handleSubmit: Function;
  handleFatalError: Function;
  isOnboarding: boolean;
  resonseSubmitted: boolean;
  setResonseSubmitted: React.Dispatch<React.SetStateAction<boolean>>;
};

function HomePage({
  handleFatalError,
  handleSubmit,
  initialTaskData,
  isOnboarding,
  resonseSubmitted,
  setResonseSubmitted,
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
    <>
      <FormComposerBaseFrontend
        taskData={initialTaskData}
        isOnboarding={isOnboarding}
        onSubmit={(data: FormComposerResultsType) => {
          setResonseSubmitted(true);
          handleSubmit(data);
        }}
        onError={handleFatalError}
      />

      {WITH_WORKER_OPINION && resonseSubmitted && (
        <div className={"mx-auto mt-lg-5 mb-lg-5"} style={{ width: "600px" }}>
          <WorkerOpinion
            maxTextLength={500}
            questions={["Was this task hard?", "Is this a good example?"]}
          />
        </div>
      )}
    </>
  );
}

function MainApp() {
  const {
    isLoading,
    initialTaskData,
    handleFatalError,
    handleSubmit,
    isOnboarding,
    blockedExplanation,
    blockedReason,
  }: {
    isLoading: boolean;
    initialTaskData: ConfigTaskType;
    handleSubmit: Function;
    handleFatalError: Function;
    isOnboarding: boolean;
    blockedExplanation: string;
    blockedReason: string;
  } = useMephistoTask();

  const [resonseSubmitted, setResonseSubmitted] = React.useState<boolean>(
    false
  );

  React.useEffect(() => {
    if (resonseSubmitted) {
      // Scroll to the bollom of the page to reveal Worker Opinion block
      window.scrollTo(0, document.body.scrollHeight);
    }
  }, [resonseSubmitted]);

  if (blockedReason !== null) {
    return (
      <div className="card bg-danger mb-4">
        <div className="card-body pt-xl-5 pb-xl-5">
          <h2 className="text-white">{blockedExplanation}</h2>
        </div>
      </div>
    );
  }

  if (isOnboarding) {
    return <OnboardingComponent onSubmit={handleSubmit} />;
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
                isOnboarding={isOnboarding}
                resonseSubmitted={resonseSubmitted}
                setResonseSubmitted={setResonseSubmitted}
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
