/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from "react";
import "./SubmitButtonBlock.css";

type SubmitButtonBlockPropsType = {
  data: ConfigSubmitButtonType;
  inReviewState: boolean;
  invalidFormFields: FieldsErrorsType;
  onClick: () => void;
  submitLoading: boolean;
  submitSuccessText: React.ReactNode;
};

function SubmitButtonBlock({
  data,
  inReviewState,
  invalidFormFields,
  onClick,
  submitLoading,
  submitSuccessText,
}: SubmitButtonBlockPropsType) {
  return (
    <>
      {data && !inReviewState && (
        <div className={`${data.classes || ""}`} id={data.id}>
          <hr className={`form-buttons-separator`} />

          {submitLoading ? (
            // Banner of success
            <div
              className={`alert alert-success centered mx-auto col-12 col-sm-8 ml-2 mr-2`}
            >
              Thank you!
              <br />
              Your form has been submitted.
              {submitSuccessText}
            </div>
          ) : (
            <>
              {/* Button instruction */}
              {data.instruction && (
                <div
                  className={`alert alert-light centered mx-auto col-12 col-sm-8 ml-2 mr-2`}
                  dangerouslySetInnerHTML={{
                    __html: data.instruction,
                  }}
                ></div>
              )}

              {/* Submit button */}
              <div className={`form-buttons container`}>
                <button
                  className={`button-submit btn ${
                    data.classes_button_element || "btn-success"
                  }`}
                  type={"submit"}
                  title={data.tooltip}
                  onClick={onClick}
                >
                  {data.text}
                </button>
              </div>
            </>
          )}

          {/* Additional reminder to correct form errors above */}
          {!!Object.keys(invalidFormFields).length && (
            <div
              className={`alert alert-danger centered mx-auto col-6 ml-2 mr-2`}
            >
              Please correct validation errors in the form
            </div>
          )}
        </div>
      )}
    </>
  );
}

export { SubmitButtonBlock };
