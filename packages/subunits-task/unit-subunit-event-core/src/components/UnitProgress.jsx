import React from "react";

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import ProgressBar from "react-bootstrap/ProgressBar";

export default function UnitProgress({
  subunitIndex,
  nSubunit,
  variant,
  label = "Progress:",
}) {
  // Progress is computed by subtracting 1 from `nSubunit` so that progress
  // bar reads 100% when the last subunit is active.
  const percentUnitComplete = Math.round((subunitIndex / (nSubunit - 1)) * 100);

  return (
    <Row className={`unit-progress ${variant}`}>
      <Col></Col>
      <Col sm={12} md={10} lg={8}>
        <Row>
          <Col>{label}</Col>
        </Row>
        <Row>
          <Col>
            <ProgressBar
              animated
              now={percentUnitComplete}
              label={`${percentUnitComplete}%`}
              className="mb-3"
            />
          </Col>
        </Row>
      </Col>
      <Col></Col>
    </Row>
  );
}
