import {availableParallelism} from 'node:os';import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';import {dependencyKey,outputsIntact} from './build-cache.mjs';
import {compile} from '@mdx-js/mdx';import {applyMdxPreset} from 'fumadocs-mdx/config';
// Human authored-source projection stage. Not copied into the HTML-source repo.
import {build} from 'esbuild';import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';import path from 'node:path';import {createRequire} from 'node:module';
import {createSource} from '@vercel/geistdocs/source';import matter from 'gray-matter';
const projectionStart=performance.now();const workerIndex=process.argv.includes('--worker')?Number(process.argv[process.argv.indexOf('--worker')+1]):null;const root=process.cwd();let projectionBuild;if(workerIndex!==null)projectionBuild={metafile:JSON.parse(await readFile('generated/projection-config-build.json','utf8'))};else projectionBuild=await build({entryPoints:['ui/projection-config.ts'],outfile:'generated/projection-config.cjs',bundle:true,platform:'node',format:'cjs',external:['react','react/*'],metafile:true});
if(workerIndex===null)await writeFile('generated/projection-config-build.json',JSON.stringify(projectionBuild.metafile)+'\n');
const {config,resolveModelPlaceholders,prefixVersionedMarkdownLinks}=createRequire(import.meta.url)(path.join(root,'generated/projection-config.cjs'));
const projectionKey=await dependencyKey([...Object.keys(projectionBuild.metafile.inputs),'package.json','pnpm-lock.yaml','scripts/prepare-projections.mjs','scripts/build-cache.mjs','ui/source.config.ts','ui/lib/geistdocs/code-templates.mjs']);
let cache={};try{cache=JSON.parse(await readFile('generated/projection-cache.json','utf8'));}catch{}const force=process.argv.includes('--force');let converted=0,cached=0;
const sourceOrder=JSON.parse(await readFile('routes/source-order.json','utf8'));
let ownedGroups;if(workerIndex!==null)ownedGroups=JSON.parse(await readFile('generated/projection-worker-groups-'+workerIndex+'.json','utf8'));
const resultRows=JSON.parse(await readFile('generated/content-render-results.json','utf8')).filter(row=>!ownedGroups||ownedGroups.includes(row.file.split('/').slice(0,2).join('/')));const results=new Map(resultRows.map(row=>[row.file,row]));const pages=[];let dirty=0;
for(const result of resultRows){result.projectionSourceKey=createHash('sha256').update(projectionKey).update(JSON.stringify({metadata:result.metadata,markdown:result.processedMarkdown})).digest('hex');if(cache['source:'+result.file]!==result.projectionSourceKey)dirty++;}
if(workerIndex===null&&Math.min(4,availableParallelism())>1&&(force||dirty>64)){
 const weights=new Map();for(const row of resultRows){const group=row.file.split('/').slice(0,2).join('/');weights.set(group,(weights.get(group)||0)+row.processedMarkdown.length);}
 const buckets=Array.from({length:Math.max(1,Math.min(4,Number(process.env.AI_SDK_RENDER_WORKERS)||availableParallelism()))},()=>({groups:[],weight:0}));for(const [group,weight]of [...weights].sort((a,b)=>b[1]-a[1])){const target=buckets.reduce((best,value)=>value.weight<best.weight?value:best);target.groups.push(group);target.weight+=weight;}
 const active=buckets.map((bucket,index)=>({...bucket,index})).filter(x=>x.groups.length);for(const {groups,index}of active)await writeFile('generated/projection-worker-groups-'+index+'.json',JSON.stringify(groups));
 await Promise.all(active.map(({index})=>new Promise((resolve,reject)=>{const child=spawn(process.execPath,[...process.argv.slice(1),'--worker',String(index)],{stdio:'inherit'});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error('Projection worker '+index+' failed: '+code)));})));
 const parts=[];let combinedCache={};for(const {index}of active){parts.push(...JSON.parse(await readFile('generated/projection-pages-worker-'+index+'.json','utf8')));Object.assign(combinedCache,JSON.parse(await readFile('generated/projection-cache-worker-'+index+'.json','utf8')));}
 const ordered=[];for(const version of ['v7','v6','v5'])for(const family of ['docs','providers','cookbook'])ordered.push(...parts.filter(row=>row.version===version&&row.family===family));if(ordered.length!==resultRows.length)throw Error('Projection worker coverage mismatch');await writeFile('generated/projection-pages.json',JSON.stringify(ordered,null,2)+'\n');await writeFile('generated/projection-cache.json',JSON.stringify(combinedCache)+'\n');await writeFile('generated/projection-work-metrics.json',JSON.stringify({workers:active.length,pages:ordered.length,dirty,wall_ms:performance.now()-projectionStart},null,2)+'\n');console.log(JSON.stringify({markdownProjections:ordered.length,workers:active.length,dirty}));process.exit(0);
}
if(ownedGroups){const prefixes=ownedGroups.map(group=>{const [version,family]=group.split('/');return(version==='v7'?'':'/'+version)+'/'+family;});cache=Object.fromEntries(Object.entries(cache).filter(([key])=>key.startsWith('source:')?ownedGroups.some(group=>key.slice(7).startsWith(group+'/')):key.startsWith('image:')?ownedGroups.some(group=>key.slice(6).startsWith(group+'/')):prefixes.some(prefix=>key===prefix||key.startsWith(prefix+'/'))));}

