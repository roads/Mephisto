import React from "react";

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";

export default function OnboardingSinkSubunit(subunitInput, onEvents, variant) {
  return (
    <Row className={`subunit pt-3 pb-3 ${variant}`}>
      <Col></Col>
      <Col sm={12} md={10} lg={8}>
        <Card className="mb-3">
          <Card.Body>
            <p>Checking your eligibility ...</p>
          </Card.Body>
        </Card>
      </Col>
      <Col></Col>
    </Row>
  );
}
