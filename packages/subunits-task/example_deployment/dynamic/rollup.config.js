import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import del from 'rollup-plugin-delete';
import json from '@rollup/plugin-json';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import pkg from './package.json';
import postcss from 'rollup-plugin-postcss'

export default {
    input: pkg.source,
    output: [
        { file: "build/bundle.js", format: "es" },
    ],
    plugins: [
        peerDepsExternal(),
        babel({
            exclude: 'node_modules/**',
            babelHelpers: 'bundled'
        }),
        commonjs({
            include: /node_modules/,
        }),
        del({ targets: ['dist/*'] }),
        postcss({
            plugins: []
        }),
        nodePolyfills(),
        nodeResolve(),
        json(),
    ],
    onwarn(warning, handler) {
        // Added this because of the following issue:
        // "use client"; in node_modules/react-bootstrap/esm/FormContext.js (1:0)
        // (!) Module level directives cause errors when bundled, 'use client' was ignored.
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
            return;
        }
        warn(warning);
    }
};