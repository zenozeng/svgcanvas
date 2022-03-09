import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default [
    {
        input: 'index.js',
        output: {
            file: 'dist/svgcanvas.js',
            format: 'cjs'
        }
    },
    {
        input: 'index.js',
        output: {
            file: 'dist/svgcanvas.esm.js',
            format: 'esm'
        }
    },
    {
        input: 'test/index.js',
        output: {
            file: 'dist/test.js',
            format: 'iife'
        }
    },
    {
        input: 'test/rendering.test.js',
        output: {
            file: 'dist/rendering.test.js',
            format: 'iife',
            sourcemap: true,
        },
        plugins: [nodeResolve(), commonjs()]
    },
]