/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Fragment, useState } from "react";

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
      <h1 data-cy={"directions-header"}>Toxicity Detection Model</h1>

      <p data-cy={"directions-paragraph"}>
        In this task, you need to enter at least one sentence in the text box
        below. Then our model will calculate toxicity of the provided text.
      </p>
    </div>
  );
}

function ToxicityTaskFrontend({
  handleSubmit,
  handleToxicityCalculation,
  finalResults = null,
}) {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [toxicity, setToxicity] = useState(0);
  const [submitError, setSubmitError] = useState(null);

  const inReviewState = finalResults !== null;

  const disabled = inReviewState || isLoading;

  function calculateToxicity() {
    if (inReviewState) {
      return;
    }

    setIsLoading(true);

    handleToxicityCalculation({
      text: text,
    })
      .then((response) => {
        setSubmitError(null);
        setIsLoading(false);

        const parsedToxicity = parseFloat(response.toxicity);
        setToxicity(parsedToxicity);

        if (parsedToxicity <= 0.5) {
          handleSubmit({ toxicity: response.toxicity });
        } else {
          setResult(
            `The statement, "${text}," has a toxicity of:` +
              `${response.toxicity}. This message is too toxic to submit.`
          );
        }
      })
      .catch((err) => {
        setIsLoading(false);
        setSubmitError(err);
        console.error(err);
      });
  }

  return (
    <Fragment>
      {/* Final result of toxicity (only for TaskReview app) */}
      {inReviewState && (
        <div className={"alert alert-success mb-5 col-6"}>
          Toxicity result: {finalResults.toxicity}
        </div>
      )}

      <Instructions />

      <div>
        <div className={"mb-4"}>
          {/* Form */}
          <div className={"col-6 mb-3 ps-0 pe-0"}>
            <textarea
              className={"form-control"}
              placeholder={"Type your text here"}
              onChange={(e) => setText(e.target.value)}
              disabled={disabled}
              rows={4}
              data-cy={"detection-text-area"}
            />
          </div>

          <button
            className={"btn btn-primary mb-2"}
            type={"button"}
            disabled={disabled}
            onClick={() => calculateToxicity()}
            data-cy={"submit-button"}
          >
            {isLoading ? (
              <>
                <span
                  className={"spinner-border spinner-border-sm"}
                  aria-hidden={"true"}
                  data-cy={"loading-spinner"}
                />
                <span role={"status"}>Loading...</span>
              </>
            ) : (
              "Submit Task"
            )}
          </button>
        </div>

        {/* High result if toxicity alert */}
        {!submitError && toxicity > 0.5 && (
          <div
            className={"alert alert-danger col-6"}
            role={"alert"}
            data-cy={"toxicity-alert"}
          >
            {result}
          </div>
        )}

        {/* Error alert */}
        {submitError && (
          <div className={"alert alert-danger col-6"} role={"alert"}>
            {submitError?.reason}
          </div>
        )}
      </div>
    </Fragment>
  );
}

export { Instructions, LoadingScreen, ToxicityTaskFrontend };
