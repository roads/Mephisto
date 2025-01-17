import React from "react";
import Card from "react-bootstrap/Card";

import { ReferenceCard } from "unit-subunit-event-core";

export default function ExampleReferenceCard({
  itemInput,
  referenceState,
  onClick,
}) {

  return (
    <ReferenceCard
      className={`mb-3`}
      referenceState={referenceState}
      onClick={onClick}
    >
      <Card.Header className={"pt-0 pb-0"}>
        <strong>Reference</strong>
      </Card.Header>
      <Card.Body className={"pt-0 pb-0"}>
        {itemInput.text}
      </Card.Body>
    </ReferenceCard>
  );
}
