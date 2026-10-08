// Local maintained authored docs, including pinned historical versions.
import {transformDir,parseSegment} from '../compatibility/sync-content-utils.mjs';
import {mkdtemp,readFile,writeFile,readdir,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';import path from 'node:path';import {createHash} from 'node:crypto';
const stage=await mkdtemp(path.join(tmpdir(),'ai-sdk-docs-sync-'));const owned=[],pages=[],versions=[];
async function walk(dir,relative=''){const result=[];for(const e of await readdir(dir,{withFileTypes:true})){const rel=path.join(relative,e.name);if(e.isDirectory())result.push(...await walk(path.join(dir,e.name),rel));else result.push(rel);}return result;}
async function changed(file,bytes){await mkdir(path.dirname(file),{recursive:true});let old;try{old=await readFile(file);}catch{}if(!old?.equals(Buffer.from(bytes)))await writeFile(file,bytes);}
try{for(const version of ['v7','v6','v5']){
 const input='authored/'+version+'/docs',out=path.join(stage,version,'docs');transformDir(input,out);
 const originals=(await walk(input)).filter(f=>f.endsWith('.mdx'));
 const map=new Map(originals.map(file=>[file.split(path.sep).map((s,i,a)=>parseSegment(i===a.length-1?s.slice(0,-4):s).clean).join('/')+'.mdx',file]));
 let count=0;for(const rel of (await walk(out)).sort()){
  const file=version+'/docs/'+rel,bytes=await readFile(path.join(out,rel));owned.push(file);await changed('generated/synced/'+file,bytes);
  if(rel.endsWith('.mdx')){const original=map.get(rel);if(!original)throw Error('Missing source provenance '+file);const slug=rel.replace(/\.mdx$/,'').replace(/(?:^|\/)index$/,'');pages.push({file,source:input+'/'+original,route:(version==='v7'?'':'/'+version)+'/docs'+(slug?'/'+slug:''),version,sha256:createHash('sha256').update(bytes).digest('hex')});count++;}
 }
 versions.push({version,authoredMdx:originals.length,synchronizedMdx:count});
}
let old=[];try{old=JSON.parse(await readFile('generated/docs-sync-owned.json','utf8'));}catch{}for(const file of old)if(!owned.includes(file))await rm('generated/synced/'+file,{force:true});
await changed('generated/docs-sync-owned.json',JSON.stringify(owned,null,2)+'\n');await changed('generated/docs-source-map.json',JSON.stringify({versions,fixtures:pages.map(p=>p.file),pages},null,2)+'\n');console.log(JSON.stringify({versions,pages:pages.length}));
}finally{await rm(stage,{recursive:true,force:true});}
