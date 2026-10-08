import {availableParallelism} from 'node:os';import {spawn} from 'node:child_process';
import './frozen-image-inputs.mjs';
import {dependencyKey} from './build-cache.mjs';
import {build} from 'esbuild';
import {compile,run,createProcessor} from '@mdx-js/mdx';
import {applyMdxPreset} from 'fumadocs-mdx/config';
import React from 'react';
import {renderToString} from 'react-dom/server';
import * as runtime from 'react/jsx-runtime';
import matter from 'gray-matter';
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import path from 'node:path';
function titleTree(node){
 if(node===null||node===undefined||typeof node==='boolean')return null;
 if(typeof node==='string'||typeof node==='number')return node;
 if(Array.isArray(node))return node.map(titleTree);
 if(React.isValidElement(node)){
  const type=node.type===React.Fragment?'fragment':node.type;
  if(typeof type!=='string')throw Error('Unregistered TOC title component');
  return {type,children:titleTree(node.props.children)};
 }
 throw Error('Unsupported TOC title value');
}
const workerIndex=process.argv.includes('--worker')?Number(process.argv[process.argv.indexOf('--worker')+1]):null;const root=process.cwd();
const profileEnabled=Boolean(process.env.AI_SDK_PROFILE);
const profile={initialization_ms:0,frontmatter_ms:0,parse_ms:0,transforms_ms:0,stringify_ms:0,evaluate_ms:0,react_render_ms:0,io_hash_ms:0,plugins:{},families:{}};
const profileStart=performance.now();
function timedPlugins(entries,stage){return entries.map((entry,index)=>{
 const [plugin,...args]=Array.isArray(entry)?entry:[entry];const label=stage+':'+(plugin.name||'anonymous')+':'+index;
 function measured(...options){const begin=performance.now();const transformer=plugin.apply(this,options);profile.initialization_ms+=performance.now()-begin;
  if(typeof transformer!=='function')return transformer;
  return function(tree,file){const start=performance.now();let result;try{result=transformer.call(this,tree,file);}catch(error){profile.plugins[label]=(profile.plugins[label]||0)+performance.now()-start;throw error;}
   if(result&&typeof result.then==='function')return result.finally(()=>{profile.plugins[label]=(profile.plugins[label]||0)+performance.now()-start;});
   profile.plugins[label]=(profile.plugins[label]||0)+performance.now()-start;return result;
  };
 }
 return [measured,...args];
});}
async function profiledCompile(input,options){
 const {VFile}=await import(createRequire(import.meta.resolve('@mdx-js/mdx')).resolve('vfile'));
 const file=new VFile(input);const processor=createProcessor({...options,format:'mdx'});let start=performance.now();const tree=processor.parse(file);profile.parse_ms+=performance.now()-start;
 start=performance.now();const transformed=await processor.run(tree,file);profile.transforms_ms+=performance.now()-start;
 start=performance.now();file.value=processor.stringify(transformed,file);profile.stringify_ms+=performance.now()-start;return file;
}
await mkdir('generated',{recursive:true});
let rendererBuild;if(workerIndex!==null)rendererBuild=JSON.parse(await readFile('generated/renderer-build.json','utf8'));else rendererBuild=await build({entryPoints:['ui/renderer-entry.tsx'],outfile:'generated/renderer.cjs',bundle:true,platform:'node',format:'cjs',external:['react','react/*','react-dom','react-dom/*','next/*'],alias:{'next/link':path.join(root,'ui/adapters/link.tsx'),'next/navigation':path.join(root,'ui/adapters/navigation.ts'),'next/image':path.join(root,'ui/adapters/image.tsx')},metafile:true});
const require=createRequire(import.meta.url);
if(workerIndex===null)await writeFile('generated/renderer-build.json',JSON.stringify(rendererBuild.metafile)+'\n');else rendererBuild={metafile:rendererBuild};
let configBuild;if(workerIndex!==null)configBuild={metafile:JSON.parse(await readFile('generated/mdx-config-build.json','utf8'))};else{configBuild=await build({entryPoints:['ui/source.config.ts'],outfile:'generated/mdx-config.cjs',bundle:true,platform:'node',format:'cjs',external:['react','react/*'],metafile:true});await writeFile('generated/mdx-config-build.json',JSON.stringify(configBuild.metafile)+'\n');}
const config=require(path.join(root,'generated/mdx-config.cjs')).default;const {versionedComponents}=require(path.join(root,'generated/renderer.cjs'));
const opts=await applyMdxPreset(config.mdxOptions)('runtime');
// Same MDAST serialization boundary as pinned Fumadocs processed Markdown.
// Capture transformed Markdown without a second parse or an HTML round trip.
const {toMarkdown}=createRequire(import.meta.resolve('fumadocs-mdx'))('mdast-util-to-markdown');
function captureProcessedMarkdown(){const processor=this;return(tree,file)=>{file.data.processedMarkdown=toMarkdown(tree,{...processor.data('settings'),extensions:processor.data('toMarkdownExtensions')||[]});};}
opts.remarkPlugins=[...opts.remarkPlugins,captureProcessedMarkdown];
// Public Shiki cache boundary, scoped to this renderer/configuration. Cloning
// avoids later HAST/recma transforms mutating a cached fragment. Bound memory.
const highlightingSeen=new Set();const highlightingCache=new Map();let highlightingBytes=0;const highlightingStats={hits:0,misses:0,evictions:0,maxBytes:64*1024*1024};
const shikiCache={get(key){const entry=highlightingCache.get(key);if(!entry){highlightingStats.misses++;return;}highlightingStats.hits++;highlightingCache.delete(key);highlightingCache.set(key,entry);return JSON.parse(entry);},set(key,value){if(!highlightingSeen.has(key)){highlightingSeen.add(key);return;}const entry=JSON.stringify(value),bytes=Buffer.byteLength(entry);if(bytes>highlightingStats.maxBytes)return;while(highlightingBytes+bytes>highlightingStats.maxBytes&&highlightingCache.size){const oldest=highlightingCache.keys().next().value;highlightingBytes-=Buffer.byteLength(highlightingCache.get(oldest));highlightingCache.delete(oldest);highlightingStats.evictions++;}highlightingCache.set(key,entry);highlightingBytes+=bytes;}};
opts.rehypePlugins=opts.rehypePlugins.map(entry=>{const [plugin,...args]=Array.isArray(entry)?entry:[entry];return plugin.name==='rehypeCode'?[plugin,{...args[0],cache:shikiCache},...args.slice(1)]:entry;});
if(profileEnabled){opts.remarkPlugins=timedPlugins(opts.remarkPlugins,'remark');opts.rehypePlugins=timedPlugins(opts.rehypePlugins,'rehype');}
const allContent=process.argv.includes('--all-content');
const allDocs=allContent||process.argv.includes('--all-docs');
const corpus=allDocs||process.argv.includes('--current-docs');
const sourceRoot=corpus?'generated/synced':'sources';
const provenance=JSON.parse(await readFile(allContent?'generated/content-source-map.json':allDocs?'generated/docs-source-map.json':corpus?'generated/current-docs-source-map.json':'investigation/A3-SOURCE-PROVENANCE.json','utf8'));
if(workerIndex!==null)provenance.fixtures=JSON.parse(await readFile('generated/mdx-worker-fixtures-'+workerIndex+'.json','utf8'));
const cachePath=allContent?'generated/content-mdx-cache.json':allDocs?'generated/docs-mdx-cache.json':corpus?'generated/current-docs-mdx-cache.json':'generated/mdx-cache.json';
const results=[];
let cache={};try{cache=JSON.parse(await readFile(cachePath,'utf8'));}catch{}if(workerIndex!==null)cache=Object.fromEntries(Object.entries(cache).filter(([file])=>provenance.fixtures.includes(file)));
const compilerInputs=[...Object.keys(configBuild.metafile.inputs),'package.json','pnpm-lock.yaml','tsconfig.json','scripts/render-proof.mjs','scripts/build-cache.mjs','scripts/frozen-image-inputs.mjs'];
for(const entry of await readdir('maintained-assets/remote-images'))compilerInputs.push('maintained-assets/remote-images/'+entry);
const compilerKey=await dependencyKey(compilerInputs);const rendererKey=await dependencyKey([...Object.keys(rendererBuild.metafile.inputs),'scripts/render-proof.mjs','scripts/build-cache.mjs','package.json','pnpm-lock.yaml']);
function transformSignature(content,file){const pathSensitive=/^\s*(?:import|export)\s+.*["'][.]|!\[[^\]]*\]\(\/(?!\/)/m.test(content);return createHash('sha256').update(content).update(pathSensitive?file:'').digest('hex');}
// Inventory cheap source signatures first; retain only bodies reused later.
let dirty=0;const remainingBodies=new Map();const buckets=Array.from({length:Math.max(1,Math.min(4,Number(process.env.AI_SDK_RENDER_WORKERS)||availableParallelism()))},()=>[]);for(const file of provenance.fixtures){const text=await readFile((corpus||file.includes('/docs/')?'generated/synced':sourceRoot)+'/'+file,'utf8');const key=transformSignature(matter(text).content,file);remainingBodies.set(key,(remainingBodies.get(key)||0)+1);const contentKey=createHash('sha256').update(compilerKey).update(rendererKey).update(text).digest('hex');if(cache[file]?.key!==contentKey)dirty++;buckets[parseInt(key.slice(0,8),16)%buckets.length].push(file);}
if(workerIndex===null&&buckets.length>1&&(process.argv.includes('--force')||dirty>64)){
 const active=buckets.map((files,index)=>({files,index})).filter(x=>x.files.length);for(const {files,index}of active)await writeFile('generated/mdx-worker-fixtures-'+index+'.json',JSON.stringify(files));
 await Promise.all(active.map(({index})=>new Promise((resolve,reject)=>{const child=spawn(process.execPath,[...process.argv.slice(1),'--worker',String(index)],{stdio:'inherit',env:process.env});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error('MDX worker '+index+' failed: '+code)));})));
 const merged=new Map();let mergedCache={},workMetrics=[];for(const {index}of active){for(const row of JSON.parse(await readFile('generated/mdx-worker-results-'+index+'.json','utf8')))merged.set(row.file,row);Object.assign(mergedCache,JSON.parse(await readFile(cachePath+'.worker-'+index,'utf8')));workMetrics.push(JSON.parse(await readFile('generated/mdx-work-metrics-worker-'+index+'.json','utf8')));}
 const ordered=provenance.fixtures.map(file=>merged.get(file));if(ordered.some(row=>!row))throw Error('Missing MDX worker result');await writeFile(cachePath,JSON.stringify(mergedCache,null,2)+'\n');await writeFile(workerIndex!==null?'generated/mdx-worker-results-'+workerIndex+'.json':allContent?'generated/content-render-results.json':allDocs?'generated/docs-render-results.json':corpus?'generated/current-docs-render-results.json':'generated/a3-render-results.json',JSON.stringify(ordered,null,2)+'\n');
 const metrics={workers:active.length,pages:ordered.length,cached:ordered.filter(x=>x.cached).length,compileReuse:workMetrics.reduce((n,x)=>n+x.compileReuse,0),diskCompileReuse:workMetrics.reduce((n,x)=>n+x.diskCompileReuse,0),workerMetrics:workMetrics};await writeFile('generated/mdx-work-metrics.json',JSON.stringify(metrics,null,2)+'\n');
 if(profileEnabled){const profiles=[];for(const {index}of active)profiles.push(JSON.parse(await readFile(process.env.AI_SDK_PROFILE+'.worker-'+index,'utf8')));const combined={wall_ms:performance.now()-profileStart,workers:active.length,summed_worker_ms:profiles.reduce((n,x)=>n+x.total_ms,0),plugins:{},families:{},methodology:'Worker phase/plugin/family counters sum elapsed task time across concurrent workers and must not be added to wall time. Plugin counters remain nested within transforms. Whole-stage GNU time reports maximum process/phase RSS, not concurrent aggregate memory.'};for(const field of ['initialization_ms','frontmatter_ms','parse_ms','transforms_ms','stringify_ms','evaluate_ms','react_render_ms'])combined[field]=profiles.reduce((n,x)=>n+x[field],0);for(const report of profiles){for(const [key,value]of Object.entries(report.plugins))combined.plugins[key]=(combined.plugins[key]||0)+value;for(const [key,value]of Object.entries(report.families)){const entry=combined.families[key]??={pages:0,compile_ms:0,render_ms:0,cached:0};for(const field of Object.keys(entry))entry[field]+=value[field];}}await writeFile(process.env.AI_SDK_PROFILE,JSON.stringify(combined,null,2)+'\n');}
 console.log(JSON.stringify({workers:active.length,pages:ordered.length,dirty,compileReuse:metrics.compileReuse}));process.exit(0);
}
const processor=createProcessor({...opts,format:'mdx',outputFormat:'function-body'});const transformedBodies=new Map();let compileReuse=0,diskCompileReuse=0;
for(const file of provenance.fixtures){
 const begin=performance.now();
 const inputRoot=corpus||file.includes('/docs/')?'generated/synced':sourceRoot;
 const source=await readFile(inputRoot+'/'+file,'utf8');
 const target='generated/'+file.replace(/\.mdx$/,'.html');
 const key=createHash('sha256').update(compilerKey).update(rendererKey).update(source).digest('hex');
 if(cache[file]?.key===key&&!process.argv.includes('--force')){
   try{const html=await readFile(target);if(createHash('sha256').update(html).digest('hex')===cache[file].outputHash){results.push({...cache[file].result,cached:true,compile_ms:0,render_ms:0});continue;}}catch{}
 }
 const fmBegin=performance.now();const fm=matter(source);if(profileEnabled)profile.frontmatter_ms+=performance.now()-fmBegin;
 const transformKey=transformSignature(fm.content,file);
 let output=transformedBodies.get(transformKey);
 if(output)compileReuse++;
 else {
  const artifact='generated/compiled-mdx/'+compilerKey+'-'+transformKey+'.json';let stored;
  if(!process.argv.includes('--force'))try{const value=JSON.parse(await readFile(artifact,'utf8'));if(value.hash===createHash('sha256').update(value.code).update(value.markdown).digest('hex'))stored=value;}catch{}
  if(stored){output={value:stored.code,data:{processedMarkdown:stored.markdown},toString(){return this.value;}};diskCompileReuse++;}
  else{output=await (profileEnabled?profiledCompile:((input)=>processor.process(input)))({value:fm.content,path:path.resolve(inputRoot+'/'+file)},{...opts,outputFormat:'function-body'});const code=String(output),markdown=output.data.processedMarkdown;await mkdir(path.dirname(artifact),{recursive:true});const value=JSON.stringify({code,markdown,hash:createHash('sha256').update(code).update(markdown).digest('hex')});let previous;try{previous=await readFile(artifact,'utf8');}catch{}if(previous!==value)await writeFile(artifact,value);}
  if(remainingBodies.get(transformKey)>1)transformedBodies.set(transformKey,output);
 }
 remainingBodies.set(transformKey,remainingBodies.get(transformKey)-1);if(remainingBodies.get(transformKey)===0)transformedBodies.delete(transformKey);
 const compiled=performance.now();
 const evaluateBegin=performance.now();const mdx=await run(output,{...runtime,baseUrl:import.meta.url});if(profileEnabled)profile.evaluate_ms+=performance.now()-evaluateBegin;
 const prefix=file.startsWith('v7/')?'':'/'+file.split('/')[0];
 const reactBegin=performance.now();const html=renderToString(React.createElement(mdx.default,{components:versionedComponents(prefix)}));
 if(profileEnabled)profile.react_render_ms+=performance.now()-reactBegin;
 await mkdir(path.dirname(target),{recursive:true});let old;try{old=await readFile(target,'utf8');}catch{}if(old!==html)await writeFile(target,html);
 const result={file,processedMarkdown:output.data.processedMarkdown,structuredData:mdx.structuredData,metadata:fm.data,toc:(mdx.toc??[]).map(({depth,url,title})=>({depth,url,title:titleTree(title)})),bytes:Buffer.byteLength(html),compile_ms:compiled-begin,render_ms:performance.now()-compiled};results.push(result);
 cache[file]={key,outputHash:createHash('sha256').update(html).digest('hex'),result};
}
await writeFile(workerIndex===null?cachePath:cachePath+'.worker-'+workerIndex,JSON.stringify(cache,null,2)+'\n');
await writeFile(workerIndex!==null?'generated/mdx-worker-results-'+workerIndex+'.json':allContent?'generated/content-render-results.json':allDocs?'generated/docs-render-results.json':corpus?'generated/current-docs-render-results.json':'generated/a3-render-results.json',JSON.stringify(results,null,2)+'\n');
if(profileEnabled){for(const row of results){const family=row.file.split('/').slice(0,2).join('/');const group=profile.families[family]??={pages:0,compile_ms:0,render_ms:0,cached:0};group.pages++;group.compile_ms+=row.compile_ms;group.render_ms+=row.render_ms;group.cached+=Number(row.cached||false);}profile.total_ms=performance.now()-profileStart;profile.methodology='parse_ms includes synchronous plugin attachment initialization; plugins are nested within transforms_ms, never added to it; family totals overlap compile/render counters. Residual includes bundling, hashing, IO, cache/report serialization and startup.';await writeFile(process.env.AI_SDK_PROFILE+(workerIndex===null?'':'.worker-'+workerIndex),JSON.stringify(profile,null,2)+'\n');}
await writeFile(workerIndex===null?'generated/mdx-work-metrics.json':'generated/mdx-work-metrics-worker-'+workerIndex+'.json',JSON.stringify({pages:results.length,cached:results.filter(x=>x.cached).length,compiled:results.filter(x=>!x.cached).length,compileReuse,diskCompileReuse,highlightingStats,highlightingBytes},null,2)+'\n');
console.log(JSON.stringify({pages:results.length,cached:results.filter(x=>x.cached).length,compileReuse,diskCompileReuse,highlightingStats}));
