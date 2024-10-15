import React from "react";
import { createRoot } from "react-dom/client";

import { SelfServeLanding, useSelfServeTask } from "self-serve-task";

import { UnitBase, IndexedUnit } from "unit-subunit-event-core";

// Import any project-specific components you need here and add them to
// `componentRegistry` below.
import {
  ExampleConsent,
  ExampleDebriefing,
  ExampleInstructions,
  ExampleQueryCard,
  ExampleRankable,
  ExampleReferenceCard,
  ExampleSink,
} from "example-project";


import tasks from "./tasks/example_project.json";

const container = document.getElementById("app");
const root = createRoot(container);

function MainApp() {
  const {
    isLanding,
    optionList,
    taskData,
    handleLandingSubmit,
    handleTaskSubmit,
  } = useSelfServeTask(tasks);

  // A registry of the needed components. Add any custom components you need
  // here.
  const componentRegistry = {
    IndexedUnit: IndexedUnit,
    ExampleConsent: ExampleConsent,
    ExampleDebriefing: ExampleDebriefing,
    ExampleInstructions: ExampleInstructions,
    ExampleQueryCard: ExampleQueryCard,
    ExampleRankable: ExampleRankable,
    ExampleReferenceCard: ExampleReferenceCard,
    ExampleSink: ExampleSink,
  };

  if (isLanding) {
    return (
      <SelfServeLanding
        optionList={optionList}
        onSubmit={handleLandingSubmit}
      />
    );
  }

  const unitInput = taskData.unit;
  return (
    <UnitBase
      unitInput={unitInput}
      onSubmit={handleTaskSubmit}
      componentRegistry={componentRegistry}
    />
  );
}

root.render(<MainApp />);
