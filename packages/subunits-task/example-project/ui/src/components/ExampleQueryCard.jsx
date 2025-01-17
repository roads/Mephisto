import React from "react";
import Card from "react-bootstrap/Card";

import { QueryCard } from "unit-subunit-event-core";

export default function ExampleQueryCard({ itemInput }) {
  return (
    <QueryCard className={`mb-3`}>
      <Card.Body>
        <Card.Title>Query</Card.Title>
        {itemInput.text}
      </Card.Body>
    </QueryCard>
  );
}
