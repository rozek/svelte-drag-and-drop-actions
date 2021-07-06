// see https://github.com/rozek/build-configuration-study

import commonjs   from '@rollup/plugin-commonjs'
import resolve    from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser'

export default {
  input:   './src/svelte-drag-and-drop-actions.ts',
  external:['javascript-interface-library','svelte-coordinate-conversion'],
  output: [
    {
      file:     './dist/svelte-drag-and-drop-actions.js',
      format:    'umd', // builds for both Node.js and Browser
      name:      'DragAndDropActions', // required for UMD modules
      globals: {
        'javascript-interface-library':'JIL',
        'svelte-coordinate-conversion':'Conversion'
      },
      noConflict:true,
      sourcemap: true,
      plugins:   [terser({ format:{ comments:false, safari10:true } })],
    },{
      file:     './dist/svelte-drag-and-drop-actions.esm.js',
      format:   'esm',
      sourcemap:true
    }
  ],
  plugins: [
    resolve({ browser:true, dedupe:['svelte'] }), commonjs(), typescript(),
  ],
};