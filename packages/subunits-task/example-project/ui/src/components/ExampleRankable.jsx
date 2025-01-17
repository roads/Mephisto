import React from "react";
import { useState, useEffect } from "react";

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";

import {
  CollapsibleCard,
  MotionRow,
  Rankable,
  ThumbButtons,
  TextArea,
  formatEvent,
} from "unit-subunit-event-core";

export default function ExampleRankable({ subunitInput, onEvents, variant }) {
  const NEXT_BUTTON_TEXT = "Next";
  const [textAreaEvent, setTextAreaEvent] = useState({});
  const thumbsPromptText = "Were the options ok?";
  const [isNextDisabled, setIsNextDisabled] = useState(true);

  const initialEvent = formatEvent({
    kind: "ExampleRankable.initialRender",
    agent: "browser",
  });
  // Add browser-initiated event for initial render.
  useEffect(() => {
    onEvents([initialEvent]);
  }, []);

  function handleRankEvents(newEvents) {
    onEvents(newEvents);
    const firstEvent = newEvents.at(0); // TODO HACK replace with proper loop
    if (firstEvent.data.kind === "Rankable.handleReferenceClick") {
      if (firstEvent.data.is_complete) {
        setIsNextDisabled(false);
      } else {
        setIsNextDisabled(true);
      }
    }
  }

  function handleTextAreaEvents(newEvents, requestedSubunitIndex) {
    // Intercept all textarea changes so we don't pollute the output.
    const firstEvent = newEvents.at(0); // TODO HACK replace with proper loop
    if (firstEvent.data.kind === "TextArea.handleChange") {
      setTextAreaEvent(firstEvent);
    }
  }

  function handleNextClick(requestedSubunitIndex, buttonText) {
    // Append textarea event and submit event to recorded
    // events.
    const newEvent = formatEvent({
      kind: "ExampleRankable.handleNextClick",
      agent: "user",
      optional_data: {
        button_text: buttonText,
      },
    });
    onEvents([textAreaEvent, newEvent], requestedSubunitIndex);
  }

  // Transition spec to control both reference card movement and movement of
  // rows when instructions are expanded/collapsed.
  const rowTransition = {
    type: "tween",
    duration: 0.2,
    ease: "linear",
  };

  const cardTransition = {
    type: "tween",
    duration: 0.2,
    ease: "linear",
  };

  return (
    <Row className={`subunit pt-3 pb-3 ${variant}`}>
      <Col></Col>
      <Col sm={12} md={10} lg={8}>
        <Row>
          <Col>
            <CollapsibleCard onEvents={onEvents}>
              <CollapsibleCard.Header>
                <h4>Instructions</h4>
                <span>Your task is to ...</span>
              </CollapsibleCard.Header>
              <CollapsibleCard.Body>
                <span>
                  Detailed instructions of your task Detailed instructions of
                  your task Detailed instructions of your task Detailed
                  instructions of your task Detailed instructions of your task
                  Detailed instructions of your task Detailed instructions of
                  your task Detailed instructions of your task Detailed
                  instructions of your task Detailed instructions of your task
                  Detailed instructions of your task Detailed instructions of
                  your task Detailed instructions of your task Detailed
                  instructions of your task Detailed instructions of your task
                  Detailed instructions of your task Detailed instructions of
                  your task Detailed instructions of your task Detailed
                  instructions of your task Detailed instructions of your task
                  Detailed instructions of your task Detailed instructions of
                  your task Detailed instructions of your task Detailed
                  instructions of your task Detailed instructions of your task
                  Detailed instructions of your task Detailed instructions of
                  your task Detailed instructions of your task Detailed
                  instructions of your task Detailed instructions of your task
                  Detailed instructions of your task Detailed instructions of
                  your task Detailed instructions of your task Detailed
                  instructions of your task Detailed instructions of your
                  task...
                </span>
              </CollapsibleCard.Body>
            </CollapsibleCard>
          </Col>
        </Row>
        <MotionRow xs={1} md={3} lg={3} layout transition={rowTransition}>
          <Rankable
            items={subunitInput.data.items}
            nSelect={subunitInput.data.n_select}
            moveReferences={true}
            onEvents={handleRankEvents}
            transition={cardTransition}
          />
        </MotionRow>
        <MotionRow layout transition={rowTransition}>
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
              disabled={isNextDisabled}
            >
              {NEXT_BUTTON_TEXT}
            </Button>
          </Col>
          <Col></Col>
        </MotionRow>
        <MotionRow layout transition={rowTransition}>
          <Col>
            <Card className={`mb-3`}>
              <Card.Body>
                <Row>
                  <Col md="auto">{thumbsPromptText}</Col>
                  <Col md="auto">
                    <ThumbButtons onEvents={onEvents} iconSize="20" />
                  </Col>
                  <Col>
                    <TextArea
                      onEvents={handleTextAreaEvents}
                      placeholder={"(optional) Additional feedback here..."}
                    />
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </MotionRow>
      </Col>
      <Col></Col>
    </Row>
  );
}
