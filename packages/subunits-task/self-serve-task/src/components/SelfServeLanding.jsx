import React from "react";
import { useState } from "react";

import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";

export default function SelfServeLanding({ optionList, onSubmit }) {
  const [formData, setFormData] = useState({ username: "", protoUnitId: 0 });
  const NEXT_BUTTON_TEXT = "Next";

  function handleChange(e) {
    const targetId = e.target.id;
    const targetValue = e.target.value;
    var newFormData;
    if (targetId == "landingForm.username") {
      newFormData = {
        username: targetValue,
        protoUnitId: formData.protoUnitId,
      };
    } else if (targetId == "landingForm.protoUnitId") {
      newFormData = {
        username: formData.username,
        protoUnitId: targetValue,
      };
    }
    setFormData(newFormData);
  }

  return (
    <Row className={`self-serve-landing pt-3 pb-3`}>
      <Col></Col>
      <Col sm={12} md={10} lg={8}>
        <Row>
          <Card className={`pt-3 pb-3 mb-3`}>
            <Card.Title>Self-serve Landing</Card.Title>
            <Card.Body>
              <Row>
                <Col>
                  <Form onChange={handleChange}>
                    <Form.Group
                      className="mb-3"
                      controlId="landingForm.username"
                    >
                      <Form.Label>Username</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={1}
                        placeholder={"(optional) Enter username"}
                      />
                    </Form.Group>

                    <Form.Group
                      className="mb-3"
                      controlId="landingForm.protoUnitId"
                    >
                      <Form.Label>Proto-Unit</Form.Label>
                      <Form.Select aria-label="Default select example">
                        {optionList}
                      </Form.Select>
                    </Form.Group>
                  </Form>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Row>
        <Row>
          <Col></Col>
          <Col sm="auto">
            <Button
              variant="primary"
              className={"mb-3"}
              onClick={() => onSubmit(formData)}
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
