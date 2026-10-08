import {build} from 'esbuild';import {readFile,writeFile,mkdir} from 'node:fs/promises';import {createRequire} from 'node:module';import path from 'node:path';import React from 'react';import {renderToString} from 'react-dom/server';import {chromeBuildOptions} from './chrome-build-options.mjs';
const root=process.cwd(),require=createRequire(import.meta.url);
async function changed(file,value){await mkdir(path.dirname(file),{recursive:true});let old;try{old=await readFile(file,'utf8');}catch{}if(old!==value)await writeFile(file,value);}
await build({entryPoints:['ui/lib/recipe-source.ts'],outfile:'generated/recipe-source.cjs',platform:'node',bundle:true,format:'cjs'});
const {getRecipes}=require(path.join(root,'generated/recipe-source.cjs'));const recipes=Object.fromEntries(['v7','v6','v5'].map(v=>[v,getRecipes(v)]));await changed('generated/recipe-items.json',JSON.stringify(recipes,null,2)+'\n');
await build({entryPoints:['ui/ancillary-entry.tsx'],outfile:'generated/ancillary.cjs',bundle:true,platform:'node',format:'cjs',external:['react','react/*','react-dom','react-dom/*'],...chromeBuildOptions(root)});
const {ancillaryPages}=require(path.join(root,'generated/ancillary.cjs'));const pages=[];
for(const page of await ancillaryPages()){
 const name=page.route==='/'?'index':page.route.slice(1)+'/index',body='generated/ancillary/'+name+'.html';await changed(body,renderToString(page.element));pages.push({route:page.route,name,body,source:'ui/ancillary-entry.tsx',metadata:page.metadata,layout:'global'});
}
await changed('generated/ancillary-pages.json',JSON.stringify(pages,null,2)+'\n');console.log(JSON.stringify({pages:pages.length,recipes:Object.fromEntries(Object.entries(recipes).map(([v,r])=>[v,r.length]))}));
