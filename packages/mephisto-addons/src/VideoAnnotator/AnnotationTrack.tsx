/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { cloneDeep } from "lodash";
import * as React from "react";
import { isMobile } from "react-device-detect";
import videojs from "video.js";
import { FieldType } from "../FormComposer/constants";
import { validateFormFields } from "../FormComposer/validation/helpers";
import { pluralizeString } from "../helpers";
import { FormComposerFields, ListErrors } from "../index";
import "./AnnotationTrack.css";
import {
  COLORS,
  DEFAULT_SEGMENT,
  DELAY_CLICK_ON_SECTION_MSEC,
  DELAY_SHOW_OVERLAPPING_MESSAGE_MSEC,
  POPOVER_INVALID_SEGMENT_CLASS,
  POPOVER_INVALID_SEGMENT_PROPS,
  START_NEXT_SECTION_PLUS_SEC,
} from "./constants";
import { secontsToTime } from "./helpers";
import TrackSegment from "./TrackSegment";
import TrackSegmentMobile from "./TrackSegmentMobile";
import { validateTimeFieldsOnSave } from "./utils";
// @ts-ignore
import Player = videojs.Player;
// @ts-ignore
import PlayerOptions = videojs.PlayerOptions;

type onClickAnnotationTrackType = (
  e: React.MouseEvent<HTMLDivElement>,
  annotationTrack: TrackObjectedType,
  trackIndex: string
) => void;

type AnnotationTrackPropsType = {
  annotationTrack: TrackObjectedType;
  customTriggers: CustomTriggersType;
  customValidators: CustomValidatorsType;
  duration: number;
  formatStringWithTokens: Function;
  inReviewState: boolean;
  onClickAnnotationTrack: onClickAnnotationTrackType;
  onSelectSegment: (segment: SegmentType) => void;
  player: Player;
  playerSizes: PlayerSizesType;
  segmentFields: SegmentFieldsType;
  segmentIsValid: boolean;
  selectedAnnotationTrack: string;
  setAnnotationTracks: React.Dispatch<
    React.SetStateAction<AnnotationTracksObjectedType>
  >;
  setRenderingErrors: SetRenderingErrorsType;
  setSegmentValidation: React.Dispatch<
    React.SetStateAction<ValidatorsResultsType>
  >;
  trackIndex: string;
};

