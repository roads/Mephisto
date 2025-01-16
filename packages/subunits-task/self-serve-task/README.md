# self-serve-task

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

## Description

A React component library that provides a simple, static frontend that allows annotators to self-serve annotation tasks. The primary use case is demoing and team-fooding.

## Getting Started

The package is not currently available on npm and must be installed by downloading the repository and installing the package in the host application using the following terminal commands:

```console
cd /path/to/host/webapp/
npm install /path/to/self-serve-task/self-serve-task-1.4.0.tgz --save
```

Alternatively, you can add the package as a dependency in your host application's `package.json` file and then run the terminal command `npm install`. For example:

```json
"dependencies": {
    "self-serve-task": "file:../packages/self-serve-task/self-serve-task-1.4.0.tgz"
  },
```

### Manual Build and Package

If you would like to rebuild the latest version of the package, you can do so using the following terminal commands:

```console
cd /path/to/self-serve-task/
npm run build
npm pack
```

These commands do the following:
1) Build the component library and places it in the `dist` folder, overwriting any existing version.
2) Package up the library as `self-serve-task-X.Y.Z.tgz`, overwriting any existing version. Here `X`, `Y`, `Z` indicate the semantic version specified in the `package.json` file.

Bundling is performed using [Rollup](https://rollupjs.org/) instead of [Webpack](https://webpack.js.org/) due to ease of use and growing popularity.

CSS style files are included in the built bundle using the Rollup plugin [rollup-plugin-postcss](https://github.com/egoist/rollup-plugin-postcss).

### Architecture

The static task JSON is assumed to have a top-level structure that is a list, where each item in the list is a separate unit of work that the annotator can select from on the landing page:

```json
[
    <Unit 0>,
    <Unit 1>,
    ...
    <Unit N>
]
```

For example, if you implemented a custom unit frontend `MyUnitFrontend` along with a static task file `my_tasks.json` your application could use `self-serve-task` in the following way:
```jsx
// File app.jsx
import React from "react";
import { createRoot } from "react-dom/client";

import { SelfServeLanding, useSelfServeTask } from "self-serve-task";

// Replace this imaginary component with your real front-end component.
import MyUnitFrontend from "./components.MyUnitFrontend.jsx";

// Replace this imaginary JSON file with your real JSON file.
import tasks from './my_tasks.json';

const container = document.getElementById('app');
const root = createRoot(container);

function MainApp() {
    const {
        isLanding,  // A boolean indicating if the UI should display the landing page.
        optionList, // JSX list elements, with one element per unit in your task file.  
        taskData,  // A single task/unit taken from the provided `my_tasks.json` file.
        handleLandingSubmit, // An event handler for the submit button on the landing page.
        handleTaskSubmit, // An event handler that your frontend unit should call when the unit is complete.
    } = useSelfServeTask(tasks);

    if (isLanding) {
        return (
            <SelfServeLanding
                optionList={optionList}
                onSubmit={handleLandingSubmit}
            />
        );
    }

    return (
        <MyUnitFrontend
            taskData={taskData}
            onSubmit={handleTaskSubmit}
        />
    );
}

root.render(<MainApp />);
```