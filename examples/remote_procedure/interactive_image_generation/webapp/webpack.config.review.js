/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var path = require("path");
var webpack = require("webpack");

module.exports = {
  entry: "./src/review.ts",
  output: {
    path: __dirname,
    filename: "build/bundle.review.js",
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx"],
    alias: {
      react: path.resolve("./node_modules/react"),
      "mephisto-core": path.resolve(
        __dirname,
        "../../../../packages/mephisto-core"
      ),
      "mephisto-addons": path.resolve(
        __dirname,
        "../../../../packages/mephisto-addons"
      ),
      // Required for custom validators
      "custom-validators": path.resolve(
        process.env.WEBAPP__GENERATOR__CUSTOM_VALIDATORS
      ),
      // Required for custom triggers
      "custom-triggers": path.resolve(
        process.env.WEBAPP__GENERATOR__CUSTOM_TRIGGERS
      ),
    },
    fallback: {
      net: false,
      dns: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.ts(x?)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
          },
        ],
      },
      {
        test: /\.(js|jsx)$/,
        loader: "babel-loader",
        exclude: /node_modules/,
        options: { presets: ["@babel/env"] },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(svg|png|jpe?g|ttf)$/,
        loader: "url-loader",
        options: { limit: 100000 },
      },
      {
        test: /\.jpg$/,
        loader: "file-loader",
      },
    ],
  },
  plugins: [new webpack.EnvironmentPlugin({ ...process.env })],
};