function AnnotationTrack({
  annotationTrack,
  customTriggers,
  customValidators,
  duration,
  formatStringWithTokens,
  inReviewState,
  onClickAnnotationTrack,
  onSelectSegment,
  player,
  playerSizes,
  segmentFields,
  segmentIsValid,
  selectedAnnotationTrack,
  setAnnotationTracks,
  setRenderingErrors,
  setSegmentValidation,
  trackIndex,
}: AnnotationTrackPropsType) {
  const [trackTitle, setTrackTitle] = React.useState<string>(
    annotationTrack.title
  );

  const [inEditState, setInEditState] = React.useState<boolean>(false);
  const [selectedSegment, setSelectedSegment] = React.useState<number>(null);
  const [
    overlappingSegmentErrors,
    setOverlappingSegmentErrors,
  ] = React.useState<string[]>([]);
  const [segmentToChangeErrors, setSegmentToChangeErrors] = React.useState<
    string[]
  >([]);
  const [segmentToChange, setSegmentToChange] = React.useState<SegmentType>(
    null
  );
  // Invalid fields (having error messages after form validation)
  const [invalidSegmentFields, setInvalidSegmentFields] = React.useState<
    ValidatorsResultsType
  >({});

  const isSelectedAnnotationTrack: boolean =
    String(selectedAnnotationTrack) === String(trackIndex);

  const showSegmentToChangeInfo: boolean =
    isSelectedAnnotationTrack && segmentToChange !== null;

  // Calculate paddings to the segments to make position of segments
  // exactly under VideoPlayer progress bar
  let paddingLeft: number = 0;
  let paddingRight: number = 0;

  if (isMobile) {
    paddingLeft = 10;
    paddingRight = 10;
  } else {
    if (playerSizes.progressBar?.left && playerSizes.player?.left) {
      paddingLeft = playerSizes.progressBar.left - playerSizes.player.left;
      paddingRight = playerSizes.player.right - playerSizes.progressBar.right;
    }
  }

  const segmentsColorIndex: number =
    Number(trackIndex) -
    Math.floor(Number(trackIndex) / COLORS.length) * COLORS.length;
  const segmentsColor = COLORS[segmentsColorIndex];

  const showSegments: boolean = true;

  const segmentFieldsByName: { [key: string]: ConfigFieldType } = Object.assign(
    {},
    ...segmentFields.map((x) => ({ [x.name]: x }))
  );

  const segmentsAmount: number = Object.keys(annotationTrack.segments).length;

  // ----- Methods -----

  function onClickTrack(e: React.MouseEvent<HTMLDivElement>) {
    onClickAnnotationTrack(e, annotationTrack, trackIndex);
  }

  function onClickEditTrackInfo(e: React.MouseEvent<HTMLButtonElement>) {
    setInEditState(true);
  }

  function onClickSaveTrackInfo(e: React.MouseEvent<HTMLButtonElement>) {
    setInEditState(false);
    setAnnotationTracks((prevState) => {
      const newState = cloneDeep(prevState);
      newState[trackIndex].title = trackTitle;
      return newState;
    });
  }

  function onClickCancelChangesTrackInfo(
    e: React.MouseEvent<HTMLButtonElement>
  ) {
    setInEditState(false);
    setTrackTitle(annotationTrack.title);
  }

  function onClickRemoveTrack(e: React.MouseEvent<HTMLButtonElement>) {
    if (window.confirm("Do you really want to delete this track?")) {
      setAnnotationTracks((prevState: AnnotationTracksObjectedType) => {
        const newState: AnnotationTracksObjectedType = cloneDeep(prevState);
        delete newState[trackIndex];
        return newState;
      });

      setInEditState(false);
      setSegmentValidation({});
      setOverlappingSegmentErrors([]);
    }
  }

  function onClickRemoveSegment(e: React.MouseEvent<HTMLButtonElement>) {
    if (window.confirm("Do you really want to delete this segment?")) {
      setAnnotationTracks((prevState: AnnotationTracksObjectedType) => {
        const newState: AnnotationTracksObjectedType = cloneDeep(prevState);
        if (selectedSegment !== null) {
          delete newState[trackIndex].segments[selectedSegment];
        }
        return newState;
      });

      setInEditState(false);
      setSelectedSegment(null);
      setSegmentToChange(null);
      setSegmentValidation({});
      setOverlappingSegmentErrors([]);
    }
  }

  function getCleanSegmentToChangeData() {
    const typeDefaultValueMapping = {
      [FieldType.CHECKBOX]: null,
      [FieldType.EMAIL]: "",
      [FieldType.FILE]: "",
      [FieldType.HIDDEN]: "",
      [FieldType.INPUT]: "",
      [FieldType.NUMBER]: "",
      [FieldType.PASSWORD]: "",
      [FieldType.RADIO]: null,
      [FieldType.SELECT]: null,
      [FieldType.TEXTAREA]: "",
    };
    const _segmentToChange: SegmentType = cloneDeep(DEFAULT_SEGMENT);
    segmentFields.map((field: ConfigFieldType, i: number) => {
      const fieldDefaultValue = typeDefaultValueMapping[field.type] || "";
      _segmentToChange[field.name] = fieldDefaultValue;
    });

    return _segmentToChange;
  }

  function onClickAddSegment(e: React.MouseEvent<HTMLButtonElement>) {
    const segmentsCount: number = Object.keys(annotationTrack.segments).length;

    const newSegment: SegmentType = cloneDeep(getCleanSegmentToChangeData());
    newSegment.title = `Segment #${segmentsCount + 1}`;

    // Get current video time and set it to new segment
    let currentVideoTime: number = null;
    if (player) {
      currentVideoTime = player.currentTime() + START_NEXT_SECTION_PLUS_SEC;
    }
    newSegment.start_sec = currentVideoTime;
    newSegment.end_sec = currentVideoTime;

    if (segmentsCount !== 0) {
      const latestSegment: SegmentType =
        annotationTrack.segments[segmentsCount - 1];

      // in case player was not found somehow, create segment right after previous one
      if (currentVideoTime === null) {
        currentVideoTime = latestSegment.end_sec + START_NEXT_SECTION_PLUS_SEC;
        newSegment.start_sec = currentVideoTime;
        newSegment.end_sec = currentVideoTime;
      }

      // Prevent creating empty duplicates with unset time fields
      if (latestSegment.start_sec === newSegment.start_sec) {
        alert(
          "You already have unfinished segment.\n\n" +
            "Change it or remove to created another new one."
        );
        return;
      }
    }

    const newSegmentIndex: number = segmentsCount;

    setAnnotationTracks((prevState: AnnotationTracksObjectedType) => {
      const prevAnnotationTrack: TrackObjectedType = cloneDeep(
        prevState[trackIndex]
      );
      prevAnnotationTrack.segments[newSegmentIndex] = newSegment;
      return {
        ...prevState,
        ...{ [trackIndex]: prevAnnotationTrack },
      };
    });

    setSelectedSegment(newSegmentIndex);
    setSegmentToChange(newSegment);
    onSelectSegment && onSelectSegment(newSegment);

    // Show overlapping message under segments progress bar
    const timeFieldsValidationResults: ValidateTimeFieldsOnSaveType = validateTimeFieldsOnSave(
      annotationTrack,
      newSegment,
      newSegmentIndex
    );
    if (timeFieldsValidationResults.errors.length > 0) {
      setTimeout(() => {
        setOverlappingSegmentErrors([
          "Overlapping segment should be added to a different track",
        ]);
      }, DELAY_SHOW_OVERLAPPING_MESSAGE_MSEC);
    }
  }

  function onClickSegment(
    e: React.MouseEvent<HTMLDivElement>,
    segmentIndex: number
  ) {
    player.pause();

    setTimeout(() => {
      setSelectedSegment(segmentIndex);
      const segment: SegmentType = annotationTrack.segments[segmentIndex];
      setSegmentToChange(segment);
      onSelectSegment && onSelectSegment(segment);
    }, DELAY_CLICK_ON_SECTION_MSEC);
  }

  function updateSegmentToChangeFormData(
    fieldName: string,
    value: any,
    e: React.MouseEvent<HTMLButtonElement>
  ) {
    if (e) {
      e.preventDefault();
    }

    setSegmentToChange((prevState: SegmentType) => {
      return {
        ...prevState,
        ...{ [fieldName]: value },
      };
    });
  }

  // ----- Effects -----

  React.useEffect(() => {
    // Deselect all selected segments when we select new annotation track
    setSelectedSegment(null);
    setSegmentToChange(null);

    if (String(selectedAnnotationTrack) !== String(trackIndex)) {
      setInEditState(false);
    }
  }, [selectedAnnotationTrack]);

  React.useEffect(() => {
    if (!segmentToChange) {
      return;
    }

    // Validate current segment
    const timeFieldsValidationResults: ValidateTimeFieldsOnSaveType = validateTimeFieldsOnSave(
      annotationTrack,
      segmentToChange,
      selectedSegment
    );
    setSegmentValidation(timeFieldsValidationResults.fields);
    setSegmentToChangeErrors(timeFieldsValidationResults.errors);

    // Validate dynamic segment fields
    const dynamicFieldsErrorsByField: ValidatorsResultsType = validateFormFields(
      segmentToChange,
      segmentFieldsByName,
      customValidators
    );
    setInvalidSegmentFields(dynamicFieldsErrorsByField);

    // Clean overlapping message
    setOverlappingSegmentErrors([]);

    // Update segment validation results
    setSegmentValidation((prevState: ValidatorsResultsType) => {
      return {
        ...prevState,
        ...dynamicFieldsErrorsByField,
      };
    });

    // Save current segment
    setAnnotationTracks((prevState: AnnotationTracksObjectedType) => {
      const prevAnnotationTrack = cloneDeep(prevState[trackIndex]);
      prevAnnotationTrack.segments[selectedSegment] = segmentToChange;
      return {
        ...prevState,
        ...{ [trackIndex]: prevAnnotationTrack },
      };
    });
  }, [segmentToChange]);

  return (
    <div
      className={`
        annotation-track
        ${isSelectedAnnotationTrack ? "active" : ""}
        ${!segmentIsValid ? "non-clickable" : ""}
        ${POPOVER_INVALID_SEGMENT_CLASS}
      `}
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        segmentIsValid && onClickTrack(e);
      }}
      {...POPOVER_INVALID_SEGMENT_PROPS}
    >
      {/* Short name on unactive track */}
      {!isSelectedAnnotationTrack && (
        <>
          <div className={`track-name-small`}>{annotationTrack.title}</div>

          <div className={`segments-count`}>
            {segmentsAmount} {pluralizeString("segment", segmentsAmount)}
          </div>
        </>
      )}

      {isSelectedAnnotationTrack && (
        <div className={`track-info row m-0 justify-content-between`}>
          <div
            className={`
              track-name-wrapper
              col-12
              col-sm-auto
              pl-0
              pr-0
              mt-1
              mb-2
              mb-sm-0
              align-items-center
            `}
          >
            <span className={`track-name-label`}>Track:</span>

            {inEditState ? (
              <input
                className={`form-control form-control-sm`}
                name={"track-name"}
                value={trackTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setTrackTitle(e.target.value);
                }}
              />
            ) : (
              <span className={`track-name`}>{annotationTrack.title}</span>
            )}

            {!inReviewState && (
              <div className={`buttons`}>
                {inEditState ? (
                  <>
                    <button
                      className={`btn btn-sm btn-success`}
                      type={"button"}
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        onClickSaveTrackInfo(e);
                      }}
                    >
                      <i className={`las la-save`} />
                    </button>

                    <button
                      className={`btn btn-sm btn-outline-danger`}
                      type={"button"}
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        onClickCancelChangesTrackInfo(e);
                      }}
                    >
                      <i className={`las la-times`} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className={`btn btn-sm btn-outline-dark`}
                      type={"button"}
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        onClickEditTrackInfo(e);
                      }}
                    >
                      <i className={`las la-pen`} /> Track
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {!inReviewState && (
            <div
              className={`
                track-buttons
                col-12
                col-sm-auto
                pl-0
                pr-0
                justify-content-end
              `}
            >
              <button
                className={`btn btn-sm btn-outline-danger remove-track`}
                type={"button"}
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  onClickRemoveTrack(e);
                }}
              >
                <i className={`las la-trash`} /> Track
              </button>

              <button
                className={`btn btn-sm btn-primary ${POPOVER_INVALID_SEGMENT_CLASS}`}
                type={"button"}
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  segmentIsValid && onClickAddSegment(e);
                }}
                disabled={!segmentIsValid}
                {...POPOVER_INVALID_SEGMENT_PROPS}
              >
                <i className={`las la-plus`} /> Segment
              </button>
            </div>
          )}
        </div>
      )}

      {showSegments && (
        <>
          <div
            className={`segments`}
            style={{
              // @ts-ignore
              "--segments-padding-left": `${paddingLeft}px`,
              // @ts-ignore
              "--segments-padding-right": `${paddingRight}px`,
            }}
          >
            <div
              className={`progress-bar`}
              style={{
                // @ts-ignore
                "--segments-padding-left": `${paddingLeft}px`,
                // @ts-ignore
                "--segments-padding-right": `${paddingRight}px`,
              }}
            />

            {Object.entries(annotationTrack.segments).map(
              ([segmentIndex, segment]) => {
                return (
                  <TrackSegment
                    duration={duration}
                    isSelectedAnnotationTrack={isSelectedAnnotationTrack}
                    key={`track-segment-${segmentIndex}`}
                    onClickSegment={(e, index) => {
                      !isMobile && segmentIsValid && onClickSegment(e, index);
                    }}
                    paddingLeft={paddingLeft}
                    playerSizes={playerSizes}
                    segment={segment}
                    segmentIndex={Number(segmentIndex)}
                    segmentIsValid={segmentIsValid}
                    segmentsColor={segmentsColor}
                    selectedSegment={selectedSegment}
                  />
                );
              }
            )}
          </div>

          {isMobile && isSelectedAnnotationTrack && (
            <div className={`segments-mobile p-2`}>
              {Object.entries(annotationTrack.segments).map(
                ([segmentIndex, segment]) => {
                  return (
                    <TrackSegmentMobile
                      isSelectedAnnotationTrack={isSelectedAnnotationTrack}
                      key={`track-segment-mobile-${segmentIndex}`}
                      onClickSegment={(
                        e: React.MouseEvent<HTMLDivElement>,
                        index: number
                      ) => {
                        isMobile && segmentIsValid && onClickSegment(e, index);
                      }}
                      segment={segment}
                      segmentIndex={Number(segmentIndex)}
                      selectedSegment={selectedSegment}
                    />
                  );
                }
              )}
            </div>
          )}
        </>
      )}

      <ListErrors
        className={`
          overlapping-segments
          ${overlappingSegmentErrors.length ? "is-invalid" : ""}
        `}
        messages={overlappingSegmentErrors}
      />

      {showSegmentToChangeInfo && (
        <div
          className={`
            segment-info
            p-2
            ${segmentToChangeErrors.length ? "is-invalid" : ""}
          `}
        >
          <div className={`time`}>
            <span>Time:</span>

            <input
              className={`form-control form-control-sm`}
              placeholder={"Start"}
              readOnly={true}
              value={secontsToTime(segmentToChange.start_sec)}
            />

            {!inReviewState && (
              <button
                className={`btn btn-sm btn-outline-dark`}
                type={"button"}
                onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                  updateSegmentToChangeFormData(
                    "start_sec",
                    player ? player.currentTime() : 0,
                    e
                  )
                }
                title={"Save current player time as a start of this segment"}
              >
                <i className={`las la-thumbtack`} />
              </button>
            )}

            <span>-</span>

            <input
              className={`form-control form-control-sm`}
              placeholder={"End"}
              readOnly={true}
              value={secontsToTime(segmentToChange.end_sec)}
            />

            {!inReviewState && (
              <button
                className={`btn btn-sm btn-outline-dark`}
                type={"button"}
                onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                  updateSegmentToChangeFormData(
                    "end_sec",
                    player ? player.currentTime() : 0,
                    e
                  )
                }
                title={"Save current player time as an end of this segment"}
              >
                <i className={`las la-thumbtack`} />
              </button>
            )}
          </div>

          {/* Time fields errors */}
          <ListErrors messages={segmentToChangeErrors} />

          {segmentFields.map((field: ConfigFieldType, fieldIndex: number) => {
            const _field: ConfigFieldType = {
              ...field,
              placeholder: " ", // Must be a string with space for floating label
            };

            const fieldLabel: string = formatStringWithTokens(
              _field.label,
              setRenderingErrors
            );
            const fieldTooltip: string = formatStringWithTokens(
              _field.tooltip,
              setRenderingErrors
            );

            const fieldHelp: string = _field.help;

            const useFloatingLabel: boolean = [
              FieldType.INPUT,
              FieldType.EMAIL,
              FieldType.PASSWORD,
              FieldType.NUMBER,
              FieldType.TEXTAREA,
            ].includes(_field.type);

            const isInvalid: boolean = !!(
              invalidSegmentFields[_field.name] || []
            ).length;
            const validationErrors: string[] =
              invalidSegmentFields[_field.name] || [];

            return (
              <React.Fragment
                key={`segment-field-${_field.type}-${fieldIndex}`}
              >
                <div
                  className={`form-label-group ${
                    useFloatingLabel ? "floating-label" : ""
                  }`}
                  title={fieldTooltip}
                >
                  {!useFloatingLabel && (
                    <label className={`field-label`} htmlFor={_field.id}>
                      {fieldLabel}
                    </label>
                  )}

                  {[
                    FieldType.INPUT,
                    FieldType.EMAIL,
                    FieldType.PASSWORD,
                    FieldType.NUMBER,
                  ].includes(_field.type) && (
                    <FormComposerFields.InputField
                      className={`form-control-sm`}
                      field={_field as ConfigInputFieldType}
                      formData={segmentToChange}
                      updateFormData={updateSegmentToChangeFormData}
                      disabled={inReviewState}
                      initialFormData={segmentToChange}
                      inReviewState={inReviewState}
                      invalid={isInvalid}
                      validationErrors={validationErrors}
                      formFields={segmentFieldsByName}
                      customTriggers={customTriggers}
                    />
                  )}

                  {_field.type === FieldType.TEXTAREA && (
                    <FormComposerFields.TextareaField
                      className={`form-control-sm`}
                      field={_field as ConfigTextareaFieldType}
                      formData={segmentToChange}
                      updateFormData={updateSegmentToChangeFormData}
                      disabled={inReviewState}
                      initialFormData={segmentToChange}
                      inReviewState={inReviewState}
                      invalid={isInvalid}
                      validationErrors={validationErrors}
                      formFields={segmentFieldsByName}
                      customTriggers={customTriggers}
                      rows={3}
                    />
                  )}

                  {_field.type === FieldType.CHECKBOX && (
                    <FormComposerFields.CheckboxField
                      field={_field as ConfigCheckboxFieldType}
                      formData={segmentToChange}
                      updateFormData={updateSegmentToChangeFormData}
                      disabled={inReviewState}
                      initialFormData={segmentToChange}
                      inReviewState={inReviewState}
                      invalid={isInvalid}
                      validationErrors={validationErrors}
                      formFields={segmentFieldsByName}
                      customTriggers={customTriggers}
                    />
                  )}

                  {_field.type === FieldType.RADIO && (
                    <FormComposerFields.RadioField
                      field={_field as ConfigRadioFieldType}
                      formData={segmentToChange}
                      updateFormData={updateSegmentToChangeFormData}
                      disabled={inReviewState}
                      initialFormData={segmentToChange}
                      inReviewState={inReviewState}
                      invalid={isInvalid}
                      validationErrors={validationErrors}
                      formFields={segmentFieldsByName}
                      customTriggers={customTriggers}
                    />
                  )}

                  {_field.type === FieldType.SELECT && (
                    <FormComposerFields.SelectField
                      field={_field as ConfigSelectFieldType}
                      formData={segmentToChange}
                      updateFormData={updateSegmentToChangeFormData}
                      disabled={inReviewState}
                      initialFormData={segmentToChange}
                      inReviewState={inReviewState}
                      invalid={isInvalid}
                      validationErrors={validationErrors}
                      formFields={segmentFieldsByName}
                      customTriggers={customTriggers}
                    />
                  )}

                  {useFloatingLabel && (
                    <label htmlFor={_field.id}>{fieldLabel}</label>
                  )}

                  {fieldHelp && (
                    <small
                      className={`field-help form-text text-muted`}
                      dangerouslySetInnerHTML={{
                        __html: fieldHelp,
                      }}
                    />
                  )}
                </div>
              </React.Fragment>
            );
          })}

          {!inReviewState && (
            <div className={`segment-buttons`}>
              <button
                className={`btn btn-sm btn-outline-danger remove-segment`}
                type={"button"}
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  onClickRemoveSegment(e);
                }}
                title={"Remove this segment"}
              >
                <i className={`las la-trash`} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AnnotationTrack;
