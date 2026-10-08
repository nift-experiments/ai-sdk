// Dependency graphs come from the last successful esbuild compilation. A new
// import changes its importer, causing recompilation and graph recapture.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export async function dependencyKey(files){
 const hash=createHash('sha256').update(process.versions.node).update(process.env.NODE_ENV||'production');
 for(const file of [...new Set(files)].sort()){try{hash.update(file).update(await readFile(file));}catch{return null;}}
 return hash.digest('hex');
}
export async function outputsIntact(hashes){
 if(!hashes||!Object.keys(hashes).length)return false;
 for(const [file,hash]of Object.entries(hashes)){try{if(createHash('sha256').update(await readFile(file)).digest('hex')!==hash)return false;}catch{return false;}}
 return true;
}
