import {build} from 'esbuild';
import {dependencyKey,outputsIntact} from './build-cache.mjs';
import {readFile,writeFile,mkdir,readdir,unlink} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {chromeBuildOptions} from './chrome-build-options.mjs';
const extras=['package.json','pnpm-lock.yaml','tsconfig.json','scripts/build-chrome.mjs','scripts/chrome-build-options.mjs','scripts/build-cache.mjs','ui/adapters/feedback.ts'];
let prior;try{prior=JSON.parse(await readFile('generated/chrome-build.json','utf8'));}catch{}
const priorKey=prior?.dependencyInputs?await dependencyKey([...prior.dependencyInputs,...extras]):null;
if(priorKey&&prior.key===priorKey&&await outputsIntact(prior.outputHashes)&&!process.argv.includes('--force')){console.log(JSON.stringify({cached:true,key:priorKey}));process.exit(0);}
await mkdir('generated',{recursive:true});
const start=performance.now();
const client=await build({entryPoints:['ui/mount-chrome.tsx'],outdir:'public/assets/chrome',entryNames:'entry-[hash]',chunkNames:'chunk-[hash]',assetNames:'asset-[hash]',bundle:true,platform:'browser',format:'esm',splitting:true,minify:true,metafile:true,...chromeBuildOptions(process.cwd())});
const server=await build({entryPoints:['ui/docs-shell-server.tsx'],outfile:'generated/docs-shell-server.cjs',bundle:true,platform:'node',format:'cjs',external:['react','react/*','react-dom','react-dom/*'],metafile:true,...chromeBuildOptions(process.cwd())});
for(const result of [client,server])if(Object.keys(result.metafile.inputs).some(file=>/node_modules\/next\//.test(file)))throw Error('Next runtime in shared UI graph');
const entry=Object.entries(client.metafile.outputs).find(([,data])=>data.entryPoint==='ui/mount-chrome.tsx')[0];
const outputHashes={};for(const file of [...Object.keys(client.metafile.outputs),'generated/docs-shell-server.cjs'])outputHashes[file]=createHash('sha256').update(await readFile(file)).digest('hex');
const live=new Set(Object.keys(client.metafile.outputs).map(file=>path.basename(file)));
for(const file of await readdir('public/assets/chrome'))if(/^(entry|chunk|asset)-[A-Z0-9]+\.(js|css|wasm)$/.test(file)&&!live.has(file))await unlink('public/assets/chrome/'+file);
const dependencyInputs=[...new Set([...Object.keys(client.metafile.inputs),...Object.keys(server.metafile.inputs)])];const key=await dependencyKey([...dependencyInputs,...extras]);const serverKey=await dependencyKey([...Object.keys(server.metafile.inputs),...extras]);
const report={key,serverKey,dependencyInputs,entry,outputHashes,client:client.metafile,server:server.metafile,build_ms:performance.now()-start,clientBytes:Object.values(client.metafile.outputs).reduce((n,data)=>n+data.bytes,0)};
await writeFile('generated/chrome-build.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({key,entry,clientBytes:report.clientBytes,build_ms:report.build_ms}));
