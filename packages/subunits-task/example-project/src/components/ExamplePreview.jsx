import React from "react";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";

export default function ExamplePreview({ duration_estimate_min }) {
  // TODO
  return (
    <Container fluid>
      <Row className="subunit">
        <Col></Col>
        <Col sm={12} md={10} lg={8}>
          <Card bg={"light"}>
            <Card.Body>
              <Card.Title>
                Some title
              </Card.Title>
              <ul>
                <li>
                  Your task is to ...
                </li>
                <li>
                  and to ...
                </li>
                <li>
                  You must be at least <strong>18 years old</strong> to
                  participate.
                </li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
        <Col></Col>
      </Row>
    </Container>
  );
}
