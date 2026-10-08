export {playgroundTransitionResponse} from './lib/playground-urls';
import {shouldServeMarkdown,applyMarkdownHeaders} from '@vercel/agent-readability';
import {createNotFoundRoute} from '@vercel/geistdocs/routes/not-found';
import {createChatRoute} from '@vercel/geistdocs/routes/chat';
import {config} from './lib/geistdocs/config';
import {readFile} from 'node:fs/promises';
import {create,load} from '@orama/orama';
import {searchAdvanced} from '@migration/search-advanced';
import {renderCard} from './og-runtime';
const databases=new Map<string,Promise<any>>();
async function database(version:string){let promise=databases.get(version);if(!promise){promise=(async()=>{const db=create({schema:{_:'string'},language:'english'});load(db,JSON.parse(await readFile('runtime/search/'+version+'-database.json','utf8')));return db;})();databases.set(version,promise);}return promise;}
export async function searchResponse(request:Request){
 const url=new URL(request.url);const tag=url.searchParams.get('tag');let version=tag==='v5'||tag==='v6'||tag==='v7'?tag:'v7';const scoped=tag==='v5'||tag==='v6'||tag==='v7';
 if(!scoped){try{const path=new URL(request.headers.get('referer')??'').pathname;version=path.startsWith('/v5/')?'v5':path.startsWith('/v6/')?'v6':'v7';}catch{}}
 const query=url.searchParams.get('query');const tags=scoped?undefined:url.searchParams.get('tag')?.split(',');let results=[];
 if(query){const mode=url.searchParams.get('mode')==='vector'?'vector':'fulltext';try{results=await searchAdvanced(await database(version),query,tags,{mode});}catch(error){if(mode!=='vector')throw error;}}
 return Response.json(results,{headers:scoped?{}:{Vary:'Referer'}});
}
export async function ogResponse(request:Request){
 const url=new URL(request.url),slug=url.pathname.slice('/og/'.length);
 const clamp=(value:string|null,max:number)=>value===null?null:value.slice(0,max);
 if(slug==='docs')return renderCard(clamp(url.searchParams.get('title'),140),clamp(url.searchParams.get('description'),320),'public, immutable, no-transform, max-age=31536000');
 if(slug!=='image.png'&&!slug.endsWith('/image.png'))return new Response('Not found',{status:404});
 const wanted=slug==='image.png'?'':slug.slice(0,-'/image.png'.length),pages=JSON.parse(await readFile('runtime/og-pages.json','utf8'));
 const page=pages.find((p:any)=>p.slug===wanted);
 if(!page)return new Response('Not found',{status:404});
 return renderCard(clamp(page.metadata.title??null,140),clamp(page.metadata.description??null,320),'public, max-age=0, must-revalidate, no-transform, s-maxage=31536000');
}

export const markdownDecision=(request:Request)=>shouldServeMarkdown(request,{mediaTypes:['text/markdown','text/x-markdown','text/plain']}).serve;
export const markdownHeaders=(canonical:string)=>applyMarkdownHeaders(new Headers({'Content-Type':'text/markdown','Cache-Control':'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800'}),{canonicalUrl:canonical});
export function notFoundResponse(request:any){request.nextUrl=new URL(request.url);return createNotFoundRoute({config}).GET(request,{params:Promise.resolve({lang:'en'})});}
let chatRoute:any;
export async function chatResponse(request:Request){
 if(!chatRoute){
  const records=JSON.parse(await readFile('runtime/chat-pages.json','utf8'));
  const sources=['v7','v6','v5'].flatMap(version=>['docs','providers','cookbook'].map(family=>{
   const pages=records.filter((p:any)=>p.version===version&&p.family===family).map((p:any)=>({url:p.route,path:p.path,data:{...p.metadata,structuredData:p.structuredData}}));
   return {source:{getPages:()=>pages,getPageByHref:(href:string)=>{const url=new URL(href,'https://ai-sdk.dev');const page=pages.find((p:any)=>p.url===url.pathname);return page?{page,hash:url.hash.slice(1)}:undefined;}},getPageMarkdown:async(page:any)=>readFile('public'+page.url+'.md','utf8')};
  }));
  chatRoute=createChatRoute({config,model:'anthropic/claude-fable-5',sources,proxy:process.env.GEISTDOCS_CHAT_PROXY_URL?{url:process.env.GEISTDOCS_CHAT_PROXY_URL,headers:process.env.GEISTDOCS_CHAT_PROXY_TOKEN?{Authorization:'Bearer '+process.env.GEISTDOCS_CHAT_PROXY_TOKEN}:undefined}:undefined});
 }
 return chatRoute.POST(request);
}

export {feedbackResponse} from './feedback-runtime';
