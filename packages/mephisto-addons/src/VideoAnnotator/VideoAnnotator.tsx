/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Popover } from "bootstrap";
import * as React from "react";
import { isMobile } from "react-device-detect";
import videojs from "video.js";
import { VIDEO_TYPES_BY_EXT } from "../constants";
import { getFormatStringWithTokensFunction } from "../FormComposer/utils";
import TaskInstructionButton from "../TaskInstructionModal/TaskInstructionButton";
import TaskInstructionModal from "../TaskInstructionModal/TaskInstructionModal";
import AnnotationTracks from "./AnnotationTracks";
import {
  DEFAULT_SEGMENT_FIELDS,
  DELAY_PROGRESSBAR_RESIZING_MSEC,
  POPOVER_INVALID_SEGMENT_CLASS,
  POPOVER_INVALID_SEGMENT_PROPS,
  STORAGE_PRESAVED_ANNOTATION_TRACKS_KEY,
} from "./constants";
import { getExtFromFilePath } from "./helpers";
import "./VideoAnnotator.css";
import VideoPlayer from "./VideoPlayer";
// @ts-ignore
import Player = videojs.Player;
// @ts-ignore
import PlayerOptions = videojs.PlayerOptions;

type VideoAnnotatorPropsType = {
  data: ConfigAnnotatorType;
  onSubmit: (data: AnnotationTracksListedType) => void;
  finalResults?: AnotatorResultsType;
  setRenderingErrors: SetRenderingErrorsType;
  customTriggers: CustomTriggersType;
  customValidators: CustomValidatorsType;
  setTaskSubmitData: React.Dispatch<
    React.SetStateAction<AnnotationTracksListedType>
  >;
};

