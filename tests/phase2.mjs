// Retain the existing simulation regression entry point after the roster migration.
import {build} from 'esbuild';
const bundle=await build({entryPoints:['tests/v4.ts'],platform:'node',format:'esm',bundle:true,write:false});
await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
