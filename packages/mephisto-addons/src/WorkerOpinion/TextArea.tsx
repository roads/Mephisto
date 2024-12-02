/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from "react";
import {
  dispatchWorkerOpinionActionNoQuestions,
  dispatchWorkerOpinionActionWithQuestions,
  handleChangeWorkerOpinion,
} from "./helpers";
import "./WorkerOpinion.css";

type TextAreaPropsType = {
  className?: string;
  containsQuestions: boolean;
  dispatch: React.Dispatch<any>;
  id: string;
  index?: number;
  maxLength: number;
  placeholder?: string;
  questionsTexts?: string[];
  rows: number;
  setText: React.Dispatch<React.SetStateAction<string>>;
  state: WorkerOpinionStateType;
  stylePrefix: string;
  text: string;
  width: string;
};

const TextArea = React.forwardRef<any, TextAreaPropsType>(
  (
    {
      className,
      containsQuestions,
      dispatch,
      id,
      index,
      maxLength,
      placeholder,
      questionsTexts,
      rows,
      setText,
      state,
      stylePrefix,
      text,
      width,
    },
    ref
  ) => (
    <textarea
      className={`
        ${className ?? ""}
        ${stylePrefix}text-area ${
        (containsQuestions &&
          state.status === 5 &&
          state.errorIndexes.has(index) &&
          stylePrefix + "text-area-error") ||
        (!containsQuestions &&
          state.status === 4 &&
          stylePrefix + "text-area-error")
      }
        form-control
      `}
      disabled={state.status === 1}
      id={id}
      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
        handleChangeWorkerOpinion(
          e,
          () => {
            containsQuestions
              ? dispatchWorkerOpinionActionWithQuestions(
                  e,
                  maxLength,
                  index,
                  dispatch,
                  questionsTexts
                )
              : dispatchWorkerOpinionActionNoQuestions(
                  e,
                  maxLength,
                  state,
                  dispatch
                );
          },
          (e) => setText(e.target.value)
        );
      }}
      placeholder={placeholder ? placeholder : "Enter opinion text here"}
      ref={ref}
      rows={rows}
      value={text}
    />
  )
);

export default TextArea;
