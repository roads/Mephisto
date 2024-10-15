import React from "react";
import { useState } from "react";

import Container from "react-bootstrap/Container";

import SubunitBase from "./SubunitBase.jsx";
import UnitProgress from "./UnitProgress.jsx";

export default function IndexedUnit({ unitInput, onSubmit, onError, variant }) {
  // Initialize unit-level output. The subunits data will be added
  // incrementally, subunit by subunit.
  const initialUnitOutput = {
    meta: unitInput.meta,
    data: unitInput.data,
    subunits: [],
  };
  const [unitOutput, setUnitOutput] = useState(initialUnitOutput);

  // Initialize unit progress variable.
  const initialUnitProgress = {
    subunitIndex: 0,
    nSubunit: unitInput.subunits.length,
  };
  const [unitProgress, setUnitProgress] = useState(initialUnitProgress);

  // Initialize input data for currently active subunit.
  const subunitInput = unitInput.subunits[unitProgress.subunitIndex];

  function handleFinalizeSubunit(subunitOutput, requestedSubunitIndex) {
    // Update the pointer to active subunit based on incoming information.
    var activeSubunitIndex;
    if (Number.isInteger(requestedSubunitIndex)) {
      if (requestedSubunitIndex == -1) {
        activeSubunitIndex = unitProgress.nSubunit - 1;
      } else {
        activeSubunitIndex = requestedSubunitIndex;
        // But prevent walking off.
        if (activeSubunitIndex >= unitProgress.nSubunit) {
          activeSubunitIndex = unitProgress.nSubunit - 1;
        }
        if (activeSubunitIndex < 0) {
          activeSubunitIndex = 0;
        }
      }
    } else {
      activeSubunitIndex = unitProgress.subunitIndex;
    }

    setUnitProgress({
      subunitIndex: activeSubunitIndex,
      nSubunit: unitProgress.nSubunit,
    });

    // Append new subunit data to unit record.
    setUnitOutput({
      meta: unitOutput.meta,
      data: unitOutput.data,
      subunits: [...unitOutput.subunits, subunitOutput],
    });
  }

  // Submit `unitOuput` to caller when there are no more subunits.
  if (unitProgress.subunitIndex + 1 == unitProgress.nSubunit) {
    onSubmit(unitOutput);
  }

  // Determine `UnitProgress` styling.
  var unitProgressVariant = "default";
  if (unitInput.data.unit_progress_variant !== undefined) {
    unitProgressVariant = unitInput.data.unit_progress_variant;
  }

  if (unitInput.data.show_unit_progress) {
    return (
      <Container fluid className={`unit ${variant}`}>
        <UnitProgress
          subunitIndex={unitProgress.subunitIndex}
          nSubunit={unitProgress.nSubunit}
          variant={unitProgressVariant}
        />
        <SubunitBase
          key={subunitInput.data.subunit_index}
          subunitInput={subunitInput}
          onFinalizeSubunit={handleFinalizeSubunit}
        />
      </Container>
    );
  }
  return (
    <Container fluid className={`unit ${variant}`}>
      <SubunitBase
        key={subunitInput.data.subunit_index}
        subunitInput={subunitInput}
        onFinalizeSubunit={handleFinalizeSubunit}
      />
    </Container>
  );
}
