import React from "react";
import { useState, useEffect } from "react";

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";

import { FormQuestion, formatEvent } from "unit-subunit-event-core";

export default function ExampleFormQuestion({ subunitInput, onEvents, variant }) {
  const NEXT_BUTTON_TEXT = "Next";
  const [isDisabled, setIsDisabled] = useState(true);
  const [questionEvent, setQuestionEvent] = useState({});

  const initialEvent = formatEvent({
    kind: "ExampleFormQuestion.initialRender",
    agent: "browser",
  });
  // Add browser-initiated event for initial render.
  useEffect(() => {
    onEvents([initialEvent]);
  }, []);

  function handleQuestionEvents(newEvents) {
    // Intercept all textarea changes so we don't pollute the output.
    onEvents(newEvents);
    const firstEvent = newEvents.at(0); // TODO HACK replace with proper loop
    if (firstEvent.data.kind === "FormQuestion.handleChange") {
      setQuestionEvent(firstEvent);
      if (firstEvent.data.is_complete) {
        setIsDisabled(false);
      } else {
        setIsDisabled(true);
      }
    }
  }

  function handleNextClick(requestedSubunitIndex, buttonText) {
    // Append final question event and submit event to recorded
    // events.
    const newEvent = formatEvent({
      kind: "ExampleFormQuestion.handleNextClick",
      agent: "user",
      optional_data: {
        button_text: buttonText,
      },
    });
    onEvents([questionEvent, newEvent], requestedSubunitIndex);
  }

  return (
    <Row className={`subunit pt-3 pb-3 ${variant}`}>
      <Col></Col>
      <Col sm={12} md={10} lg={8}>
        <Row>
          <Col>
            <Card className="mb-3">
              <Card.Body>
                <h3>{subunitInput.data.heading}</h3>
                <FormQuestion
                  md={3}
                  subunitInput={subunitInput}
                  onEvents={handleQuestionEvents}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col></Col>
          <Col sm="auto">
            <Button
              variant="primary"
              className={"mb-3"}
              onClick={() =>
                handleNextClick(
                  subunitInput.data.subunit_index + 1,
                  NEXT_BUTTON_TEXT
                )
              }
              disabled={isDisabled}
            >
              {NEXT_BUTTON_TEXT}
            </Button>
          </Col>
          <Col></Col>
        </Row>
      </Col>
      <Col></Col>
    </Row>
  );
}
