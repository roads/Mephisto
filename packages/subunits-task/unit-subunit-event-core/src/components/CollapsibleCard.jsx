import React from "react";
import { useState, useEffect } from "react";

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Collapse from "react-bootstrap/Collapse";
import Card from "react-bootstrap/Card";

import formatEvent from "./utils.js";

function CollapsibleCard({ children, onEvents, startOpen = false }) {
  const header = React.Children.map(children, (child) =>
    child.type.displayName === "Header" ? child : null
  );
  const body = React.Children.map(children, (child) =>
    child.type.displayName === "Body" ? child : null
  );

  const [isOpen, setIsOpen] = useState(startOpen);

  // Add browser-initiated event for initial render.
  const initialEvent = formatEvent({
    kind: "CollapsibleCard.initialRender",
    agent: "browser",
    optional_data: {
      startOpen: startOpen,
      isOpen: isOpen,
    },
  });
  useEffect(() => {
    onEvents([initialEvent]);
  }, []);

  function handleClick() {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    const newEvent = formatEvent({
      kind: "CollapsibleCard.handleClick",
      agent: "user",
      optional_data: {
        startOpen: startOpen,
        isOpen: newIsOpen,
      },
    });
    onEvents([newEvent]);
  }
  return (
    <Card className="collapsible-card mb-3">
      <Card.Header className="collapsible-card-header">
        <Row>
          <Col sm="auto">
            <Button
              onClick={handleClick}
              aria-controls="collapsible-card-header"
              aria-expanded={isOpen}
              className="mr-2"
              variant="primary"
            >
              ?
            </Button>
          </Col>
          <Col>{header}</Col>
        </Row>
      </Card.Header>
      <Collapse in={isOpen}>
        <div className="collapsible-card-body">
          <Card.Body>{body}</Card.Body>
        </div>
      </Collapse>
    </Card>
  );
}

const Header = ({ children }) => children;
Header.displayName = "Header";
CollapsibleCard.Header = Header;

const Body = ({ children }) => children;
Body.displayName = "Body";
CollapsibleCard.Body = Body;

export default CollapsibleCard;
