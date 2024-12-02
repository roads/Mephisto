/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from "react";
import TextArea from "./TextArea";

type QuestionPropsType = {
  className: string;
  containsQuestions: boolean;
  dispatch: React.Dispatch<any>;
  index?: number;
  maxTextAreaLength: number;
  placeholder?: string;
  question: string;
  questionsTexts?: string[];
  setQuestionsTexts: React.Dispatch<React.SetStateAction<string[]>>;
  state: WorkerOpinionStateType;
  stylePrefix: string;
  textAreaRows: number;
  textAreaWidth: string;
};

const Question = React.forwardRef<any, QuestionPropsType>(
  (
    {
      className,
      containsQuestions,
      dispatch,
      index,
      maxTextAreaLength,
      placeholder,
      question,
      questionsTexts,
      setQuestionsTexts,
      state,
      stylePrefix,
      textAreaRows,
      textAreaWidth,
    },
    ref
  ) => (
    <div
      className={`${className ?? ""} ${stylePrefix}questions-container`}
      key={`question-${index}`}
    >
      <label className={`${stylePrefix}question`} htmlFor={`question-${index}`}>
        {question}
      </label>{" "}
      <TextArea
        containsQuestions={containsQuestions}
        dispatch={dispatch}
        id={`question-${index}`}
        index={index}
        maxLength={maxTextAreaLength}
        placeholder={placeholder}
        questionsTexts={questionsTexts}
        ref={ref}
        rows={textAreaRows}
        setText={(textValue: string) => {
          const tempQuestions: string[] = [...questionsTexts];
          tempQuestions[index] = textValue;
          setQuestionsTexts(tempQuestions);
        }}
        state={state}
        stylePrefix={stylePrefix}
        text={questionsTexts[index]}
        width={textAreaWidth}
      />
      {state.status === 5 && state.errorIndexes.has(index) && (
        <div
          className={"mephisto-addons-worker-opinion__red-box"}
          style={{ width: textAreaWidth }}
        >
          {state.text}
        </div>
      )}
    </div>
  )
);

export default Question;
