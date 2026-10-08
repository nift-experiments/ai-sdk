// One explicit pinned Fumadocs binding restores its exported search database.
// Public server APIs export databases but currently do not expose this reader.
import {build} from 'esbuild';import {createRequire} from 'node:module';import path from 'node:path';import {writeFile} from 'node:fs/promises';
const server=import.meta.resolve('fumadocs-core/search/server'),require=createRequire(server);
const result=await build({entryPoints:['ui/runtime-api.ts'],outfile:'runtime/runtime-api.cjs',bundle:true,platform:'node',format:'cjs',external:['@vercel/og','react','react/*'],metafile:true,alias:{'@migration/search-advanced':new URL('../chunk-XOFXGHS4.js',server).pathname,'@orama/orama':require.resolve('@orama/orama'),'ai':createRequire(import.meta.resolve('@vercel/geistdocs/config')).resolve('ai').replace(/index\.js$/,'index.mjs')}});
if(Object.keys(result.metafile.inputs).some(file=>/node_modules\/next\//.test(file)))throw Error('Unexpected framework runtime');
await writeFile('generated/runtime-build.json',JSON.stringify({inputs:Object.keys(result.metafile.inputs),outputs:result.metafile.outputs},null,2)+'\n');console.log(JSON.stringify({runtimeBytes:Object.values(result.metafile.outputs).reduce((n,x)=>n+x.bytes,0)}));
