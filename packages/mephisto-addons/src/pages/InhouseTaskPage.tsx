/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from "react";

type InhouseTaskPagePropsType = {
  children: React.ReactNode;
  hasTaskSpecificData: boolean;
};

export default function InhouseTaskPage({
  children,
  hasTaskSpecificData,
}: InhouseTaskPagePropsType) {
  // In case of visiting home page but without any GET-parameters,
  // we greet a worker and aske them to go to the welcome page
  // where the worker can type their username
  // and after that be redirected on a correct task page
  if (!hasTaskSpecificData) {
    return (
      <div className={"container text-center mt-xl-5"}>
        <h2 className={"mb-xl-5"}>Welcome to Mephisto</h2>

        <div>
          <a href={"/welcome"}>Click here</a> to proceed to your tasks.
        </div>
      </div>
    );
  }

  // If all GET-parameters were passed and server returned task data, render passed task components
  return children;
}
