/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { cloneDeep } from "lodash";
import * as React from "react";
import {
  getUrlsFromString,
  ProcedureName,
  WAIT_FOR_AGENT_ID_MSEC,
} from "../FormComposer/utils";
import { replaceAll } from "../helpers";
import { secontsToTime } from "./helpers";

let urlToTokenProcedureMapping: { [key: string]: string } = {};

export function _getAllUrlsToPresign(
  annotatorConfig: ConfigAnnotatorType
): string[] {
  let urls = new Set<string>();

  function _extractUrlsToPresignFromConfigItem(configItem: ConfigItemType) {
    Object.values(configItem).forEach((value: string) => {
      if (typeof value === "string") {
        const valueUrls: string[] = getUrlsFromString(
          value,
          urlToTokenProcedureMapping
        );
        if (valueUrls.length) {
          urls = new Set<string>([...urls, ...valueUrls]);
        }
      }
    });
  }

  // Any annotator object (title, instruction, segment_fields, etc.)
  // whose attributes can contain tokens
  const configItemsToFindUrls: ConfigItemType[] = [];
  configItemsToFindUrls.push(annotatorConfig);
  annotatorConfig.segment_fields.map((field: ConfigFieldType) => {
    configItemsToFindUrls.push(field);
  });

  configItemsToFindUrls.forEach((configItem: ConfigItemType) => {
    _extractUrlsToPresignFromConfigItem(configItem);
  });

  return [...urls];
}

export function _replaceUrlsWithPresignedUrlsInAnnotatorData(
  taskData: ConfigTaskType,
  presignedUrls: string[]
): ConfigTaskType {
  function _replaceTokensWithUrlsConfigItem(
    configItem: ConfigItemType,
    originalUrl: string,
    presignedUrl: string
  ) {
    Object.entries(configItem).forEach(([key, value]: [string, string]) => {
      if (typeof value === "string") {
        const token: string = urlToTokenProcedureMapping[originalUrl];
        if (token) {
          configItem[key] = replaceAll(value, token, presignedUrl);
        }
      }
    });
  }

  let _taskData: ConfigTaskType = cloneDeep(taskData);
  presignedUrls.forEach(
    ([originalUrl, presignedUrl]): ConfigTaskType => {
      // Any annotator object (title, instruction, segment_fields, etc.)
      // whose attributes can contain tokens
      const configItemsToFindUrls: ConfigItemType[] = [];

      configItemsToFindUrls.push(_taskData.annotator);

      _taskData.annotator.segment_fields.forEach((field: ConfigFieldType) => {
        configItemsToFindUrls.push(field);
      });

      configItemsToFindUrls.forEach((configItem: ConfigItemType) => {
        _replaceTokensWithUrlsConfigItem(configItem, originalUrl, presignedUrl);
      });

      return _taskData;
    }
  );

  return _taskData;
}

function _prepareAnnotatorDataWithUrlsToPresign(
  taskConfigData: ConfigTaskType,
  setAnnotatorDataState: React.Dispatch<
    React.SetStateAction<ConfigAnnotatorType>
  >,
  setLoadingAnnotatorDataState: React.Dispatch<React.SetStateAction<boolean>>,
  setVideoAnnotatorRenderingErrorsState: React.Dispatch<
    React.SetStateAction<string>
  >
) {
  // Get URLs to presign from the whole config
  const urlsToPresign: string[] = _getAllUrlsToPresign(
    taskConfigData.annotator
  );

  // If there's nothing to do, just set initial config as is
  if (!urlsToPresign.length) {
    setAnnotatorDataState(taskConfigData.annotator);
    return false;
  }

  // Procedure `getMultiplePresignedUrls` must be set up to perform this preparation
  if (!window.hasOwnProperty(ProcedureName.GET_MULTIPLE_PRESIGNED_URLS)) {
    console.error(
      `'${ProcedureName.GET_MULTIPLE_PRESIGNED_URLS}' function was not defined on the server side.`
    );
    return false;
  }

  // Enable preloader
  setLoadingAnnotatorDataState(true);

  // Make a request to the server. Note: timeout is a hack (see the comment next to the constant)
  setTimeout(() => {
    window
      // @ts-ignore We added this function into `window` on previous steps
      .getMultiplePresignedUrls({ urls: urlsToPresign })
      .then((response) => {
        setLoadingAnnotatorDataState(false);

        if (Array.isArray(response)) {
          const updatedTaskData: ConfigTaskType = _replaceUrlsWithPresignedUrlsInAnnotatorData(
            taskConfigData,
            response
          );
          setAnnotatorDataState(updatedTaskData.annotator);
        } else {
          console.log(
            "Incorrect data returned from remote procedure `getMultiplePresignedUrls`"
          );
        }
      })
      .catch((error) => {
        setLoadingAnnotatorDataState(false);
        setVideoAnnotatorRenderingErrorsState(error);
      });
  }, WAIT_FOR_AGENT_ID_MSEC);
}

export function prepareVideoAnnotatorData(
  taskConfigData: ConfigTaskType,
  setAnnotatorDataState: React.Dispatch<
    React.SetStateAction<ConfigAnnotatorType>
  >,
  setLoadingAnnotatorDataState: React.Dispatch<React.SetStateAction<boolean>>,
  setVideoAnnotatorRenderingErrorsState: React.Dispatch<
    React.SetStateAction<string>
  >
) {
  // 1. Presign URLs
  _prepareAnnotatorDataWithUrlsToPresign(
    taskConfigData,
    setAnnotatorDataState,
    setLoadingAnnotatorDataState,
    setVideoAnnotatorRenderingErrorsState
  );

  // 2. TODO: Add additional steps here
}

export function validateTimeFieldsOnSave(
  annotationTrack: TrackObjectedType,
  segmentToChange: SegmentType,
  selectedSegment: number
): ValidateTimeFieldsOnSaveType {
  const errors: ValidateTimeFieldsOnSaveType["errors"] = [];
  const validation: ValidateTimeFieldsOnSaveType["fields"] = {};

  // If start is greater than end
  if (segmentToChange.start_sec > segmentToChange.end_sec) {
    errors.push(`Start of the segment cannot be greater than end of it.`);
    validation.end_sec = [
      `Start of the segment cannot be greater than end of it.`,
    ];
  }

  // If segment is inside another segment
  Object.entries(annotationTrack.segments).map(
    ([segmentIndex, segment]: [string, SegmentType]) => {
      // Skip currently saving segment
      if (String(segmentIndex) === String(selectedSegment)) {
        return;
      }

      let hasOverlapping: boolean = false;

      if (
        segmentToChange.start_sec > segment.start_sec &&
        segmentToChange.start_sec < segment.end_sec
      ) {
        hasOverlapping = true;
        validation.start_sec = [
          `Start cannot be inside of created segment before.`,
        ];
      }

      if (
        segmentToChange.end_sec > segment.start_sec &&
        segmentToChange.end_sec < segment.end_sec
      ) {
        hasOverlapping = true;
        validation.end_sec = [
          "End cannot be inside of created segment before.",
        ];
      }

      if (hasOverlapping) {
        errors.push(
          `You cannot start or end a segment in already created segment before: ` +
            `${segment.title} ${secontsToTime(
              segment.start_sec
            )} - ${secontsToTime(segment.end_sec)}`
        );
      }
    }
  );

  return {
    errors: errors,
    fields: validation,
  };
}
