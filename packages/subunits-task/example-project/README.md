# Example Project

## Deployment

Tasks can be deployed in three ways:

* `deploy-self-serve-dynamic`: Build dynamic webfiles and use a local sever to host. Annotators must self-select an appropriate assignment and upload their downloaded annotation data to a designated location.
* `deploy-deploy-self-serve-static`: Build and place static webfiles on a server. Annotators must self-select an appropriate assignment and upload their downloaded annotation data to a designated location.
* `deploy-mephisto`: Deploy the web app to a third-party provider like AMT or Prolific. In this case, assignments are automatically assigned and annotation data is automatically stored in a Mephisto-managed database.

All deployment strategies use node package manager (npm).

## Deployment Strategy for Static Hosting (deploy-self-serve-static)

### Description.

Builds static files of application in such a manner that they can be placed on a server that only hosts static files.

### Getting Started

If running setting up the npm package for the first time, install and build the webfiles:
```console
cd path/to/deployment/deploy-self-serve-static
npm install
npm run build
```

If updating the npm package (e.g., if `proj8` dependency needs to be updated to a new version), first make sure `package.json` specifies the appropriate package version, then run:

```console
cd path/to/deployment/deploy-self-serve-static
npm update
npm run build
```

Once built, the necessary files (i.e., `build/index.html` and `build/bundle.js`) can be moved to the approriate location on the static server.

### Local Hosting

If desired, the developer can also use the `http-server` package to quickly test using a local server, please see npm package `deploy-self-serve-dynamic` for details.

### Notes

The `rollup.config` file is carefully crafted to be compatible with servers that only host static files. A few things worth noting:
 
* No packages are marked as external.
* Under normal circumstances the `rollup.config.js` should be set so that the built `bundle.js` uses `format: "es"` and the corresponding import looks like `<script type="module" src="./bundle.js" defer></script>`. However this configuration does not work with static-only servers. Instead, one must build `bundle.js` using `format: "iife"` and in `index.html` import like `<script type="text/javascript" src="./bundle.js" defer></script>`.

## Deployment Strategy for Hosting Self-serve Locally (deploy-self-serve-dynamic)

### Description
Uses lightweight `http-server` npm package to host static web application locally. Developer is responsible for configuring the local server appropriately.

### Getting started

To install and build the webfiles, run
```console
cd path/to/deployment/deploy-self-serve-dynamic
npm install
npm run build
```

To start the server, run
```console
npm start
```