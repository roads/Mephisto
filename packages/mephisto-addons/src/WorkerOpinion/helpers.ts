/*
 * Copyright (c) Meta Platforms and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as React from "react";

/**
 * @callback submitCallback
 * @callback changeCallback
 */

const ADDON_TYPE: string = "worker_opinion";
const HIDE_ALERT_DELAY: number = 5000;

/**
 * Creates a Worker Opinion item in the format that is accepted
 * by the handleMetadataSubmit function from the
 * `mephisto-core` library.
 *
 * @return {{data: [{question: string, text: string}], type: string}} A FormData object that can
 * be used as a parameter of the handleSubmitMetadata() method in the `mephisto-core` package
 */
export function createWorkerOpinion(
  generalText: string,
  questionsTexts: string[],
  questions: string[],
  containsQuestions: boolean
): FormData {
  let opinionData: OpinionDataType = {};
  const formData: FormData = new FormData();

  if (containsQuestions) {
    const isAllQuestionStrings: boolean = questionsTexts.every(
      (currentQuestionText) =>
        currentQuestionText && typeof currentQuestionText === "string"
    );

    if (!isAllQuestionStrings) {
      throw new Error(
        "A Worker Opinion response to one of the questions is not a string"
      );
    }

    opinionData.questions = questions.map(
      (currentQuestion: string, index: number) => ({
        question: currentQuestion,
        text: questionsTexts[index],
      })
    );
  } else {
    if (!generalText || !(typeof generalText === "string"))
      throw new Error("Worker Opinion text is not a string");

    opinionData.questions = [
      { question: "General Worker Opinion", text: generalText },
    ];
  }

  const data: WorkerOpinionDataType = {
    worker_opinion: opinionData,
  };

  // Append files in Form Data next to JSON data
  const filesInfo: OpinionFileInfoType[] = [];
  const fileInputs = document.querySelectorAll("input[type='file'].metadata");
  fileInputs.forEach((input: HTMLInputElement) => {
    if (input.files?.length) {
      Object.values(input.files).forEach((file: OpinionFile) => {
        formData.append(input.name, file, file.name);
        filesInfo.push({
          lastModified: file.lastModified ? file.lastModified : -1,
          name: file.name ? file.name : "",
          size: file.size ? file.size : -1,
          type: file.type ? file.type : "",
          filename: file.filename,
          fieldname: file.fieldname,
        });
      });
    }
  });

  formData.set("data", JSON.stringify(data)); // Main JSON data to save in storage
  formData.set("files", JSON.stringify(filesInfo)); // Info for saving files in storage
  formData.set("type", ADDON_TYPE); // Type of metadata

  return formData;
}

/** When handleSubmit is not defined, this
 * function submits the current Worker Opinion data to the backend.
 * It also does success/error handling.
 *
 * When handleSubmit is defined, the handleSubmit
 * function is ran with the workerOpinionData obj as its first parameter.
 */
export function handleWorkerOpinionSubmit(
  handleSubmit: Function,
  handleMetadataSubmit: Function,
  dispatch: Function,
  generalText: string,
  setGeneralText: React.Dispatch<React.SetStateAction<string>>,
  questionsTexts: string[],
  setQuestionsTexts: React.Dispatch<React.SetStateAction<string[]>>,
  questions: string[],
  containsQuestions: boolean,
  setAttachmentsNames: React.Dispatch<React.SetStateAction<string[]>>,
  setAttachmentsValue: React.Dispatch<React.SetStateAction<string>>
) {
  if (handleSubmit) {
    handleSubmit(generalText);
  } else {
    dispatch({ type: "loading" });

    handleMetadataSubmit(
      createWorkerOpinion(
        generalText,
        questionsTexts,
        questions,
        containsQuestions
      )
    )
      .then((data: HandleMetadataSubmitResponseType) => {
        if (data.status === "Submitted metadata") {
          setGeneralText("");
          setQuestionsTexts(questionsTexts.map(() => ""));
          setAttachmentsNames([]);
          setAttachmentsValue("");

          dispatch({ type: "success" });

          setTimeout(() => {
            dispatch({ type: "return-to-default" });
          }, HIDE_ALERT_DELAY);
        }
      })
      .catch((error: any) => {
        console.error("createWorkerOpinion", error);
        dispatch({ type: "error" });

        setTimeout(() => {
          dispatch({ type: "return-to-default" });
        }, HIDE_ALERT_DELAY);
      });
  }
}

/**
 * Dispatches the correct action to handle length error
 * This is run when the general Worker Opinion text (no questions) changes.
 */
export function dispatchWorkerOpinionActionNoQuestions(
  e: React.ChangeEvent<HTMLTextAreaElement>,
  maxLength: number,
  state: WorkerOpinionStateType,
  dispatch: React.Dispatch<any>
) {
  if (e.target.value.length > maxLength && state.status !== 4) {
    dispatch({ type: "too-long" });
  } else if (e.target.value.length <= maxLength) {
    dispatch({ type: "return-to-default" });
  }
}

/**
 * Dispatches the correct action to handle length errors for any of the questions
 * This is run when there are questions present.
 */
export function dispatchWorkerOpinionActionWithQuestions(
  e: React.ChangeEvent<HTMLTextAreaElement>,
  maxLength: number,
  currentIndex: number,
  dispatch: React.Dispatch<any>,
  questionsTexts: string[]
) {
  const errorIndexes = new Set([]);

  for (let i = 0; i < questionsTexts.length; i++) {
    if (currentIndex === i) {
      if (e.target.value.length > maxLength) {
        errorIndexes.add(i);
      } else if (errorIndexes.has(i)) {
        errorIndexes.delete(i);
      }
    } else {
      if (questionsTexts[i].length > maxLength) {
        errorIndexes.add(i);
      } else if (errorIndexes.has(i)) {
        errorIndexes.delete(i);
      }
    }
  }

  if (errorIndexes.size > 0) {
    dispatch({ type: "multiple-errors", errorIndexes: errorIndexes });
  } else {
    dispatch({ type: "return-to-default" });
  }
}

/**
 * Determines if the submit button should be disabled.
 * There are different disabling conditions if there are questions present vs
 * if there are no questions present.
 */
export function isSubmitButtonDisabled(
  containsQuestions: boolean,
  generalText: string,
  questionsTexts: string[],
  state: WorkerOpinionStateType
): boolean {
  if (containsQuestions) {
    return state.errorIndexes !== null || questionsTexts.includes("");
  } else {
    return generalText.length <= 0 || state.status === 1 || state.status === 4;
  }
}

/**
 * Runs the change callback when typing occurs in a Worker Opinion textarea.
 * If the Worker Opinion textarea content is too long, then change state.
 */
export function handleChangeWorkerOpinion(
  e: React.ChangeEvent<HTMLTextAreaElement>,
  dispatchAction: React.Dispatch<any>,
  changeCallback: Function
) {
  changeCallback(e);
  dispatchAction(null);
}
