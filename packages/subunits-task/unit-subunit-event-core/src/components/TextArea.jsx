import React from "react";
import { useState, useEffect } from "react";

import Form from "react-bootstrap/Form";

import formatEvent from "./utils.js";

export default function TextArea({
  className,
  onEvents,
  placeholder = "Your text here ...",
  rows = 1,
}) {
  // Create state to track feedback.
  const [storedFeedbackText, setStoredFeedbackText] = useState("");
  // Add browser-initiated event for initial render.
  const initialEvent = formatEvent({
    kind: "TextArea.initialRender",
    agent: "browser",
    optional_data: {
      placeholder: placeholder,
      feedback_text: storedFeedbackText,
    },
  });
  useEffect(() => {
    onEvents([initialEvent]);
  }, []);

  function handleChange(e) {
    const newStoredFeedbackText = e.target.value;
    setStoredFeedbackText(newStoredFeedbackText);
    const newEvent = formatEvent({
      kind: "TextArea.handleChange",
      agent: "user",
      optional_data: {
        placeholder: placeholder,
        feedback_text: newStoredFeedbackText,
      },
    });
    onEvents([newEvent]);
  }

  return (
    <Form onChange={handleChange}>
      <Form.Group className={`${className}`} controlId="formUserFeedback">
        <Form.Control as="textarea" rows={rows} placeholder={placeholder} />
      </Form.Group>
    </Form>
  );
}
