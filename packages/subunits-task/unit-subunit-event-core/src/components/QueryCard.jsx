import React from "react";

import Card from "react-bootstrap/Card";

function QueryCard({ className, children }) {
  return <Card className={`rankable query ${className}`}>{children}</Card>;
}

export default QueryCard;
