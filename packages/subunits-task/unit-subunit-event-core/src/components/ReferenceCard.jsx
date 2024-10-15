import React from "react";

import Badge from "react-bootstrap/Badge";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

function ReferenceCard({ className, children, referenceState, onClick }) {
  const INELIGIBLE_REFERENCE = -1;

  const header = React.Children.map(children, (child) =>
    child.type.displayName === "CardHeader" ? child : null
  );
  const notHeader = React.Children.map(children, (child) =>
    child.type.displayName !== "CardHeader" ? child : null
  );

  // Get any children of CardHeader component.
  var headerChildren = null;
  var headerClassName = null;
  if (header.length > 0) {
    headerChildren = header.at(0).props.children;
    headerClassName = header.at(0).props.className;
  }

  var referenceStateLabel = "";
  if (referenceState > 0) {
    referenceStateLabel = "selected";
  } else if (referenceState === INELIGIBLE_REFERENCE) {
    referenceStateLabel = "ineligible";
  } else {
    referenceStateLabel = "eligible";
  }

  if (referenceState > 0) {
    return (
      <Card
        className={`rankable reference selected ${className}`}
        onClick={onClick}
      >
        <Card.Header className={`${headerClassName}`}>
          <Row>
            <Col>
              {headerChildren}{" "}
              <Badge bg="primary" text="light">
                <strong>#{referenceState}</strong>
              </Badge>
            </Col>
            <Col sm="auto"></Col>
          </Row>
        </Card.Header>
        {notHeader}
      </Card>
    );
  }
  return (
    <Card
      className={`rankable reference ${referenceStateLabel} ${className}`}
      onClick={onClick}
    >
      {header}
      {notHeader}
    </Card>
  );
}

export default ReferenceCard;
