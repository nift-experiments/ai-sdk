import {build} from 'esbuild';
import {readFile,readdir,mkdir,writeFile,unlink} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=process.cwd();
const files=[];
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const f=path.join(dir,entry.name);if(entry.isDirectory())await walk(f);else files.push(f);}}
await walk('ui');files.push('package.json','pnpm-lock.yaml','tsconfig.json','scripts/build-islands.mjs');files.sort();
const digest=createHash('sha256');for(const file of files){digest.update(file);digest.update(await readFile(file));}const key=digest.digest('hex');
await mkdir('generated',{recursive:true});
let prior;try{prior=JSON.parse(await readFile('generated/islands-build.json','utf8'));}catch{}
if(prior?.key===key && !process.argv.includes('--force')){console.log(JSON.stringify({cached:true,...prior}));process.exit(0);}
const start=performance.now();
const result=await build({entryPoints:['ui/mount-islands.tsx'],outdir:'public/assets/islands',entryNames:'entry-[hash]',chunkNames:'chunk-[hash]',assetNames:'asset-[hash]',bundle:true,platform:'browser',format:'esm',splitting:true,minify:true,metafile:true,alias:{'next/link':path.join(root,'ui/adapters/link.tsx'),'next/navigation':path.join(root,'ui/adapters/navigation.ts'),'next/image':path.join(root,'ui/adapters/image.tsx')}});
const entry=Object.entries(result.metafile.outputs).find(([,o])=>o.entryPoint==='ui/mount-islands.tsx')[0];
const report={key,entry,build_ms:performance.now()-start,bytes:Object.values(result.metafile.outputs).reduce((sum,x)=>sum+x.bytes,0),outputs:result.metafile.outputs,inputs:Object.keys(result.metafile.inputs)};
if(report.inputs.some(x=>/node_modules\/next\//.test(x)))throw new Error('Unexpected Next runtime in island graph');
// This directory is exclusively owned by this compiler. Retire only its
// content-addressed artifacts, never maintained static publication assets.
const live=new Set(Object.keys(report.outputs).map(x=>path.basename(x)));
for(const file of await readdir('public/assets/islands')){
  if(/^(entry|chunk|asset)-[A-Z0-9]+\.(js|css|wasm)$/.test(file)&&!live.has(file))await unlink('public/assets/islands/'+file);
}
await writeFile('generated/islands-build.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({key,entry,build_ms:report.build_ms,bytes:report.bytes,outputs:Object.keys(report.outputs).length}));
