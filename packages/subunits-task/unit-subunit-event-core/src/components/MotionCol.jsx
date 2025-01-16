import React from "react";

import Col from "react-bootstrap/Col";
import { motion } from "motion/react";

const ColComponent = React.forwardRef((props, ref) => {
  return <Col {...props} ref={ref} />;
});

const MotionCol = motion.create(ColComponent);

export default MotionCol;
