import './frozen-image-inputs.mjs';
import {build} from 'esbuild';
import {compile,run} from '@mdx-js/mdx';
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
const root=process.cwd();
await mkdir('generated',{recursive:true});
await build({entryPoints:['ui/renderer-entry.tsx'],outfile:'generated/renderer.cjs',bundle:true,platform:'node',format:'cjs',external:['react','react/*','react-dom','react-dom/*','next/*'],alias:{'next/link':path.join(root,'ui/adapters/link.tsx'),'next/navigation':path.join(root,'ui/adapters/navigation.ts'),'next/image':path.join(root,'ui/adapters/image.tsx')},metafile:true});
const require=createRequire(import.meta.url);
const {config,versionedComponents}=require(path.join(root,'generated/renderer.cjs'));
const opts=await applyMdxPreset(config.mdxOptions)('runtime');
const corpus=process.argv.includes('--current-docs');
const sourceRoot=corpus?'generated/synced':'sources';
const provenance=JSON.parse(await readFile(corpus?'generated/current-docs-source-map.json':'investigation/A3-SOURCE-PROVENANCE.json','utf8'));
const cachePath=corpus?'generated/current-docs-mdx-cache.json':'generated/mdx-cache.json';
const results=[];
let cache={};try{cache=JSON.parse(await readFile(cachePath,'utf8'));}catch{}
const dependencies=[];
async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())await walk(f);else dependencies.push(f);}}
await walk('ui');await walk('maintained-assets');dependencies.push('package.json','pnpm-lock.yaml','scripts/render-proof.mjs','scripts/frozen-image-inputs.mjs');dependencies.sort();
const hash=createHash('sha256').update(process.env.NODE_ENV||'development').update(process.versions.node);for(const f of dependencies){hash.update(f);hash.update(await readFile(f));}const compilerKey=hash.digest('hex');
for(const file of provenance.fixtures){
 const begin=performance.now();
 const inputRoot=corpus||file.startsWith('v7/docs/')?'generated/synced':sourceRoot;
 const source=await readFile(inputRoot+'/'+file,'utf8');
 const target='generated/'+file.replace(/\.mdx$/,'.html');
 const key=createHash('sha256').update(compilerKey).update(source).digest('hex');
 if(cache[file]?.key===key&&!process.argv.includes('--force')){
   try{const html=await readFile(target);if(createHash('sha256').update(html).digest('hex')===cache[file].outputHash){results.push({...cache[file].result,cached:true,compile_ms:0,render_ms:0});continue;}}catch{}
 }
 const fm=matter(source);
 const output=await compile({value:fm.content,path:path.resolve(inputRoot+'/'+file)},{...opts,outputFormat:'function-body'});
 const compiled=performance.now();
 const mdx=await run(output,{...runtime,baseUrl:import.meta.url});
 const prefix=file.startsWith('v7/')?'':'/'+file.split('/')[0];
 const html=renderToString(React.createElement(mdx.default,{components:versionedComponents(prefix)}));
 await mkdir(path.dirname(target),{recursive:true});let old;try{old=await readFile(target,'utf8');}catch{}if(old!==html)await writeFile(target,html);
 const result={file,metadata:fm.data,toc:(mdx.toc??[]).map(({depth,url,title})=>({depth,url,title:titleTree(title)})),bytes:Buffer.byteLength(html),compile_ms:compiled-begin,render_ms:performance.now()-compiled};results.push(result);
 cache[file]={key,outputHash:createHash('sha256').update(html).digest('hex'),result};
}
await writeFile(cachePath,JSON.stringify(cache,null,2)+'\n');
await writeFile(corpus?'generated/current-docs-render-results.json':'generated/a3-render-results.json',JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify(results,null,2));
