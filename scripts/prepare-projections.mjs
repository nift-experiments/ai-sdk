import {compile} from '@mdx-js/mdx';import {applyMdxPreset} from 'fumadocs-mdx/config';
// Human authored-source projection stage. Not copied into the HTML-source repo.
import {build} from 'esbuild';import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';import path from 'node:path';import {createRequire} from 'node:module';
import {createSource} from '@vercel/geistdocs/source';import matter from 'gray-matter';
const root=process.cwd();await build({entryPoints:['ui/projection-config.ts'],outfile:'generated/projection-config.cjs',bundle:true,platform:'node',format:'cjs',external:['react','react/*']});
const {config,resolveModelPlaceholders,prefixVersionedMarkdownLinks}=createRequire(import.meta.url)(path.join(root,'generated/projection-config.cjs'));
const sourceOrder=JSON.parse(await readFile('routes/source-order.json','utf8'));
const results=new Map(JSON.parse(await readFile('generated/content-render-results.json','utf8')).map(row=>[row.file,row]));const pages=[];
// Imported-image Markdown retains the bundler's explicit reference syntax.
// Only local image-bearing corpus inputs need this projection compilation.
const renderer=createRequire(import.meta.url)(path.join(root,'generated/renderer.cjs'));
const projectionOptions=await applyMdxPreset(renderer.config.mdxOptions)('bundler');
const {toMarkdown}=createRequire(import.meta.resolve('fumadocs-mdx'))('mdast-util-to-markdown');
function capture(){const processor=this;return(tree,file)=>{file.data.processedMarkdown=toMarkdown(tree,{...processor.data('settings'),extensions:processor.data('toMarkdownExtensions')||[]});};}
projectionOptions.remarkPlugins=[...projectionOptions.remarkPlugins,capture];
for(const result of results.values()){
 const file='generated/synced/'+result.file,source=await readFile(file,'utf8');
 if(!/!\[[^\]]*\]\(\/(?!\/)/.test(source))continue;
 const output=await compile({value:matter(source).content,path:path.resolve(file)},{...projectionOptions,outputFormat:'function-body'});
 result.processedMarkdown=output.data.processedMarkdown;
}
async function changed(file,value){await mkdir(path.dirname(file),{recursive:true});let old;try{old=await readFile(file,'utf8');}catch{}if(old!==value)await writeFile(file,value);}
for(const version of ['v7','v6','v5'])for(const family of ['docs','providers','cookbook']){
 const files=[];async function walk(dir,relative=''){for(const e of await readdir(dir,{withFileTypes:true})){const rel=path.join(relative,e.name),file=path.join(dir,e.name);if(e.isDirectory())await walk(file,rel);else if(e.name.endsWith('.mdx')){const result=results.get(version+'/'+family+'/'+rel);files.push({type:'page',path:rel,data:{...result.metadata,structuredData:result.structuredData,getText:async()=>result.processedMarkdown}});}else if(e.name==='meta.json')files.push({type:'meta',path:rel,data:JSON.parse(await readFile(file,'utf8'))});}}
 await walk('generated/synced/'+version+'/'+family);const order=sourceOrder[version+'/'+family];files.sort((a,b)=>(order.indexOf(a.path)<0?1e6:order.indexOf(a.path))-(order.indexOf(b.path)<0?1e6:order.indexOf(b.path))||a.path.localeCompare(b.path));const baseUrl=(version==='v7'?'':'/'+version)+'/'+family;const bundle=createSource({baseUrl,config,docs:{toFumadocsSource:()=>({files})}});
 for(const page of bundle.source.getPages('en')){const raw=resolveModelPlaceholders(await bundle.getPageMarkdown(page)),value=version==='v7'?raw:prefixVersionedMarkdownLinks(raw,'/'+version),target='generated/projections'+page.url+'.md';await changed(target,value);pages.push({route:page.url,file:target,version,family});}
}
await changed('generated/projection-pages.json',JSON.stringify(pages,null,2)+'\n');console.log(JSON.stringify({markdownProjections:pages.length}));
