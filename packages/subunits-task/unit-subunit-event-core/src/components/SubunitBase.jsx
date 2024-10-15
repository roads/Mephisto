import React from "react";
import { useState, useEffect, useContext } from "react";
import { ComponentRegistryContext } from "./ComponentRegistryContext.jsx";

export default function SubunitBase({ subunitInput, onFinalizeSubunit }) {
  const componentRegistry = useContext(ComponentRegistryContext);

  // Make sure subunit starts with window scroll at top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Initialize subunit-level output. The events data will be added
  // incrementally, event by event.
  const initialSubunitOutput = {
    meta: subunitInput.meta,
    data: subunitInput.data,
    events: [],
  };
  const [subunitOutput, setSubunitOutput] = useState(initialSubunitOutput);

  function handleEvents(newEvents, requestedSubunitIndex = "") {
    // NOTE: This function handles events that require a page change (i.e.,
    // a different subunit index) and events that do not require a page change.
    // The different behavior is goverend by `requestedSubunitIndex` being
    // a non-empty string.

    // Record new event by appending to subunit's event history.
    setSubunitOutput((prevSubunitOutput) => {
      return {
        meta: prevSubunitOutput.meta,
        data: prevSubunitOutput.data,
        events: [...prevSubunitOutput.events, ...newEvents],
      };
    });

    if (Number.isInteger(requestedSubunitIndex)) {
      // NOTE: If multiple state changes occur on finalization, there is a
      // chance that some of the recently committed events will be dropped.
      const currentSubunitOutput = {
        meta: subunitOutput.meta,
        data: subunitOutput.data,
        events: [...subunitOutput.events, ...newEvents],
      };
      onFinalizeSubunit(currentSubunitOutput, requestedSubunitIndex);
    }
  }

  const VariableSubunit = componentRegistry[subunitInput.data.kind];

  // Determine subunit styling.
  var subunitVariant = "default";
  if (subunitInput.data.variant !== undefined) {
    subunitVariant = subunitInput.data.variant;
  }

  return (
    <VariableSubunit
      subunitInput={subunitInput}
      onEvents={handleEvents}
      variant={subunitVariant}
    />
  );
}
