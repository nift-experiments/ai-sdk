import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const root=process.cwd(),agent=process.argv.includes('--rendered-source');
const bundle=JSON.parse(await readFile('generated/chrome-build.json','utf8'));
const {shellMarkup}=createRequire(import.meta.url)(path.join(root,'generated/docs-shell-server.cjs'));
const trees=JSON.parse(await readFile(agent?'docs-navigation.json':'generated/docs-navigation.json','utf8'));
let pages;
if(agent)pages=JSON.parse(await readFile('generated/docs-compose-pages.json','utf8'));
else{
 const source=JSON.parse(await readFile('generated/docs-source-map.json','utf8'));
 const results=new Map(JSON.parse(await readFile('generated/docs-render-results.json','utf8')).map(row=>[row.file,row]));
 pages=source.pages.map(row=>({route:row.route,source:row.source,body:'generated/'+row.file.replace(/\.mdx$/,'.html'),metadata:results.get(row.file).metadata,toc:results.get(row.file).toc,path:row.file.slice((row.version+'/docs/').length),version:row.version}));
}
const versionPaths=Object.fromEntries(['v7','v6','v5'].map(version=>[version,{paths:pages.filter(p=>p.route.startsWith(version==='v7'?'/docs/':'/'+version+'/docs/')).map(p=>p.route.replace(/^\/v[56](?=\/)/,'')),fallbackPath:'/docs/introduction'}]));
let cache={};try{cache=JSON.parse(await readFile('generated/docs-shell-cache.json','utf8'));}catch{}
let rendered=0;
async function changed(file,value){await mkdir(path.dirname(file),{recursive:true});let previous;try{previous=await readFile(file,'utf8');}catch{}if(previous!==value)await writeFile(file,value);}
for(const page of pages){
 page.name=page.route.slice(1)+'/index';
 const version=page.route.startsWith('/v5/')?'v5':page.route.startsWith('/v6/')?'v6':'v7';const tree=trees[version];page.navigationVersion=version;
 const props={route:page.route,tree,versionPaths,page:{metadata:page.metadata,toc:page.toc,path:page.path}};
 const key=createHash('sha256').update(bundle.key).update(JSON.stringify(props)).digest('hex');
 const target='generated/docs-shells/'+page.name+'.json';
 let result;
 if(cache[page.route]?.key===key&&!process.argv.includes('--force')){
  try{const bytes=await readFile(target);if(createHash('sha256').update(bytes).digest('hex')===cache[page.route].hash)result=JSON.parse(bytes);}catch{}
 }
 if(!result){
  result=shellMarkup(props);
  if(result.html.split('<!--AI-SDK-RAW-BODY-->').length!==2)throw Error('Body slot ownership failed: '+page.route);
  const value=JSON.stringify(result);await changed(target,value);
  cache[page.route]={key,hash:createHash('sha256').update(value).digest('hex')};rendered++;
 }
 const [before,after]=result.html.split('<!--AI-SDK-RAW-BODY-->');
 page.prefix='generated/docs-shells/'+page.name+'.prefix.html';page.suffix='generated/docs-shells/'+page.name+'.suffix.html';
 const json=JSON.stringify(result.props).replace(/</g,'\\u003c');
 await changed(page.prefix,'<div data-ai-docs-chrome="" style="display:contents">'+before);
 await changed(page.suffix,after+'</div><script type="application/json">'+json+'</script><script type="module" src="/'+bundle.entry.replace(/^public\//,'')+'"></script>');
}
await writeFile('generated/docs-shell-cache.json',JSON.stringify(cache,null,2)+'\n');
await changed('generated/docs-pages.json',JSON.stringify(pages,null,2)+'\n');
console.log(JSON.stringify({pages:pages.length,shellsRendered:rendered,markdownRenderers:0}));
