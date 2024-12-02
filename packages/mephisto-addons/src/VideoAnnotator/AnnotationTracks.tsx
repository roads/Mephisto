/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { cloneDeep } from "lodash";
import * as React from "react";
import videojs from "video.js";
import AnnotationTrack from "./AnnotationTrack";
import "./AnnotationTracks.css";
import {
  INIT_ANNOTATION_TRACK,
  POPOVER_INVALID_SEGMENT_CLASS,
  POPOVER_INVALID_SEGMENT_PROPS,
} from "./constants";
import {
  convertAnnotationTasksDataObjectsToLists,
  convertInitialDataListsToObjects,
} from "./helpers";
// @ts-ignore
import Player = videojs.Player;
// @ts-ignore
import PlayerOptions = videojs.PlayerOptions;

type AnnotationTracksPropsType = {
  className?: string;
  customTriggers: CustomTriggersType;
  customValidators: CustomValidatorsType;
  duration: number;
  formatStringWithTokens: Function;
  inReviewState: boolean;
  onChange: (data: TrackListedType[]) => void;
  onSelectSegment: (segment: SegmentType) => void;
  player: Player;
  playerSizes: PlayerSizesType;
  segmentFields: SegmentFieldsType;
  segmentIsValid: boolean;
  setRenderingErrors: SetRenderingErrorsType;
  setSegmentValidation: React.Dispatch<
    React.SetStateAction<ValidatorsResultsType>
  >;
  setVideoPlayerChapters: React.Dispatch<React.SetStateAction<SegmentType[]>>;
  tracks: TrackListedType[];
};

function AnnotationTracks({
  className,
  customTriggers,
  customValidators,
  duration,
  formatStringWithTokens,
  inReviewState,
  onChange,
  onSelectSegment,
  player,
  playerSizes,
  segmentFields,
  segmentIsValid,
  setRenderingErrors,
  setSegmentValidation,
  setVideoPlayerChapters,
  tracks,
}: AnnotationTracksPropsType) {
  const [annotationTracks, setAnnotationTracks] = React.useState<
    AnnotationTracksObjectedType
  >(convertInitialDataListsToObjects(tracks));
  const [selectedAnnotationTrack, setSelectedAnnotationTrack] = React.useState<
    string
  >("0");

  // ----- Methods -----

  function onClickAnnotationTrack(
    e: React.MouseEvent<HTMLDivElement>,
    annotationTrack: TrackObjectedType,
    trackIndex: string
  ) {
    setSelectedAnnotationTrack(String(trackIndex));
    setVideoPlayerChapters(Object.values(annotationTrack.segments));
  }

  function onClickAddAnnotationTrack(e: React.MouseEvent<HTMLButtonElement>) {
    setAnnotationTracks((prevState: AnnotationTracksObjectedType) => {
      const newTrackIndex: number = Object.keys(prevState).length;
      const newTrackData: TrackObjectedType = cloneDeep(INIT_ANNOTATION_TRACK);
      newTrackData.title = `Track #${newTrackIndex + 1}`;
      setSelectedAnnotationTrack(String(newTrackIndex));
      return {
        ...prevState,
        ...{ [newTrackIndex]: newTrackData },
      };
    });
  }

  // ----- Effects -----

  React.useEffect(() => {
    const resultData: TrackListedType[] = convertAnnotationTasksDataObjectsToLists(
      annotationTracks
    );
    onChange && onChange(resultData);
  }, [annotationTracks]);

  return (
    <div
      className={`
        annotation-tracks
        mb-5
        ${className || ""}
      `}
    >
      {!inReviewState && (
        <div
          className={`
            tracks-buttons
            mb-2
            justify-content-end
            justify-content-sm-center
          `}
        >
          <button
            className={`
              btn
              btn-sm
              btn-primary
              mr-2
              mr-sm-0
              ${POPOVER_INVALID_SEGMENT_CLASS}
            `}
            type={"button"}
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              segmentIsValid && onClickAddAnnotationTrack(e);
            }}
            disabled={!segmentIsValid}
            {...POPOVER_INVALID_SEGMENT_PROPS}
          >
            <i className={`las la-plus`} /> Track
          </button>
        </div>
      )}

      {Object.entries(annotationTracks).map(
        ([trackIndex, annotationTrack]: [string, TrackObjectedType]) => {
          return (
            <AnnotationTrack
              annotationTrack={annotationTrack}
              customTriggers={customTriggers}
              customValidators={customValidators}
              duration={duration}
              formatStringWithTokens={formatStringWithTokens}
              inReviewState={inReviewState}
              key={`annotation-track-${trackIndex}`}
              onClickAnnotationTrack={onClickAnnotationTrack}
              onSelectSegment={onSelectSegment}
              player={player}
              playerSizes={playerSizes}
              segmentFields={segmentFields}
              segmentIsValid={segmentIsValid}
              selectedAnnotationTrack={selectedAnnotationTrack}
              setAnnotationTracks={setAnnotationTracks}
              setRenderingErrors={setRenderingErrors}
              setSegmentValidation={setSegmentValidation}
              trackIndex={trackIndex}
            />
          );
        }
      )}
    </div>
  );
}

export default AnnotationTracks;
