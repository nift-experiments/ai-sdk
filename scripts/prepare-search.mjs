import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createSearchAPI} from 'fumadocs-core/search/server';
import {findPath} from 'fumadocs-core/page-tree';
import {isPageVisibleForSurface} from '@vercel/geistdocs/page-visibility';
const agent=process.argv.includes('--rendered-source');
let pages;
if(agent)pages=JSON.parse(await readFile('content-pages.json','utf8'));
else{
 const source=JSON.parse(await readFile('generated/content-source-map.json','utf8'));
 const results=new Map(JSON.parse(await readFile('generated/content-render-results.json','utf8')).map(p=>[p.file,p]));
 pages=source.pages.map(p=>({...p,metadata:results.get(p.file).metadata,structuredData:results.get(p.file).structuredData}));
}
const sourceOrder=JSON.parse(await readFile('routes/source-order.json','utf8'));
const rank=p=>sourceOrder[p.version+'/'+p.family].indexOf(p.path??p.file.slice((p.version+'/'+p.family+'/').length));
pages.sort((a,b)=>['docs','providers','cookbook'].indexOf(a.family)-['docs','providers','cookbook'].indexOf(b.family)||(rank(a)<0?1e6:rank(a))-(rank(b)<0?1e6:rank(b)));
const trees=JSON.parse(await readFile(agent?'content-navigation.json':'generated/content-navigation.json','utf8'));
await mkdir('generated/search',{recursive:true});
for(const version of ['v7','v6','v5']){
 const indexes=pages.filter(p=>p.version===version&&isPageVisibleForSurface({data:p.metadata},'search')).map(p=>{
  const tree=trees[version+'/'+p.family],path=findPath(tree.children,node=>node.type==='page'&&node.url===p.route);
  const breadcrumbs=[tree.name,...(path?.slice(0,-1).map(n=>n.name)??[])].filter(n=>typeof n==='string'&&n.length>0);
  return {id:p.route,url:p.route,title:p.metadata.title??p.route,description:p.metadata.description??'',...(breadcrumbs.length?{breadcrumbs}:{}),structuredData:p.structuredData??{headings:[],contents:[]}};
 });
 const api=createSearchAPI('advanced',{indexes,language:'english'});const data=await api.export();
 await writeFile('generated/search/'+version+'-indexes.json',JSON.stringify(indexes)+'\n');
 await writeFile('generated/search/'+version+'-database.json',JSON.stringify(data)+'\n');
 console.log(JSON.stringify({version,pages:indexes.length,bytes:Buffer.byteLength(JSON.stringify(data))}));
}
