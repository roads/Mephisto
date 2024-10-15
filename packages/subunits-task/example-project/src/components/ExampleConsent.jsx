import React from "react";
import { useEffect } from "react";

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";

import { formatEvent } from "unit-subunit-event-core";

import ExampleConsentContent from "./ExampleConsentContent.jsx";

export default function ExampleConsent({ subunitInput, onEvents, variant }) {
  const AGREE_BUTTON_TEXT = "I Agree";
  const NOT_AGREE_BUTTON_TEXT = "I Do Not Agree";
  // Add browser-initiated event for initial render.
  const initialEvent = formatEvent({
    kind: "ExampleConsent.initialRender",
    agent: "browser",
  });
  useEffect(() => {
    onEvents([initialEvent]);
  }, []);

  function handleNextClick(requestedSubunitIndex, buttonText) {
    // Append event to recorded events.
    const newEvent = formatEvent({
      kind: "ExampleConsent.handleNextClick",
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
                <ExampleConsentContent />
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col></Col>
          <Col>
            <Button
              variant="success"
              onClick={() =>
                handleNextClick(
                  subunitInput.data.subunit_index + 1,
                  AGREE_BUTTON_TEXT
                )
              }
              disabled={false}
            >
              {AGREE_BUTTON_TEXT}
            </Button>
          </Col>
          <Col>
            <Button
              variant="danger"
              onClick={() => handleNextClick(-1, NOT_AGREE_BUTTON_TEXT)}
              disabled={false}
            >
              {NOT_AGREE_BUTTON_TEXT}
            </Button>
          </Col>
          <Col></Col>
        </Row>
      </Col>
      <Col></Col>
    </Row>
  );
}
