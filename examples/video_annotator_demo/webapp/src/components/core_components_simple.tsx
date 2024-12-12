/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { VideoAnnotator } from "mephisto-addons";
import * as React from "react";

type DirectionsPropsType = {
  children: React.ReactNode;
};

function Directions({ children }: DirectionsPropsType) {
  return (
    <section className="text-center" data-cy="directions-container">
      <div className="alert alert-primary">
        <div className="container">
          <h2>{children}</h2>
        </div>
      </div>
    </section>
  );
}

function LoadingScreen() {
  return <Directions>Loading...</Directions>;
}

type VideoAnnotatorBaseFrontendPropsType = {
  taskData: ConfigTaskType;
  onSubmit?: Function;
  onError?: Function;
  finalResults?: AnotatorResultsType;
};

function VideoAnnotatorBaseFrontend({
  taskData,
  onSubmit,
  onError,
  finalResults = null,
}: VideoAnnotatorBaseFrontendPropsType) {
  const initialConfigAnnotatorData: ConfigAnnotatorType = taskData?.annotator;

  if (!initialConfigAnnotatorData) {
    return (
      <div>
        Passed video annotator data is invalid... Recheck your task config.
      </div>
    );
  }

  return (
    <div>
      <VideoAnnotator
        data={initialConfigAnnotatorData}
        onSubmit={(data: AnnotationTracksListedType) => {
          onSubmit({ tracks: data });
        }}
        finalResults={finalResults}
      />
    </div>
  );
}

export { VideoAnnotatorBaseFrontend, LoadingScreen };
