// Public package source API; no Next page factory or network sync.
import {createSource} from '@vercel/geistdocs/source';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
let files=[];const trees={};
async function walk(dir,relative=''){
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const rel=path.join(relative,entry.name),file=path.join(dir,entry.name);
  if(entry.isDirectory())await walk(file,rel);
  else if(entry.name.endsWith('.mdx'))files.push({type:'page',path:rel,data:matter(await readFile(file,'utf8')).data});
  else if(entry.name==='meta.json')files.push({type:'meta',path:rel,data:JSON.parse(await readFile(file,'utf8'))});
 }
}
for(const version of ['v7','v6','v5'])for(const family of ['docs','providers','cookbook','recipes']){
 files=[];await walk('generated/synced/'+version+'/'+(family==='recipes'?'cookbook':family));
const bundle=createSource({baseUrl:(version==='v7'?'':'/'+version)+(family==='recipes'?'/resources/recipes':'/'+family),config:{defaultLanguage:'en',translations:{en:{displayName:'English'}},siteUrl:'https://ai-sdk.dev'},docs:{toFumadocsSource:()=>({files})}});
trees[version+'/'+family]=bundle.source.pageTree.en;
console.log(JSON.stringify({version,family,pages:bundle.source.getPages('en').length}));
}
const target='generated/content-navigation.json',output=JSON.stringify(trees,null,2)+'\n';let old;try{old=await readFile(target,'utf8');}catch{}if(output!==old)await writeFile(target,output);
