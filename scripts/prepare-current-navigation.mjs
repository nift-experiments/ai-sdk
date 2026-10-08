// Public package source API; no Next page factory or network sync.
import {createSource} from '@vercel/geistdocs/source';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
const files=[];
async function walk(dir,relative=''){
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const rel=path.join(relative,entry.name),file=path.join(dir,entry.name);
  if(entry.isDirectory())await walk(file,rel);
  else if(entry.name.endsWith('.mdx'))files.push({type:'page',path:rel,data:matter(await readFile(file,'utf8')).data});
  else if(entry.name==='meta.json')files.push({type:'meta',path:rel,data:JSON.parse(await readFile(file,'utf8'))});
 }
}
await walk('generated/synced/v7/docs');
const bundle=createSource({baseUrl:'/docs',config:{defaultLanguage:'en',translations:{en:{displayName:'English'}},siteUrl:'https://ai-sdk.dev'},docs:{toFumadocsSource:()=>({files})}});
const output=JSON.stringify(bundle.source.pageTree.en,null,2)+'\n';
const target='generated/current-docs-navigation.json';let old;try{old=await readFile(target,'utf8');}catch{}
if(output!==old)await writeFile(target,output);
console.log(JSON.stringify({pages:bundle.source.getPages('en').length,rootNodes:bundle.source.pageTree.en.children.length}));
