# unit-subunit-event-core

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

## Description

A React component library that decomposes annotation tasks into a hierarchy of unit, subunit, and event. In crowd-sourcing frameworks, such as [Mephisto](https://mephisto.ai/), an atomic task is termed a [*unit*](https://mephisto.ai/docs/explanations/architecture_overview/). Following this nomenclature, this package implements application-general functionality that by assuming a unit is composed of a set of *subunits*, allowing for annotation sessions with multiple "pages". The abstractions provided by this package allow users to focus on desiging and implementing subunit UIs, and not worry about writing boilerplate code.

## Getting Started

The package is not currently available on npm and must be installed by downloading the repository and installing the package in the host application using the following terminal commands:

```console
cd /path/to/host/webapp/
npm install /path/to/unit-subunit-event-core/unit-subunit-event-core-3.1.0.tgz --save
```

Alternatively, you can add the package as a dependency in your host application's `package.json` file and then run the terminal command `npm install`. For example:

```json
"dependencies": {
    "unit-subunit-event-core": "file:../packages/unit-subunit-event-core/unit-subunit-event-core-3.4.0.tgz"
  },
```

The foundational components are `UnitBase` and `SubunitBase`, which provide the base logic for the unit-level and subunit-level functionality. The package architecture is covered in more detail below.

### Manual Build and Package

If you would like to rebuild the latest version of the package, you can do so using the following terminal commands:

```console
cd /path/to/unit-subunit-event-core/
npm run build
npm pack
```

These commands do the following:
1) Build the component library and places it in the `dist` folder, overwriting any existing version.
2) Package up the library as `unit-subunit-event-core-X.Y.Z.tgz`, overwriting any existing version. Here `X`, `Y`, `Z` indicate the semantic version specified in the `package.json` file.