// Imported-image Markdown retains the bundler's explicit reference syntax.
// Only local image-bearing corpus inputs need this projection compilation.
const renderer={config:createRequire(import.meta.url)(path.join(root,'generated/mdx-config.cjs')).default};
const projectionOptions=await applyMdxPreset(renderer.config.mdxOptions)('bundler');
// Only remark's processed Markdown is consumed; no highlighted HTML/JS output.
projectionOptions.rehypePlugins=[];
const {toMarkdown}=createRequire(import.meta.resolve('fumadocs-mdx'))('mdast-util-to-markdown');
function capture(){const processor=this;return(tree,file)=>{file.data.processedMarkdown=toMarkdown(tree,{...processor.data('settings'),extensions:processor.data('toMarkdownExtensions')||[]});};}
projectionOptions.remarkPlugins=[...projectionOptions.remarkPlugins,capture];
for(const result of results.values()){
 const file='generated/synced/'+result.file,source=await readFile(file,'utf8');
 if(!/!\[[^\]]*\]\(\/(?!\/)/.test(source))continue;
 const imageKey=createHash('sha256').update(projectionKey).update(source).digest('hex');const imageRecord=cache['image:'+result.file];
 if(!force&&imageRecord?.key===imageKey&&imageRecord.hash===createHash('sha256').update(imageRecord.markdown).digest('hex')){result.processedMarkdown=imageRecord.markdown;continue;}
 const output=await compile({value:matter(source).content,path:path.resolve(file)},{...projectionOptions,outputFormat:'function-body'});
 result.processedMarkdown=output.data.processedMarkdown;cache['image:'+result.file]={key:imageKey,markdown:result.processedMarkdown,hash:createHash('sha256').update(result.processedMarkdown).digest('hex')};
}
async function changed(file,value){await mkdir(path.dirname(file),{recursive:true});let old;try{old=await readFile(file,'utf8');}catch{}if(old!==value)await writeFile(file,value);}
for(const version of ['v7','v6','v5'])for(const family of ['docs','providers','cookbook']){
 if(ownedGroups&&!ownedGroups.includes(version+'/'+family))continue;
 const files=[];async function walk(dir,relative=''){for(const e of await readdir(dir,{withFileTypes:true})){const rel=path.join(relative,e.name),file=path.join(dir,e.name);if(e.isDirectory())await walk(file,rel);else if(e.name.endsWith('.mdx')){const result=results.get(version+'/'+family+'/'+rel);files.push({type:'page',path:rel,data:{...result.metadata,structuredData:result.structuredData,getText:async()=>result.processedMarkdown}});}else if(e.name==='meta.json')files.push({type:'meta',path:rel,data:JSON.parse(await readFile(file,'utf8'))});}}
 await walk('generated/synced/'+version+'/'+family);const order=sourceOrder[version+'/'+family];files.sort((a,b)=>(order.indexOf(a.path)<0?1e6:order.indexOf(a.path))-(order.indexOf(b.path)<0?1e6:order.indexOf(b.path))||a.path.localeCompare(b.path));const baseUrl=(version==='v7'?'':'/'+version)+'/'+family;const bundle=createSource({baseUrl,config,docs:{toFumadocsSource:()=>({files})}});
 for(const page of bundle.source.getPages('en')){
  const target='generated/projections'+page.url+'.md';const key=createHash('sha256').update(projectionKey).update(JSON.stringify({route:page.url,version,metadata:Object.fromEntries(Object.entries(page.data).filter(([name])=>!['getText','structuredData'].includes(name))),markdown:await page.data.getText()})).digest('hex');
  const prior=cache[page.url];if(!force&&prior?.key===key&&await outputsIntact(prior.outputHashes))cached++;
  else{const raw=resolveModelPlaceholders(await bundle.getPageMarkdown(page)),value=version==='v7'?raw:prefixVersionedMarkdownLinks(raw,'/'+version);await changed(target,value);cache[page.url]={key,outputHashes:{[target]:createHash('sha256').update(value).digest('hex')}};converted++;}
  pages.push({route:page.url,file:target,version,family});
 }
}
for(const result of resultRows)cache['source:'+result.file]=result.projectionSourceKey;
await changed(workerIndex===null?'generated/projection-pages.json':'generated/projection-pages-worker-'+workerIndex+'.json',JSON.stringify(pages,null,2)+'\n');await writeFile(workerIndex===null?'generated/projection-cache.json':'generated/projection-cache-worker-'+workerIndex+'.json',JSON.stringify(cache)+'\n');console.log(JSON.stringify({markdownProjections:pages.length,converted,cached}));