function VideoAnnotator({
  data,
  onSubmit,
  finalResults = null,
  setRenderingErrors,
  customValidators,
  customTriggers,
  setTaskSubmitData,
}: VideoAnnotatorPropsType) {
  const videoAnnotatorConfig: ConfigAnnotatorType = data;

  // State to hide submit button
  const [onSubmitLoading, setOnSubmitLoading] = React.useState<boolean>(false);

  // Annotator instruction modal state
  const [
    annotatorInstrupctionModalOpen,
    setAnnotatorInstrupctionModalOpen,
  ] = React.useState<boolean>(false);

  const inReviewState: boolean = ![undefined, null].includes(finalResults);

  const formatStringWithTokens: FormatStringWithTokensType = getFormatStringWithTokensFunction(
    inReviewState
  );

  const playerRef = React.useRef<Player>(null);

  const [videoPlayerChapters, setVideoPlayerChapters] = React.useState<
    SegmentType[]
  >([]);

  const [annotationTracksData, setAnnotationTracksData] = React.useState<
    TrackListedType[]
  >([]);

  const [segmentValidation, setSegmentValidation] = React.useState<
    ValidatorsResultsType
  >({});

  let initialAnnotationTracksData: AnnotationTracksListedType = [];
  if (inReviewState) {
    initialAnnotationTracksData = finalResults?.tracks;
  } else {
    try {
      const presavedAnnotationTracks: AnnotationTracksListedType = JSON.parse(
        localStorage.getItem(STORAGE_PRESAVED_ANNOTATION_TRACKS_KEY)
      );
      initialAnnotationTracksData = presavedAnnotationTracks || [];
    } catch (e: any) {
      console.warn("Cannot read presaved annotation tracks");
      // Remove incorrect data from local storage
      localStorage.removeItem(STORAGE_PRESAVED_ANNOTATION_TRACKS_KEY);
    }
  }

  const [playerSizes, setPlayerSizes] = React.useState<PlayerSizesType>({
    player: new DOMRect(),
    progressBar: new DOMRect(),
  });
  const [duration, setDuration] = React.useState<number>(0);

  let annotatorSubmitButton: ConfigItemType =
    videoAnnotatorConfig.submit_button;

  let showTaskInstructionAsModal: boolean =
    videoAnnotatorConfig.show_instructions_as_modal || false;

  let annotatorTitle: string = formatStringWithTokens(
    videoAnnotatorConfig?.title || "",
    setRenderingErrors
  );
  let annotatorInstruction: string = formatStringWithTokens(
    videoAnnotatorConfig?.instruction || "",
    setRenderingErrors
  );
  const segmentIsValid: boolean = Object.keys(segmentValidation).length === 0;

  let segmentFields: SegmentFieldsType = videoAnnotatorConfig.segment_fields;
  if (!segmentFields || segmentFields.length === 0) {
    segmentFields = DEFAULT_SEGMENT_FIELDS;
  }

  const videoExt: string = getExtFromFilePath(videoAnnotatorConfig.video);
  const videoType: string = VIDEO_TYPES_BY_EXT[videoExt];

  const videoJsOptions: PlayerOptions = {
    autoplay: false,
    controls: true,
    sources: [
      {
        src: videoAnnotatorConfig.video,
        type: videoType,
      },
    ],
    width: "700",
    height: "400",
    fluid: true,
    playbackRates: [0.5, 1, 1.5, 2],
    preload: "auto",
    playsinline: true,
    controlBar: {
      chaptersButton: !isMobile,
      fullscreenToggle: false,
      pictureInPictureToggle: false,
    },
    inactivityTimeout: 0,
  };

  // ----- Methods -----

  function updatePlayerSizes() {
    const videoPlayer: Element = document.getElementsByClassName("video-js")[0];
    const progressBar: Element = document.getElementsByClassName(
      "vjs-progress-holder"
    )[0];

    if (videoPlayer && progressBar) {
      setPlayerSizes({
        player: videoPlayer.getBoundingClientRect(),
        progressBar: progressBar.getBoundingClientRect(),
      });
    }
  }

  function onVideoPlayerReady(player: Player) {
    playerRef.current = player;

    updatePlayerSizes();

    // Right after player is ready sometimes size of progress bar is not correct,
    // because some elements on the right side are still loading
    setTimeout(() => updatePlayerSizes(), DELAY_PROGRESSBAR_RESIZING_MSEC);

    // Set video duration
    player.on("loadedmetadata", () => {
      setDuration(player.duration());
    });

    // Stop playing the video at the end of the selected segment
    player.on("timeupdate", () => {
      // HACK to pass values into event listeners as them cannot read updated React states
      const segmentElement: HTMLElement = document.querySelectorAll<
        HTMLElement
      >(`.segment.active`)[0];
      if (!segmentElement) {
        return;
      }
      const endSec: number =
        Number.parseFloat(segmentElement.dataset.endsec) || null;
      if (endSec === null) {
        return;
      }

      // HACK to prevent setting player on pause if current time is out of current segment
      const videoPlayerElement: HTMLElement = document.querySelectorAll<
        HTMLElement
      >(`.video-player`)[0];
      const lastTimePressedPlay: number =
        Number.parseFloat(videoPlayerElement.dataset.lasttimepressedplay) || 0;

      // Check for end only if video is playing
      const isVideoPlaying: boolean = !!(
        player.currentTime() > 0 &&
        !player.paused() &&
        !player.ended() &&
        player.readyState() > 2
      );

      if (isVideoPlaying) {
        // We pause video only in case video was started before ending current segment.
        // Otherwise, we should continue playing.
        if (lastTimePressedPlay < endSec && player.currentTime() >= endSec) {
          player.pause();
          // HACK: setting exact end value on progress bar,
          // because this event is being fired every 15-250 milliseconds,
          // and it can be further than real value
          player.currentTime(endSec);
        }
      }
    });

    // Resize track segment if progress bar changes its width
    const playerProgressBarResizeObserver: ResizeObserver = new ResizeObserver(
      () => {
        updatePlayerSizes();
      }
    );

    const progressBarElement: Element = player.controlBar.progressControl.el_;
    if (progressBarElement) {
      playerProgressBarResizeObserver.observe(progressBarElement);
    }
  }

  // ----- Methods -----

  function onSelectSegment(segment: SegmentType) {
    const player: Player = playerRef.current;

    if (player) {
      const startTime: number = segment?.start_sec || 0;
      player.currentTime(startTime);
    }
  }

  function onChangeAnnotationTracks(data: TrackListedType[]) {
    setAnnotationTracksData(data);
    localStorage.setItem(
      STORAGE_PRESAVED_ANNOTATION_TRACKS_KEY,
      JSON.stringify(data)
    );
  }

  function onSubmitAnnotation(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    setOnSubmitLoading(true);

    // Pass data to `mephisto-core` library
    onSubmit(annotationTracksData);

    // Clean presaved data, because it was already sent to the server
    localStorage.removeItem(STORAGE_PRESAVED_ANNOTATION_TRACKS_KEY);
  }

  // ----- Effects -----

  React.useEffect(() => {
    // NOTE that we search for all buttons we disable if segment form is invalid:
    //   - VideoAnnotator ("Submit")
    //   - AnnotationTracks ("+ Track")
    //   - AnnotationTrack ("+ Segment")

    let popovers: Popover[] = [];

    // Create popover objects every time when segment marked as invalid
    if (!segmentIsValid) {
      popovers = [
        ...document.querySelectorAll(
          `.${POPOVER_INVALID_SEGMENT_CLASS}:not(.active)[data-toggle="popover"]`
        ),
      ].map((el: HTMLElement) => new Popover(el));
    }
    // Remove popover objects every time when segment marked as valid
    else {
      popovers.map((p: Popover) => p.dispose());
    }

    // Do not forget to remove all popovers unmounting component to save memory
    return () => {
      popovers.map((p: Popover) => p.dispose());
    };
  }, [segmentIsValid]);

  React.useEffect(() => {
    // In case if Auto-submission enabled
    if (setTaskSubmitData) {
      setTaskSubmitData(annotationTracksData);
    }
  }, [annotationTracksData]);

  return (
    <div
      className={`
        video-annotation
        p-1
        ${showTaskInstructionAsModal ? "pt-5 pt-sm-5 pt-lg-0" : ""}
      `}
    >
      {/* Task info */}
      <h2 className={`title mb-4`}>{annotatorTitle}</h2>

      {/* Show instruction or button that opens a modal with instructions */}
      {showTaskInstructionAsModal ? (
        <>
          {/* Instructions */}
          {annotatorTitle && annotatorInstruction && <hr />}

          {annotatorInstruction && (
            <div className={`instruction-hint mb-4`}>
              For instructions, click "Task Instructions" button in the
              top-right corner.
            </div>
          )}

          {/* Button (modal in the end of the component) */}
          <TaskInstructionButton
            onClick={() =>
              setAnnotatorInstrupctionModalOpen(!annotatorInstrupctionModalOpen)
            }
          />
        </>
      ) : (
        <>
          {/* Instructions */}
          {annotatorTitle && annotatorInstruction && <hr />}

          {annotatorInstruction && (
            <div
              className={`instruction mb-4`}
              dangerouslySetInnerHTML={{ __html: annotatorInstruction || "" }}
            ></div>
          )}
        </>
      )}

      {/* Video Player */}
      <div className={"video-player-container mb-4"}>
        <VideoPlayer
          chapters={videoPlayerChapters}
          className={"video-player"}
          onReady={onVideoPlayerReady}
          options={videoJsOptions}
        />
      </div>

      {/* Annotations */}
      <AnnotationTracks
        customTriggers={customTriggers}
        customValidators={customValidators}
        duration={duration}
        formatStringWithTokens={formatStringWithTokens}
        inReviewState={inReviewState}
        onChange={onChangeAnnotationTracks}
        onSelectSegment={onSelectSegment}
        player={playerRef.current}
        playerSizes={playerSizes}
        segmentFields={segmentFields}
        segmentIsValid={segmentIsValid}
        setRenderingErrors={setRenderingErrors}
        setSegmentValidation={setSegmentValidation}
        setVideoPlayerChapters={setVideoPlayerChapters}
        tracks={initialAnnotationTracksData}
      />

      {/* Submit button */}
      {annotatorSubmitButton && !inReviewState && (
        <div
          className={`${annotatorSubmitButton.classes || ""}`}
          id={annotatorSubmitButton.id}
        >
          <hr className={`annotator-buttons-separator mb-5`} />

          {onSubmitLoading ? (
            // Banner of success
            <div
              className={`alert alert-success centered mx-auto col-12 col-sm-8 ml-2 mr-2`}
            >
              Thank you!
              <br />
              Your form has been submitted.
            </div>
          ) : (
            <>
              {/* Button instruction */}
              {annotatorSubmitButton.instruction && (
                <div
                  className={`alert alert-light centered mx-auto col-12 col-sm-8 ml-2 mr-2`}
                  dangerouslySetInnerHTML={{
                    __html: annotatorSubmitButton.instruction,
                  }}
                ></div>
              )}

              {/* Submit button */}
              <div className={`annotator-buttons container`}>
                <button
                  className={`button-submit btn btn-success ${POPOVER_INVALID_SEGMENT_CLASS}`}
                  type={"submit"}
                  title={segmentIsValid ? annotatorSubmitButton.tooltip : ""}
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    segmentIsValid && onSubmitAnnotation(e);
                  }}
                  disabled={!segmentIsValid}
                  {...POPOVER_INVALID_SEGMENT_PROPS}
                >
                  {annotatorSubmitButton.text}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal with task instructions */}
      {showTaskInstructionAsModal && annotatorInstruction && (
        <TaskInstructionModal
          classNameDialog={`annotator-instruction-dialog`}
          instructions={
            <p dangerouslySetInnerHTML={{ __html: annotatorInstruction }}></p>
          }
          open={annotatorInstrupctionModalOpen}
          setOpen={setAnnotatorInstrupctionModalOpen}
          title={"Task Instructions"}
        />
      )}
    </div>
  );
}

export default VideoAnnotator;
