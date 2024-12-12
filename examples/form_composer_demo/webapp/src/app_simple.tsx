/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { MephistoApp, WorkerOpinion } from "mephisto-addons";
import { isWorkerOpinionEnabled, useMephistoTask } from "mephisto-core";
import * as React from "react";
import * as ReactDOM from "react-dom";
import {
  FormComposerBaseFrontend,
  LoadingScreen,
  OnboardingComponent,
} from "./components/core_components_simple";

let WITH_WORKER_OPINION: boolean = isWorkerOpinionEnabled();

function App() {
  const {
    blockedExplanation,
    blockedReason,
    handleFatalError,
    handleSubmit,
    initialTaskData,
    isLoading,
    isOnboarding,
    providerType,
  }: {
    blockedExplanation: string;
    blockedReason: string;
    handleFatalError: Function;
    handleSubmit: Function;
    initialTaskData: ConfigTaskType;
    isLoading: boolean;
    isOnboarding: boolean;
    providerType: string;
  } = useMephistoTask();

  const [responseSubmitted, setResponseSubmitted] = React.useState<boolean>(
    false
  );

  React.useEffect(() => {
    if (responseSubmitted) {
      // Scroll to the bollom of the page to reveal Worker Opinion block
      window.scrollTo(0, document.body.scrollHeight);
    }
  }, [responseSubmitted]);

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
    <MephistoApp
      handleFatalError={handleFatalError}
      hasTaskSpecificData={!!initialTaskData?.form}
      providerType={providerType}
    >
      <FormComposerBaseFrontend
        taskData={initialTaskData}
        isOnboarding={isOnboarding}
        onSubmit={(data: FormComposerResultsType) => {
          setResponseSubmitted(true);
          handleSubmit(data);
        }}
        onError={handleFatalError}
      />

      {WITH_WORKER_OPINION && responseSubmitted && (
        <div className={"mx-auto mt-lg-5 mb-lg-5"} style={{ width: "600px" }}>
          <WorkerOpinion
            maxTextLength={500}
            questions={["Was this task hard?", "Is this a good example?"]}
          />
        </div>
      )}
    </MephistoApp>
  );
}

ReactDOM.render(<App />, document.getElementById("app"));
