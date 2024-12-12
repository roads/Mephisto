/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from "react";
import {
  FormComposer,
  prepareFormData,
  prepareRemoteProcedures,
} from "mephisto-addons";

// Required import for custom validators
import * as customValidators from "custom-validators";
// Required import for custom triggers
import * as customTriggers from "custom-triggers";

function NoFormDataErrorsMessage() {
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
    <div className="card mb-4">
      <div className="card-body container">{children}</div>
    </div>
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
  setTaskSubmitData: SetTaskSubmitDataType;
};

function FormComposerBaseFrontend({
  taskData,
  onSubmit,
  onError,
  finalResults = null,
  remoteProcedure,
  setTaskSubmitData,
}: FormComposerBaseFrontendPropsType) {
  const [loadingFormData, setLoadingFormData] = React.useState<boolean>(false);
  const [formData, setFormData] = React.useState<ConfigTaskType>(null);
  const [
    formComposerRenderingErrors,
    setFormComposerRenderingErrors,
  ] = React.useState(null);

  let initialConfigFormData: ConfigFormType = taskData?.form;

  prepareRemoteProcedures(remoteProcedure);

  React.useEffect(() => {
    prepareFormData(
      taskData,
      setFormData,
      setLoadingFormData,
      setFormComposerRenderingErrors
    );
  }, [taskData?.form]);

  if (!initialConfigFormData) {
    return <NoFormDataErrorsMessage />;
  }

  if (loadingFormData) {
    return <LoadingPresignedUrlsScreen />;
  }

  if (formComposerRenderingErrors) {
    return <RenderingErrorsMessage />;
  }

  return (
    <div>
      {formData && (
        <FormComposer
          data={formData}
          onSubmit={onSubmit}
          setTaskSubmitData={setTaskSubmitData}
          finalResults={finalResults}
          setRenderingErrors={setFormComposerRenderingErrors}
          remoteProcedureCollection={remoteProcedure}
          // Required for custom validators
          customValidators={customValidators}
          // Required for custom triggers
          customTriggers={customTriggers}
        />
      )}
    </div>
  );
}

export { LoadingScreen, FormComposerBaseFrontend };
