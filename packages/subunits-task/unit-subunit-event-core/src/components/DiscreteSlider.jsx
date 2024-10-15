import React from "react";
import { useState, useEffect } from "react";

import RangeSlider from "react-bootstrap-range-slider";

import formatEvent from "./utils.js";

export default function DiscreteSlider({ subunitInput, onEvents }) {
  const optionLabels = subunitInput.data.relevance_labels;

  // Create state to track feedbcak.
  const initialOptionValue = optionLabels.length - 1;
  const [optionValue, setOptionValue] = useState(initialOptionValue);

  // Add browser-initiated event for initial render.
  const initialEvent = formatEvent({
    kind: "DiscreteSlider.initialRender",
    agent: "browser",
    optional_data: {
      option_value: optionValue,
      option_label: optionLabels[optionValue],
      option_labels: optionLabels,
    },
  });
  useEffect(() => {
    onEvents([initialEvent]);
  }, []);

  function handleChange(newOptionValue) {
    setOptionValue(newOptionValue);
    const newEvent = formatEvent({
      kind: "DiscreteSlider.handleChange",
      agent: "user",
      optional_data: {
        option_value: newOptionValue,
        option_label: optionLabels[newOptionValue],
      },
    });
    onEvents([newEvent]);
  }

  return (
    <RangeSlider
      value={optionValue}
      onChange={(e) => handleChange(e.target.value)}
      tooltipLabel={(currentValue) => optionLabels[currentValue]}
      tooltip="on"
      tooltipPlacement="bottom"
      min={0}
      max={optionLabels.length - 1}
      variant="dark"
    />
  );
}
