// see https://remarkablemark.org/blog/2019/07/12/rollup-commonjs-umd/

import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser'

export default {
  input: './src/svelte-drag-and-drop-action.ts',
  output: {
    file:     './dist/svelte-drag-and-drop-action.esm.js',
    format:   'esm',
    sourcemap:true
  },
  plugins: [typescript(), terser({ format:{ comments:false, safari10:true } })],
};