/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

declare type OpinionDataQuestionType = {
  question: string;
  text: string;
};

declare type OpinionDataType = {
  questions?: OpinionDataQuestionType[];
};

declare type WorkerOpinionDataType = {
  worker_opinion: OpinionDataType;
};

declare type OpinionFileInfoType = {
  fieldname: string;
  filename: string;
  lastModified: string | number;
  name: string;
  size: number;
  type: string;
};

declare type OpinionFile = File & {
  fieldname: string;
  filename: string;
};

declare type HandleMetadataSubmitResponseType = {
  status: string;
};

declare type WorkerOpinionStateType = {
  errorIndexes: Set<number>;
  status: number;
  text: string;
};

declare type ReducerAction = {
  errorIndexes: Set<number>;
  type: string;
};
