import React from "react";
import { useState, useEffect } from "react";

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";

import {
  CollapsibleCard,
  Rankable,
  ThumbButtons,
  TextArea,
  formatEvent,
} from "unit-subunit-event-core";


export default function ExampleRankable({ subunitInput, onEvents, variant }) {
  const NEXT_BUTTON_TEXT = "Next";
  const thumbsPromptText = "Were the options ok?";
  const [isDisabled, setIsDisabled] = useState(true);
  const [textAreaEvent, setTextAreaEvent] = useState({});

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
        setIsDisabled(false);
      } else {
        setIsDisabled(true);
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

  return (
    <Row className={`subunit pt-3 pb-3 ${variant}`}>
      <Col></Col>
      <Col sm={12} md={10} lg={8}>
        <Row>
          <Col>
            <CollapsibleCard onEvents={onEvents}>
              <CollapsibleCard.Header>
                <h4>Instructions</h4>
                Your task is to ...
              </CollapsibleCard.Header>
              <CollapsibleCard.Body>
                Your task is to ...
              </CollapsibleCard.Body>
            </CollapsibleCard>
          </Col>
        </Row>
        <Rankable
          items={subunitInput.data.items}
          nSelect={subunitInput.data.n_select}
          moveReferences={true}
          onEvents={handleRankEvents}
        />
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
        <Row>
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
        </Row>
      </Col>
      <Col></Col>
    </Row>
  );
}
