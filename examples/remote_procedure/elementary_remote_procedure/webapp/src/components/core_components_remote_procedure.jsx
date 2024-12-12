/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";

function Directions({ children }) {
  return (
    <div className={"card mb-4"}>
      <div className={"card-body container"}>{children}</div>
    </div>
  );
}

function LoadingScreen() {
  return <Directions>Loading...</Directions>;
}

function Instructions() {
  return (
    <div className={"mb-5"}>
      <h1 data-cy={"directions-header"}>
        Elementary example of remote procedure
      </h1>

      <h5 data-cy={"subheader-paragraph"}>
        This is a simple task to demonstrate communication with the server
      </h5>

      <p data-cy={"directions-paragraph"}>
        To submit this task, you must make a few backend queries first
      </p>
    </div>
  );
}

function ElementaryRemoteProcedureTaskFrontend({
  taskData,
  handleRemoteCall,
  handleSubmit,
  finalResults = null,
}) {
  const inReviewState = finalResults !== null;

  const [queryCount, setQueryCount] = React.useState(0);
  let canSubmit = queryCount > 3;

  const disabledQueryButton = inReviewState;
  const disabledSubmitButton = inReviewState || !canSubmit;

  if (!inReviewState && !taskData) {
    return <LoadingScreen />;
  }

  return (
    <div>
      {/* Final result of template example (needed only for TaskReview app) */}
      {inReviewState && (
        <div className={"alert alert-success mb-5 col-6"}>
          Task result: {finalResults.backendActionsDone}
        </div>
      )}

      <Instructions />

      <button
        className={"btn btn-primary me-3"}
        onClick={() => {
          setQueryCount(queryCount + 1);
          handleRemoteCall({
            arg1: "hello",
            arg2: "goodbye",
            arg3: queryCount,
          }).then((response) => alert(JSON.stringify(response)));
        }}
        disabled={disabledQueryButton}
        data-cy={"query-backend-button"}
      >
        Query Backend
      </button>

      <button
        className={"btn btn-success"}
        onClick={() =>
          handleSubmit({
            backendActionsDone: queryCount,
          })
        }
        disabled={disabledSubmitButton}
        data-cy={"submit-button"}
      >
        Submit Task
      </button>
    </div>
  );
}

export { LoadingScreen, ElementaryRemoteProcedureTaskFrontend };
