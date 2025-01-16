import babel from "@rollup/plugin-babel";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import del from "rollup-plugin-delete";
import pkg from "./package.json";
import postcss from "rollup-plugin-postcss";
import image from "@rollup/plugin-image";
import replace from "@rollup/plugin-replace";

export default {
  input: pkg.source,
  output: [
    { file: pkg.main, format: "cjs" },
    { file: pkg.module, format: "esm" },
  ],
  plugins: [
    replace({
      values: {
        "process.env.NODE_ENV": JSON.stringify("production"),
      },
      preventAssignment: true,
    }),
    peerDepsExternal(),
    babel({
      exclude: "node_modules/**",
      babelHelpers: "bundled",
    }),
    del({ targets: ["dist/*"] }),
    postcss({
      plugins: [],
    }),
    image(),
  ],
  external: [
    "react",
    "react-dom",
    /react-bootstrap\/.*/,
    "bootstrap/dist/css/bootstrap.min.css",
    "react-bootstrap-range-slider",
    "motion/react",
  ],
};
