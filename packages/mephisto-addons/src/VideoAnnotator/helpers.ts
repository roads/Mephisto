/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { cloneDeep } from "lodash";

export function secontsToTime(seconds: number): string {
  if (typeof seconds !== "number") {
    return "00:00";
  }

  let startIndex: number = 11;
  let endIndex: number = 19;
  if (seconds < 3600) {
    startIndex = 14;
  }

  return new Date(seconds * 1000).toISOString().substring(startIndex, endIndex);
}

export function convertInitialDataListsToObjects(
  data: AnnotationTracksListedType
): AnnotationTracksObjectedType {
  const _data: AnnotationTracksObjectedType = {};

  data.map((track: TrackListedType, ti: number) => {
    const _track: TrackObjectedType = {
      title: cloneDeep(track.title),
      segments: {},
    };
    const initSegments = track.segments || [];

    initSegments.map((segment: SegmentType, si: number) => {
      _track.segments[String(si)] = segment;
    });

    _data[String(ti)] = _track;
  });

  return _data;
}

export function convertAnnotationTasksDataObjectsToLists(
  data: AnnotationTracksObjectedType
): AnnotationTracksListedType {
  const _data: AnnotationTracksListedType = [];

  Object.values(data).map((track: TrackObjectedType) => {
    const _track: TrackListedType = {
      title: cloneDeep(track.title),
      segments: Object.values(track.segments || {}),
    };

    _data.push(_track);
  });

  return _data;
}

export function getExtFromFilePath(path: string): string {
  const splittedPath = path.split(".");
  const ext = splittedPath[splittedPath.length - 1];
  return ext;
}
