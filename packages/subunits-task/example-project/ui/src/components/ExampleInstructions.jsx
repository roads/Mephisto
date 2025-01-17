import React from "react";
import { useEffect } from "react";

import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";

import { formatEvent } from "unit-subunit-event-core";

export default function ExampleInstructions({
  subunitInput,
  onEvents,
  variant,
}) {
  const NEXT_BUTTON_TEXT = "Next";

  // Add browser-initiated event for initial render.
  const initialEvent = formatEvent({
    kind: "ExampleInstructions.initialRender",
    agent: "browser",
  });
  useEffect(() => {
    onEvents([initialEvent]);
  }, []);

  function handleNextClick(requestedSubunitIndex, buttonText) {
    // Append event to recorded events.
    const newEvent = formatEvent({
      kind: "ExampleInstructions.handleNextClick",
      agent: "user",
      optional_data: {
        button_text: buttonText,
      },
    });
    onEvents([newEvent], requestedSubunitIndex);
  }

  return (
    <Row className={`subunit pt-3 pb-3 ${variant}`}>
      <Col></Col>
      <Col sm={12} md={10} lg={8}>
        <Row>
          <Col>
            <Card className="mb-3">
              <Card.Body>
                <Card.Title>Instructions</Card.Title>
                <Row>
                  <Col>
                    <ul>
                      <li>Your task is to ...</li>
                      <li>And to ...</li>
                    </ul>
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
                  NEXT_BUTTON_TEXT
                )
              }
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
