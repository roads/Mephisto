import React from "react";
import { createRoot } from "react-dom/client";

import { useMephistoTask, ErrorBoundary } from "mephisto-task";

import {
  UnitBase,
  IndexedUnit,
} from "unit-subunit-event-core";

import LoadingScreen from "./components/LoadingScreen.jsx";
// TODO Import any project-specific components you need here and add them to
// `componentRegistry` below.
import {
  ExampleConsent,
  ExampleDebriefing,
  ExampleInstructions,
  ExamplePreview,
  ExampleQueryCard,
  ExampleRankable,
  ExampleReferenceCard,
  ExampleSink,
} from "example-project";

const container = document.getElementById("app");
const root = createRoot(container);

/* ================= Application Components ================= */

function MainApp() {
  const {
    blockedReason,
    blockedExplanation,
    isPreview,
    isLoading,
    initialTaskData,
    handleSubmit,
    handleFatalError,
    isOnboarding,
  } = useMephistoTask();

  // A registry of the needed subunit components.
  // TODO Add any components you need here.
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

  if (blockedReason !== null) {
    // TODO non-hero classes
    return (
      <section className="hero is-medium is-danger">
        <div className="hero-body">
          <h2 className="title is-3">{blockedExplanation}</h2>{" "}
        </div>
      </section>
    );
  }
  if (isPreview) {
    return <ExamplePreview
      duration_estimate_min={15}
    />;
  }
  if (isLoading || !initialTaskData) {
    return <LoadingScreen />;
  }

  const unitInput = initialTaskData.unit;

  if (isOnboarding) {
    return (
      <UnitBase
        unitInput={unitInput}
        onSubmit={handleSubmit}
        onError={handleFatalError}
        componentRegistry={componentRegistry}
      />
    );
  }

  return (
    <div>
      <ErrorBoundary handleError={handleFatalError}>
        <UnitBase
          unitInput={unitInput}
          onSubmit={handleSubmit}
          onError={handleFatalError}
          componentRegistry={componentRegistry}
        />
      </ErrorBoundary>
    </div>
  );
}

root.render(<MainApp />);
