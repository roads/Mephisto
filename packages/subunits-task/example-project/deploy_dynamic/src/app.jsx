import React from "react";
import { StrictMode } from "react"; // TODO remove when done debugging
import { createRoot } from "react-dom/client";

import { SelfServeLanding, useSelfServeTask } from "self-serve-task";

import { UnitBase, IndexedUnit } from "unit-subunit-event-core";

// Import any project-specific components you need here and also add them to
// `componentRegistry` below.
import {
  ExampleConsent,
  ExampleDebriefing,
  ExampleFormQuestion,
  ExampleInstructions,
  ExampleQueryCard,
  ExampleRankable,
  ExampleReferenceCard,
  ExampleSink,
} from "imagenet-phase2";

import tasks from "./tasks/example_project.json";

const root = createRoot(document.getElementById("app"));

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
    ExampleFormQuestion: ExampleFormQuestion,
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

root.render(
  <StrictMode>
    <MainApp />
  </StrictMode>
);
