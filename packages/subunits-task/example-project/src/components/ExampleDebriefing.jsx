import React from "react";
import { useState, useEffect } from "react";

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";

import { TextArea, ThumbButtons, formatEvent } from "unit-subunit-event-core";

export default function ExampleDebriefing({ subunitInput, onEvents, variant }) {
  const FINISH_BUTTON_TEXT = "Finish";
  const thumbsPromptText = "Was this task reasonable?";
  const [textAreaEvent, setTextAreaEvent] = useState({});

  // Add browser-initiated event for initial render.
  const initialEvent = formatEvent({
    kind: "ExampleDebriefing.initialRender",
    agent: "browser",
  });
  useEffect(() => {
    onEvents([initialEvent]);
  }, []);

  function handleTextAreaEvents(newEvents, requestedSubunitIndex) {
    // Intercept all textarea changes so we don't pollute the output.
    const firstEvent = newEvents.at(0); // TODO HACK replace with proper loop
    if (firstEvent.data.kind === "TextArea.handleChange") {
      setTextAreaEvent(firstEvent);
    }
  }

  function handleNextClick(requestedSubunitIndex, buttonText) {
    // Append textarea and button event to recorded events.
    const newEvent = formatEvent({
      kind: "ExampleDebriefing.handleNextClick",
      agent: "user",
      optional_data: {
        button_text: buttonText,
      },
    });
    onEvents([textAreaEvent, newEvent], requestedSubunitIndex);
  }

  return (
    <Row className={`subunit pt-3 pb-3 ${variant}`}>
      <Col></Col>
      <Col sm={12} md={10} lg={8}>
        <Row>
          <Col>
            <Card className="mb-3">
              <Card.Body>
                <Card.Title>Debriefing</Card.Title>
                <p>
                  The purpose of this task is ...
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col>
            <Card className={`mb-3`}>
              <Card.Body>
                <Card.Title>(optional) General Feedback</Card.Title>
                <Row>
                  <Col md="auto">{thumbsPromptText}</Col>
                  <Col md="auto">
                    <ThumbButtons
                      className="mb-2"
                      onEvents={onEvents}
                      iconSize="20"
                    />
                  </Col>
                  <Col></Col>
                </Row>
                <Row>
                  <Col>
                    <TextArea
                      onEvents={handleTextAreaEvents}
                      placeholder={
                        "If you would like to provide any general feedback, you can include it here ..."
                      }
                      rows={3}
                    />
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col></Col>
          <Col sm="auto">
            <Button
              variant="primary"
              onClick={() =>
                handleNextClick(
                  subunitInput.data.subunit_index + 1,
                  FINISH_BUTTON_TEXT
                )
              }
              disabled={false}
            >
              {FINISH_BUTTON_TEXT}
            </Button>
          </Col>
          <Col></Col>
        </Row>
      </Col>
      <Col></Col>
    </Row>
  );
}
