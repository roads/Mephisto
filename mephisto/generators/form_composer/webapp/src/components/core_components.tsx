/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as customTriggers from "custom-triggers";
import * as customValidators from "custom-validators";
import {
  FormComposer,
  prepareFormData,
  prepareRemoteProcedures,
} from "mephisto-addons";
import * as React from "react";

function NoDataErrorsMessage() {
  return (
    <div>
      Could not render the form due to invalid configuration. We're sorry,
      please return the task.
    </div>
  );
}

function RenderingErrorsMessage() {
  return (
    <div>
      Sorry, we could not render the page. Please try to restart this task (or
      cancel it).
    </div>
  );
}

type DirectionsPropsType = {
  children: React.ReactNode;
};

function Directions({ children }: DirectionsPropsType) {
  return (
    <section className="hero is-light" data-cy="directions-container">
      <div className="hero-body">
        <div className="container">
          <p className="subtitle is-5">{children}</p>
        </div>
      </div>
    </section>
  );
}

function LoadingScreen() {
  return <Directions>Loading...</Directions>;
}

function LoadingPresignedUrlsScreen() {
  return <Directions>Please wait, rendering form...</Directions>;
}

type FormComposerBaseFrontendPropsType = {
  taskData: ConfigTaskType;
  onSubmit?: Function;
  onError?: Function;
  finalResults?: FormComposerResultsType;
  remoteProcedure?: RemoteProcedureCollectionType;
};

function FormComposerBaseFrontend({
  taskData,
  onSubmit,
  onError,
  finalResults = null,
  remoteProcedure,
}: FormComposerBaseFrontendPropsType) {
  const [loadingData, setLoadingData] = React.useState<boolean>(false);
  const [renderingErrors, setRenderingErrors] = React.useState<string[]>(null);
  const [formData, setFormData] = React.useState<ConfigTaskType>(null);

  const inReviewState: boolean = ![undefined, null].includes(finalResults);
  const initialConfigFormData: ConfigFormType = taskData?.form;

  if (!inReviewState) {
    prepareRemoteProcedures(remoteProcedure);
  }

  // ----- Effects -----

  React.useEffect(() => {
    if (inReviewState) {
      setFormData(initialConfigFormData);
    } else {
      prepareFormData(
        taskData,
        setFormData,
        setLoadingData,
        setRenderingErrors
      );
    }
  }, [taskData?.form]);

  if (!initialConfigFormData) {
    return <NoDataErrorsMessage />;
  }

  if (loadingData) {
    return <LoadingPresignedUrlsScreen />;
  }

  if (renderingErrors) {
    return <RenderingErrorsMessage />;
  }

  return (
    <div>
      {formData && (
        <FormComposer
          data={formData}
          onSubmit={onSubmit}
          finalResults={finalResults}
          setRenderingErrors={setRenderingErrors}
          customValidators={customValidators}
          customTriggers={customTriggers}
        />
      )}
    </div>
  );
}

export { LoadingScreen, FormComposerBaseFrontend };
