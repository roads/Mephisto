/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from "react";

type ReviewAppPropsType = {
  FrontendComponent: React.ComponentClass<{
    taskData: MessageReviewDataType["REVIEW_DATA"]["inputs"];
    finalResults: MessageReviewDataType["REVIEW_DATA"]["outputs"];
  }>;
};

export default function ReviewApp({ FrontendComponent }: ReviewAppPropsType) {
  const appRef = React.useRef<HTMLDivElement>(null);
  const [reviewData, setReviewData] = React.useState<
    MessageReviewDataType["REVIEW_DATA"]
  >(null);

  // Requirement #1. Render review components after receiving Task data via message
  window.onmessage = function (e: MessageEvent) {
    const data: MessageReviewDataType = JSON.parse(e.data);
    setReviewData(data["REVIEW_DATA"]);
  };

  // Requirement #2. Resize iframe height to fit its content
  React.useLayoutEffect(() => {
    function updateSize() {
      if (appRef.current) {
        window.top.postMessage(
          JSON.stringify({
            IFRAME_DATA: {
              height: appRef.current.offsetHeight,
            },
          }),
          "*"
        );
      }
    }
    window.addEventListener("resize", updateSize);
    updateSize();
    // HACK: Catch-all resize, if normal resizes failed (e.g. slow acync loading of images)
    setTimeout(() => {
      updateSize();
    }, 3000);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Requirement #3. This component must return a div with `ref={appRef}`
  // so we can get displayed height of this component (for iframe resizing)
  return (
    <div ref={appRef}>
      {reviewData ? (
        <FrontendComponent
          taskData={reviewData["inputs"]}
          finalResults={reviewData["outputs"]}
        />
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}
