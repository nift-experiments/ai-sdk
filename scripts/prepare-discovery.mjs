import {createHash} from 'node:crypto';import {dependencyKey,outputsIntact} from './build-cache.mjs';
// Authored-source discovery derives from metadata and rendered Markdown projections.
import {build} from 'esbuild';import {readFile,writeFile,mkdir} from 'node:fs/promises';import {createRequire} from 'node:module';import path from 'node:path';import {chromeBuildOptions} from './chrome-build-options.mjs';
const root=process.cwd();const discoveryBuild=await build({entryPoints:['ui/discovery-entry.ts'],outfile:'generated/discovery.cjs',bundle:true,platform:'node',format:'cjs',external:['react','react/*'],metafile:true,...chromeBuildOptions(root)});
const {config,createLlmsRoute,createSitemapMarkdownRoute,createAgentsRoute}=createRequire(import.meta.url)(path.join(root,'generated/discovery.cjs'));
const configKey=await dependencyKey([...Object.keys(discoveryBuild.metafile.inputs),'package.json','pnpm-lock.yaml','scripts/prepare-discovery.mjs','scripts/build-cache.mjs']);let cache={};try{cache=JSON.parse(await readFile('generated/discovery-cache.json','utf8'));}catch{}const force=process.argv.includes('--force');
const source=JSON.parse(await readFile('generated/content-source-map.json','utf8'));const results=new Map(JSON.parse(await readFile('generated/content-render-results.json','utf8')).map(p=>[p.file,p]));const projected=JSON.parse(await readFile('generated/projection-pages.json','utf8'));
async function changed(file,value){await mkdir(path.dirname(file),{recursive:true});let old;try{old=await readFile(file,'utf8');}catch{}if(old!==value)await writeFile(file,value);}
const records=Object.fromEntries(source.pages.map(p=>[p.route,p]));const output=[];
for(const version of ['v7','v6','v5']){
 const prefix=version==='v7'?'':'/'+version;
 const bundles=['docs','providers','cookbook'].map(family=>{
  const pages=projected.filter(p=>p.version===version&&p.family===family).map(p=>({url:p.route,path:records[p.route].file,slugs:p.route.slice((prefix+'/'+family+'/').length).split('/'),data:results.get(records[p.route].file).metadata}));
  return {routingConfig:config,baseUrl:prefix+'/'+family,source:{getPages:()=>pages},getPageMarkdown:async page=>readFile('generated/projections'+page.url+'.md','utf8')};
 });
 const digest=createHash('sha256').update(configKey);for(const page of bundles.flatMap(x=>x.source.getPages())){digest.update(JSON.stringify({url:page.url,path:page.path,data:page.data}));digest.update(await readFile('generated/projections'+page.url+'.md'));}const key=digest.digest('hex');const prior=cache[version];
 if(!force&&prior?.key===key&&await outputsIntact(prior.outputHashes)){output.push(...prior.records);console.log(JSON.stringify({version,cached:true}));continue;}
 const first=output.length;const request=new Request('https://ai-sdk.dev'+prefix+'/llms.txt'),params=Promise.resolve({lang:'en'});
 for(const [route,handler]of [[prefix+'/llms.txt',createLlmsRoute({sources:bundles}).GET],[prefix+'/sitemap.md',createSitemapMarkdownRoute({config,sources:bundles.map((source,i)=>({source,title:['Documentation','Providers','Cookbook'][i]})),title:'AI SDK'+(version==='v7'?'':' '+version)+' documentation'}).GET]]){
  const response=await handler(request,{params});const file='generated/discovery'+route;await changed(file,await response.text());output.push({route,file,headers:Object.fromEntries(response.headers)});
 }
 const groupRecords=output.slice(first),outputHashes={};for(const record of groupRecords)outputHashes[record.file]=createHash('sha256').update(await readFile(record.file)).digest('hex');cache[version]={key,records:groupRecords,outputHashes};
}
const agentRequest=new Request('https://ai-sdk.dev/agents.md');agentRequest.nextUrl=new URL(agentRequest.url);
const agents=await createAgentsRoute({config}).GET(agentRequest,{params:Promise.resolve({lang:'en'})});await changed('generated/discovery/agents.md',await agents.text());output.push({route:'/agents.md',file:'generated/discovery/agents.md',headers:Object.fromEntries(agents.headers)});
await changed('generated/discovery-pages.json',JSON.stringify(output,null,2)+'\n');await writeFile('generated/discovery-cache.json',JSON.stringify(cache)+'\n');console.log(JSON.stringify({discoveryOutputs:output.length}));
