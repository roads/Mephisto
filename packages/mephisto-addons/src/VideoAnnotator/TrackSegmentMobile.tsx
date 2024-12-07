/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from "react";
import { secontsToTime } from "./helpers";
import "./TrackSegmentMobile.css";

type TrackSegmentMobilePropsType = {
  isSelectedAnnotationTrack: boolean;
  onClickSegment: (HTMLDivElement, number) => void;
  segment: SegmentType;
  segmentIndex: number;
  selectedSegment: number;
};

function TrackSegmentMobile({
  isSelectedAnnotationTrack,
  onClickSegment,
  segment,
  segmentIndex,
  selectedSegment,
}: TrackSegmentMobilePropsType) {
  const isSelectedSegment: boolean =
    isSelectedAnnotationTrack &&
    String(selectedSegment) === String(segmentIndex);

  return (
    <div
      className={`
        segment-mobile
        ${isSelectedSegment ? "text-dark" : "text-info"}
        mb-1
      `}
      key={`track-segment-button-${segmentIndex}`}
      onClick={(e: React.MouseEvent<HTMLDivElement>) =>
        onClickSegment(e, segmentIndex)
      }
    >
      <span className={`segment-title`}>{segment.title}</span>

      <span className={`segment-duration`}>
        ({secontsToTime(segment.start_sec)} - {secontsToTime(segment.end_sec)})
      </span>
    </div>
  );
}

export default TrackSegmentMobile;
