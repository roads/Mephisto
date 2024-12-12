/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ErrorBoundary, PROVIDER_TYPE } from "mephisto-core";
import * as React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import InhouseTaskPage from "../pages/InhouseTaskPage";
import WelcomePage from "../pages/WelcomePage";

type MephistoAppPropsType = {
  children: React.ReactNode;
  handleFatalError: Function;
  hasTaskSpecificData: boolean;
  providerType?: string;
};

export default function MephistoApp({
  children,
  handleFatalError,
  hasTaskSpecificData,
  providerType,
}: MephistoAppPropsType) {
  const isInhouseProvider: boolean = providerType === PROVIDER_TYPE.INHOUSE;
  const hasWelcomePage: boolean = isInhouseProvider;

  let taskRouteElement: React.ReactNode = children;
  if (isInhouseProvider) {
    taskRouteElement = (
      <InhouseTaskPage hasTaskSpecificData={hasTaskSpecificData}>
        {children}
      </InhouseTaskPage>
    );
  }

  return (
    <BrowserRouter>
      <div>
        <ErrorBoundary handleError={handleFatalError}>
          <Routes>
            {hasWelcomePage ? (
              <Route path={"/welcome"} element={<WelcomePage />} />
            ) : null}

            <Route path={"/"} element={taskRouteElement} />
          </Routes>
        </ErrorBoundary>
      </div>
    </BrowserRouter>
  );
}
