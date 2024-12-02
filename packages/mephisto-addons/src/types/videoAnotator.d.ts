/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

declare type ConfigAnnotatorType = { [key: string]: any };

declare type PlayerSizesType = {
  player: DOMRect;
  progressBar: DOMRect;
};

declare type AnnotationTracksObjectedType = {
  [key: string]: TrackObjectedType;
};

declare type AnnotationTracksListedType = TrackListedType[];

declare type TrackObjectedType = {
  segments: { [key: string]: SegmentType };
  title: string;
};

declare type TrackListedType = {
  segments: SegmentType[];
  title: string;
};

declare interface DefaultSegmentType {
  end_sec: number;
  start_sec: number;
  title: string;
}

declare type SegmentType = DefaultSegmentType & {
  [key: string]: string | number | string[] | number[];
};

declare type SegmentFieldsType = ConfigFieldType[];

declare type PopoverPropsType = { [key: string]: string | boolean };

declare type ValidateTimeFieldsOnSaveType = {
  errors: string[];
  fields: ValidatorsResultsType;
};

declare type AnotatorResultsType = {
  tracks: AnnotationTracksListedType;
};
