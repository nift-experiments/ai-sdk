// The renderer may read only the public image inputs pinned during A1.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../maintained-assets/remote-images/',import.meta.url);
const rows=JSON.parse(readFileSync(new URL('manifest.json',root),'utf8'));
const images=new Map(rows.filter(row=>row.file).map(row=>[row.url,row]));
globalThis.fetch=async(input,init)=>{
 const url=typeof input==='string'?input:input instanceof URL?input.href:input.url;
 const method=String(init?.method||input?.method||'GET').toUpperCase();
 const entry=images.get(url);
 if(!entry||!['GET','HEAD'].includes(method))throw Error('Unpinned renderer request: '+method+' '+url);
 const bytes=readFileSync(new URL(entry.file,root));
 if(entry.sha256&&createHash('sha256').update(bytes).digest('hex')!==entry.sha256)throw Error('Pinned image hash mismatch: '+url);
 return new Response(method==='HEAD'?null:bytes,{status:200,headers:{'content-type':entry.mime}});
};
