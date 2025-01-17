import React from "react";

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

export default function ExampleConsentContent({ }) {
  return (
    <>
      <h3>Consent Form</h3>
      <Row>
        <Col>
          <strong>TITLE:</strong>
        </Col>
        <Col>Example Title</Col>
      </Row>
      <Row>
        <Col>
          <strong>PROTOCOL NO.:</strong>
        </Col>
        <Col>ABC-XYX</Col>
      </Row>
      <Row>
        <Col>
          <strong>INVESTIGATOR:</strong>
        </Col>
        <Col>investigator name</Col>
      </Row>
      <Row>
        <Col>
          <strong>STUDY-RELATED CONTACT INFORMATION:</strong>
        </Col>
        <Col>xxx-xxx-xxxx</Col>
      </Row>

      <br />
      <p>
        You are being invited to participate ...
      </p>

      <p>
        The purpose of this study is to ...
      </p>

      <p>
        If you agree to take part in this study...
      </p>

      <p>
        By clicking “I agree” below you are ...
      </p>
    </>
  );
}