Bundling is performed using [Rollup](https://rollupjs.org/) instead of [Webpack](https://webpack.js.org/) due to ease of use and growing popularity.

CSS style files are included in the built bundle using the Rollup plugin [rollup-plugin-postcss](https://github.com/egoist/rollup-plugin-postcss).

## Running the Tests

To launch the test runner:

```console
cd /path/to/unit-subunit-event-core/
npm test
```

## Architecture Details

The Mephisto framework is organized around the abstraction of a *unit* of work. This package introduces an approach that decomposes a unit into a set of *subunits*.

Users of `unit-subunit-event-core` must manually provide two pieces in order to achieve a working application:
1. Data: A JSON file that describes the content of the subunit(s).
2. UI: React component(s) that describe how the subunits are rendered.

Both of these pieces apply at the unit-level and subunit-level. This is unpacked in more detail below.

### Mephisto Data Assumptions

Before getting into details, it should be noted that `unit-subunit-event-core` leverages the `data_json` field provided my Mephisto to inject data (i.e., content) into the application. Independent of using this package, Mephisto assumes that `data_json` contains a list of JSON dictionaries, where each dictionary corresponds to a separate unit (technically a proto-unit).

Therefore, the JSON input to Mephisto will allways have the following top-level structure
```json
[
    <Unit 0 dictionary>,
    <Unit 1 dictionary>,
    ...
    <Unit N dictionary>
]
```

In this package, additional assumptions are made about the structure of unit-level dictionary, which are detailed below.

### Unit Data and UI

The unit-level dictionary should be specified using the following template:
```json
{
    "unit": {
        "meta" : {
            <optional unit-level metadata>
        },
        "data": {
            "kind": <Unit Component Name>,
            <additional unit-level data >
        },
        "subunits" : [
            <Subunit 0 dictionary>,
            <Subunit 1 dictionary>,
            ...
            <Subunit N dictionary>
        ]
    }
}
```

The `unit-subunit-event-core` currently provides one predefined option for the unit `data.kind`:
* `IndexedUnit`: Assumes that all subunit dictionaries have a contiguous [0, N - 1] `subunit_index` in their `data` field and between-subunit navigation can be handled via `subunit_index`.
* If `IndexedUnit` is insufficient for a particular use case, package users can implement their own unit-level component by mirroring the props signature and returned JSX of `IndexedUnit`.

The `meta` dictionary is used to store metadata about the unit and might include fields like "schema", "project_id", "proto_unit_id", and "nuisance_id". This should not include information that is important for rendering, but rather information that is useful for processing the collected annotations.

The `subunits` field is used to store a list of subunit dictionaries. In the context of an `IndexedUnit`, the order of subunits in the list determines the order they are shown to an annotator.

The `data` dictionary is used to store anything necessary for rendering the unit, but *not* subunit information. The `data` dictionary must include a `kind` field, which maps to the name of the unit component. In the context of an `IndexedUnit`, we can set a flag `show_unit_progress` to indicate whether we want to show annotators a progress bar at the top of the screen.

The following snippet is an example JSON for an `IndexedUnit`:

```json
{
    "unit": {
        "meta" : {
            "schema": "unit-subunit-event_v2.0",
            "project_id": "project_5.0",
            "proto_unit_id": "1234",
            "nuisance_id": "0",
            "unit_id": ""
        },
        "data": {
            "kind": "IndexedUnit",
            "show_unit_progress": true
        },
        "subunits" : [
            <Subunit 0 dictionary>,
            <Subunit 1 dictionary>,
            ...
            <Subunit N dictionary>
        ]
    }
}
```

The next section describes the structure of the subunit-level dictionary.

### Subunit Data and UI

The subunit dictionaries follow a template that is similar to the unit dictionaries:

```json
{
    "meta": {
        <optional subunit-level metadata>
    },
    "data": {
        "subunit_index": <a unique subunit-level index>,
        "kind": <Custom Subunit Component Name>,
        <additional subunit data>
    },
    "events": []
}
```

The `meta` dictionary is used to store metadata about the subunit and might include fields like "proto_subunit_id", "nuisance_id", and "subunit_id".

The `data` dictionary is used to store anything necessary for rending the subunit. The `data` dictionary must include a `subunit_index` and a `kind` field. The `subunit_index` is necessary for React to keep track of the different subunits (i.e., the component "key" used by React). The `kind` field maps to the name of the subunit component. In general, it is the responsiblity of the user to create a subunit component, see below for some examples.

The `events` list is used to store any events. The input JSON, does not require this field, but it is included here in order to make it clear where the event data is stored in the output file.

#### The Subunit Interface

Subunits are implemented as React components that adhere to a *subunit interface*. This package does not provide any data-collecting subunits out-of-the-box, instead it provides a subunit interface and some components that can be incorporated into a custom subunit (e.g., `FormQuestion`, `Rankable`). Subunits are not provided because it is challenging to implement fully-defined subunits that are application agnostic.

On the data side, the `IndexedUnit` component passes the following props to all subunits:
* `subunitInput`: This is the entire subunit dictionary object defined in the JSON input. A typical implemntation will use `subunitInput.data` to control rendering of the subunit.
* `onEvents`: An event handler to call whenever an event should be recorded (this is discussed in more detail below).
* `variant`: A optional css class name to be used for styling the `div` element surrounding the subunit. This prop can also be used to control styling of the subunit itself.

The above props effectively define a subunit interface. When implementing a custom subunit, it should accept all or some of these props. If you need to programatically access custom components inside your component, you can use the React Context `ComponentRegistryContext`, made for this purpose. This is the same Context that `UnitBase` and `SubunitBase` uses to programatically render unit and subunit components.

A React subunit component (that utilizes the component registry) has the following boilerplate structure:

```jsx
import React from "react";
import { useContext } from 'react';
import { ComponentRegistryContext } from "./ComponentRegistryContext.jsx";

export default function YourSubunit({
  subunitInput,
  onEvents,
  variant,
}) {
  const componentRegistry = useContext(ComponentRegistryContext);
  // Logic for controlling rendering and navigation.

  return (
    <>
        // Your UI component(s) JSX
    </>
  );
}
```

The corresponding subunit dictionary for this component might look like the following:

```json
{
    "meta": {
        "proto_subunit_id": "123",
        "nuisance_id": "0",
        "subunit_id": ""
    },
    "data": {
        "subunit_index": 1,
        "kind": "YourSubunit"
    },
    "events": []
}
```

### Event Data

While annotators interact with the application, key events should be recorded so that later processing can determine what happended (e.g., an annotator selected option 2 on a multiple choice question).

This package adopts the convention that events are recorded as dictionaries, with a format demonstrated by the following partial example:

```jsx
const newEvent = {
    meta: {
        // optional event-level metadata
    },
    data: {
        kind: "YourComponent.yourEvent",
        agent: "browser",
        timestamp_iso: "2024-01-17T20:55:33.277Z",
        timestamp_local: "Wed Jan 17 2024 13:55:33 GMT-0700 (Mountain Standard Time)",
        // additional event-level data
    }
}
```

When an event dictionary is created, it can be passed to `onEvents`, which will automatically append the event data to the `events` list of the appropriate subunit. The logic for the `onEvents` event handler is contained in `SubunitBase`. Note that `onEvents` takes a list of events, so single events must be still be wrapped in square brackets:

```jsx
onEvents([newEvent])
```

For convenience, a utility function `formatEvent` is included to help you format events correctly. These can be used in a custom component by including the following import statement at the top of your component file:

```jsx
import { formatEvent } from "unit-subunit-event-core";
```
