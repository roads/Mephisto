import React from "react";

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";

import useFormQuestion from "./useFormQuestion.jsx";

export default function FormQuestion({ subunitInput, onEvents }) {
  const question = subunitInput.data.question;
  const options = subunitInput.data.options;
  const { answerState, answerText, handleChange } = useFormQuestion(
    options,
    onEvents
  );

  return (
    <Form onChange={handleChange}>
      <Form.Label>{question}</Form.Label>
      {options.map((option) => {
        if (option.type === "textarea") {
          return (
            <Row key={option.index}>
              <Col>
                <Form.Control
                  id={`option-${option.type}-${option.index}`}
                  as="textarea"
                  rows={1}
                  placeholder={"Other (please specify)"}
                />
              </Col>
            </Row>
          );
        }
        return (
          <Row key={option.index}>
            <Col>
              <Form.Check
                type={option.type}
                id={`option-${option.type}-${option.index}`}
                label={option.text}
                name={"form-question-group"}
                value={option.index}
              />
            </Col>
          </Row>
        );
      })}
    </Form>
  );
}
