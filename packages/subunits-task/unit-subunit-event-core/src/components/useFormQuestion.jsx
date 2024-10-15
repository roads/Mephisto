import { useState, useEffect } from "react";

import formatEvent from "./utils.js";

function useFormQuestion(options, onEvents) {
  // Create state to track selected state.
  const initialAnswerState = new Array(options.length).fill(false);
  const initialAnswerText = new Array(options.length).fill("");
  const [answerState, setAnswerState] = useState(initialAnswerState);
  const [answerText, setAnswerText] = useState(initialAnswerText);
  // Create state to track submit button eligibility.
  const [isComplete, setIsComplete] = useState(false);
  const initialEvent = formatEvent({
    kind: "FormQuestion.initialRender",
    agent: "browser",
    optional_data: {
      answer_state: answerState,
      answer_text: answerText,
      is_complete: isComplete,
    },
  });
  // Add browser-initiated event for initial render.
  useEffect(() => {
    onEvents([initialEvent]);
  }, []);

  function countSelectedOptions(answerState) {
    let nSelected = 0;
    for (let i = 0; i < answerState.length; i++) {
      if (answerState[i]) {
        nSelected += 1;
      }
    }
    return nSelected;
  }

  function handleChange(e) {
    // Use `e.target.id` since this works for both `Form.Control` and `Form.Check`.
    const optionParts = e.target.id.split("-");
    const optionType = optionParts[1];
    const optionIndex = parseInt(optionParts[2]);
    const optionValue = e.target.value;

    let updatedAnswerState = [...answerState];
    updatedAnswerState = answerState.map((s, i) => {
      if (optionType === "textarea") {
        if (i === optionIndex) {
          if (optionValue.length === 0) {
            return false;
          } else {
            return true;
          }
        } else {
          return s;
        }
      } else if (optionType === "radio") {
        if (i === optionIndex) {
          return true;
        } else {
          return false;
        }
      } else {
        // Toggle checkbox (no events)
        if (i === optionIndex) {
          return !s;
        } else {
          return s;
        }
      }
    });
    let updatedAnswerText = [...answerText];
    updatedAnswerText = answerText.map((s, i) => {
      if (optionType === "textarea") {
        if (i === optionIndex) {
          return optionValue;
        } else {
          return s;
        }
      } else {
        return s;
      }
    });

    setAnswerState(updatedAnswerState);
    setAnswerText(updatedAnswerText);

    // Only allow advancement if at least one thing has been selected.
    const nSelected = countSelectedOptions(updatedAnswerState);
    let newIsComplete = false;
    if (nSelected > 0) {
      newIsComplete = true;
    }
    setIsComplete(newIsComplete);

    // Append event to history.
    const newEvent = formatEvent({
      kind: "FormQuestion.handleChange",
      agent: "user",
      optional_data: {
        answer_state: updatedAnswerState,
        answer_text: updatedAnswerText,
        is_complete: newIsComplete,
      },
    });
    onEvents([newEvent]);
  }

  return {
    answerState,
    answerText,
    handleChange,
  };
}

export default useFormQuestion;
