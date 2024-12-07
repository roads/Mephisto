/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Popover } from "bootstrap";
import * as React from "react";
import { isMobile } from "react-device-detect";
import { MIN_SEGMENT_WIDTH_MOBILE_PX, MIN_SEGMENT_WIDTH_PX } from "./constants";
import { secontsToTime } from "./helpers";
import "./TrackSegment.css";

type TrackSegmentPropsType = {
  duration: number;
  isSelectedAnnotationTrack: boolean;
  onClickSegment: (
    e: React.MouseEvent<HTMLDivElement>,
    segmentIndex: number
  ) => void;
  paddingLeft: number;
  playerSizes: PlayerSizesType;
  segment: SegmentType;
  segmentIndex: number;
  segmentIsValid: boolean;
  segmentsColor: string;
  selectedSegment: number;
};

function TrackSegment({
  duration,
  isSelectedAnnotationTrack,
  onClickSegment,
  paddingLeft,
  playerSizes,
  segment,
  segmentIndex,
  segmentIsValid,
  segmentsColor,
  selectedSegment,
}: TrackSegmentPropsType) {
  const segmentRef = React.useRef<HTMLDivElement>(null);

  const isSelectedSegment: boolean =
    isSelectedAnnotationTrack &&
    String(selectedSegment) === String(segmentIndex);

  const isClickable: boolean = segmentIsValid && !isMobile;

  let oneSecWidthPx: number = 0;
  if (isMobile) {
    // For mobile devices we use width of our progress bar, not VideoJS
    const parentElement: HTMLElement = segmentRef?.current?.closest(
      ".segments"
    );
    const progressBarElement: HTMLElement = parentElement?.querySelector(
      ".progress-bar"
    );
    if (progressBarElement) {
      oneSecWidthPx =
        progressBarElement.getBoundingClientRect().width / duration;
    }
  } else {
    // For desktops, we use width of VideoJS's progress bar
    if (playerSizes.progressBar?.width) {
      oneSecWidthPx = playerSizes.progressBar.width / duration;
    }
  }

  const leftPositionPx: number =
    paddingLeft + segment.start_sec * oneSecWidthPx;
  let segmentWidthPx: number =
    (segment.end_sec - segment.start_sec) * oneSecWidthPx;

  // in case segment is too narrow, we need to make it a bit vissible
  const minSegmentWidthPx: number = isMobile
    ? MIN_SEGMENT_WIDTH_MOBILE_PX
    : MIN_SEGMENT_WIDTH_PX;
  if (segmentWidthPx < minSegmentWidthPx) {
    segmentWidthPx = minSegmentWidthPx;
  }

  const segmentId: string = `id-segment-${segmentIndex}`;

  const popoverSegmentProps: PopoverPropsType = isMobile
    ? {}
    : {
        "data-html": true,
        "data-placement": "top",
        "data-content": `
      <span>
        Time: <b>${secontsToTime(segment.start_sec)} - ${secontsToTime(
          segment.end_sec
        )}</b>
      </span>
    `,
        "data-toggle": "popover",
        "data-trigger": "hover",
      };

  // ----- Effects -----
  React.useEffect(() => {
    const popovers = [
      ...document.querySelectorAll(`#${segmentId}[data-toggle="popover"]`),
    ].map((el: HTMLElement) => new Popover(el));

    return () => {
      popovers.map((p: Popover) => p.dispose());
    };
  }, []);

  return (
    <div
      className={`
        segment
        ${isSelectedSegment ? "active" : ""}
        ${isClickable ? "" : "non-clickable"}
      `}
      id={segmentId}
      style={{
        width: `${segmentWidthPx}px`,
        left: `${leftPositionPx}px`,
        backgroundColor: `var(--${segmentsColor}-color)`,
      }}
      onClick={(e: React.MouseEvent<HTMLDivElement>) =>
        onClickSegment(e, segmentIndex)
      }
      ref={segmentRef}
      // HACK to pass values into event listeners as them cannot read updated React states
      data-startsec={segment.start_sec}
      data-endsec={segment.end_sec}
      // Popover props
      {...popoverSegmentProps}
    />
  );
}

export default TrackSegment;
