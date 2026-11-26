import { build } from 'esbuild';
import { createRequire } from 'node:module';

const bundle = await build({
    entryPoints: ['tests/v6.ts'],
    platform: 'node',
    format: 'cjs',
    bundle: true,
    write: false,
});
new Function('require', bundle.outputFiles[0].text)(createRequire(import.meta.url));
