import React from "react";

import { ComponentRegistryContext } from "./ComponentRegistryContext.jsx";

export default function UnitBase({
  unitInput,
  onSubmit,
  onError,
  componentRegistry,
}) {
  const VariableUnit = componentRegistry[unitInput.data.kind];

  // Determine unit styling.
  var unitVariant = "default";
  if (unitInput.data.variant !== undefined) {
    unitVariant = unitInput.data.variant;
  }

  function handleSubmit(unitOutput) {
    onSubmit({ unit: unitOutput });
  }

  return (
    <ComponentRegistryContext.Provider value={componentRegistry}>
      <VariableUnit
        unitInput={unitInput}
        onSubmit={handleSubmit}
        onError={onError}
        variant={unitVariant}
      />
    </ComponentRegistryContext.Provider>
  );
}
