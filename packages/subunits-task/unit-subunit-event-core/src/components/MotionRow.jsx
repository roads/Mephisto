import React from "react";

import Row from "react-bootstrap/Row";
import { motion } from "motion/react";

const RowComponent = React.forwardRef((props, ref) => {
  return <Row {...props} ref={ref} />;
});

const MotionRow = motion.create(RowComponent);

export default MotionRow;
