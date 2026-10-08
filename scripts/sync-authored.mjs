// Pure, local corpus preparation. No fetches, Git mutations or upstream imports.
import {transformDir,parseSegment} from '../compatibility/sync-content-utils.mjs';
import {mkdtemp,readFile,writeFile,readdir,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=process.cwd(),stage=await mkdtemp(path.join(tmpdir(),'ai-sdk-sync-'));
const files=[];
async function walk(dir,relative=''){
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const rel=path.join(relative,entry.name);
  if(entry.isDirectory())await walk(path.join(dir,entry.name),rel);else files.push(rel);
 }
}
try{
 transformDir('authored/v7/docs',path.join(stage,'v7/docs'));
 await walk(stage);files.sort();
 const rows=[];
 const authored=[];
 async function originals(dir,relative=''){
  for(const entry of await readdir(dir,{withFileTypes:true})){
   const rel=path.join(relative,entry.name);
   if(entry.isDirectory())await originals(path.join(dir,entry.name),rel);
   else if(entry.name.endsWith('.mdx'))authored.push(rel);
  }
 }
 await originals('authored/v7/docs');
 const originalMap=new Map(authored.map(file=>[file.split(path.sep).map((segment,i,parts)=>parseSegment(i===parts.length-1?segment.slice(0,-4):segment).clean).join('/')+'.mdx',file]));
 for(const file of files){
  const bytes=await readFile(path.join(stage,file)),target=path.join(root,'generated/synced',file);
  await mkdir(path.dirname(target),{recursive:true});
  let previous;try{previous=await readFile(target);}catch{}
  if(!previous?.equals(bytes))await writeFile(target,bytes);
  if(file.endsWith('.mdx')){
   const rel=file.slice('v7/docs/'.length),original=originalMap.get(rel);
   if(!original)throw Error('Missing authored provenance: '+file);
   const slug=rel.replace(/\.mdx$/,'').replace(/(?:^|\/)index$/,'');
   rows.push({file,source:'authored/v7/docs/'+original,route:'/docs'+(slug?'/'+slug:''),sha256:createHash('sha256').update(bytes).digest('hex')});
  }
 }
 const ledger='generated/current-docs-sync-owned.json';let old=[];try{old=JSON.parse(await readFile(ledger,'utf8'));}catch{}
 for(const file of old)if(!files.includes(file))await rm(path.join('generated/synced',file),{force:true});
 await writeFile(ledger,JSON.stringify(files,null,2)+'\n');
 await writeFile('generated/current-docs-source-map.json',JSON.stringify({authoredMdx:authored.length,synchronizedMdx:rows.length,fixtures:rows.map(row=>row.file),pages:rows},null,2)+'\n');
 console.log(JSON.stringify({authoredMdx:authored.length,synchronizedMdx:rows.length}));
}finally{await rm(stage,{recursive:true,force:true});}
