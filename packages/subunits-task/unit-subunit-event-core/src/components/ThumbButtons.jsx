import React from "react";
import { useState, useEffect } from "react";

import Button from "react-bootstrap/esm/Button.js";

import formatEvent from "./utils.js";
import thumbsDownIcon from "../static/icons/hand-thumbs-down.svg";
import thumbsDownIconFill from "../static/icons/hand-thumbs-down-fill.svg";
import thumbsUpIcon from "../static/icons/hand-thumbs-up.svg";
import thumbsUpIconFill from "../static/icons/hand-thumbs-up-fill.svg";

export default function ThumbButtons({
  className,
  onEvents,
  variant = "light",
  iconSize = "32",
}) {
  const optionLabels = ["thumbs_down", "thumbs_up"];

  // Create state to track feedback.
  const initialOptionValue = optionLabels.length - 1;
  const [optionValue, setOptionValue] = useState(initialOptionValue);

  // Add browser-initiated event for initial render.
  const initialEvent = formatEvent({
    kind: "ThumbButtons.initialRender",
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

  function handleThumbsUpClick() {
    const newOptionValue = 1;
    setOptionValue(newOptionValue);
    const newEvent = formatEvent({
      kind: "ThumbButtons.handleThumbsUpClick",
      agent: "user",
      optional_data: {
        option_value: newOptionValue,
        option_label: optionLabels[newOptionValue],
      },
    });
    onEvents([newEvent]);
  }

  function handleThumbsDownClick() {
    const newOptionValue = 0;
    setOptionValue(newOptionValue);
    const newEvent = formatEvent({
      kind: "ThumbButtons.handleThumbsDownClick",
      agent: "user",
      optional_data: {
        option_value: newOptionValue,
        option_label: optionLabels[newOptionValue],
      },
    });
    onEvents([newEvent]);
  }

  function ThumbsDownButton({ optionValue, onClick }) {
    if (optionValue === 0) {
      return (
        <Button onClick={onClick} className="mr-1" variant={variant}>
          <img
            src={thumbsDownIconFill}
            alt="Bootstrap"
            width={iconSize}
            height={iconSize}
          />
        </Button>
      );
    }
    return (
      <Button onClick={onClick} className="mr-1" variant={variant}>
        <img
          src={thumbsDownIcon}
          alt="Bootstrap"
          width={iconSize}
          height={iconSize}
        />
      </Button>
    );
  }

  function ThumbsUpButton({ optionValue, onClick }) {
    if (optionValue === 1) {
      return (
        <Button onClick={onClick} className="ml-1" variant={variant}>
          <img
            src={thumbsUpIconFill}
            alt="Bootstrap"
            width={iconSize}
            height={iconSize}
          />
        </Button>
      );
    }
    return (
      <Button onClick={onClick} className="ml-1" variant={variant}>
        <img
          src={thumbsUpIcon}
          alt="Bootstrap"
          width={iconSize}
          height={iconSize}
        />
      </Button>
    );
  }

  return (
    <div className={`${className}`}>
      <ThumbsDownButton
        optionValue={optionValue}
        onClick={handleThumbsDownClick}
      />
      <span style={{ margin: "0 8px" }}></span>
      <ThumbsUpButton optionValue={optionValue} onClick={handleThumbsUpClick} />
    </div>
  );
}
