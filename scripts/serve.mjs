// Standalone HTTP publication: static Nift output plus bounded API handlers.
import {createServer} from 'node:http';import {readFile,stat} from 'node:fs/promises';import {createReadStream} from 'node:fs';import {createRequire} from 'node:module';import path from 'node:path';import {Readable} from 'node:stream';
const root=process.cwd(),args=process.argv.slice(2),port=Number(args[args.indexOf('--port')+1]||4334),fixtures=args.includes('--fixtures');
const {playgroundTransitionResponse,searchResponse,ogResponse,markdownDecision,markdownHeaders,notFoundResponse,chatResponse,feedbackResponse}=createRequire(import.meta.url)(path.join(root,'runtime/runtime-api.cjs'));
const rules=JSON.parse(await readFile('routes/redirects.json','utf8')).map(row=>({...row,pattern:new RegExp(row.regex)}));
const surfaces=JSON.parse(await readFile('runtime/surfaces.json','utf8'));const markdown=new Set(surfaces.markdown);
const mime={'.html':'text/html; charset=utf-8','.md':'text/markdown','.txt':'text/plain; charset=utf-8','.xml':'application/xml','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.woff2':'font/woff2','.ttf':'font/ttf','.mp4':'video/mp4','.mp3':'audio/mpeg'};
async function send(response,res,head){res.writeHead(response.status,Object.fromEntries(response.headers));if(head||!response.body){res.end();return;}Readable.fromWeb(response.body).pipe(res);}
async function fixtureState(){try{return JSON.parse(await readFile(process.env.AI_SDK_FIXTURE_STATE||'/tmp/ai-sdk-fixture-state.json','utf8'));}catch{return {mode:'success'};}}
createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://'+(req.headers.host||'localhost:'+port)),head=req.method==='HEAD',read=req.method==='GET'||head;
  let body;
  if(!read){const chunks=[];let bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>1_000_000){res.writeHead(413);res.end();return;}chunks.push(chunk);}body=Buffer.concat(chunks);}
  const request=new Request(url,{method:req.method,headers:req.headers,...(body?.length?{body}: {})});
  res.setHeader('Content-Security-Policy',"connect-src 'self'; script-src 'self' 'unsafe-inline'; form-action 'none'");
  const transition=playgroundTransitionResponse(request);if(transition){await send(transition,res,head);return;}
  if(!read){
   if(req.method==='POST'&&fixtures&&['/api/chat','/api/feedback'].includes(url.pathname)){
    const state=await fixtureState();if(state.mode==='error'){await send(Response.json({error:'Deterministic fixture failure'},{status:503}),res,head);return;}
    if(url.pathname==='/api/feedback'){await send(Response.json({success:true}),res,head);return;}
    JSON.parse(body.toString());
    const events=[{type:'start',messageId:'fixture-assistant'},{type:'text-start',id:'fixture-text'},{type:'text-delta',id:'fixture-text',delta:'Deterministic fixture: use streamText to stream a model response.'},{type:'text-end',id:'fixture-text'},{type:'source-url',sourceId:'fixture-doc',url:'https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text',title:'streamText'},{type:'finish',finishReason:'stop'}];
    res.writeHead(200,{'Content-Type':'text/event-stream','x-vercel-ai-ui-message-stream':'v1','Cache-Control':'no-cache'});for(const event of events){res.write('data: '+JSON.stringify(event)+'\n\n');if(state.mode==='slow')await new Promise(resolve=>setTimeout(resolve,100));}res.end('data: [DONE]\n\n');return;
   }
   if(req.method==='POST'&&url.pathname==='/api/chat'){await send(await chatResponse(request),res,head);return;}
   if(req.method==='POST'&&url.pathname==='/api/feedback'){await send(await feedbackResponse(request),res,head);return;}
   await send(new Response('Method not allowed',{status:405}),res,head);return;
  }
  for(const row of rules){
   if((row.has||[]).some(c=>c.type!=='host'||!new RegExp('^(?:'+c.value+')$').test(url.hostname)))continue;
   const match=row.pattern.exec(url.pathname);if(!match)continue;
   let destination=row.destination;row.parameters.forEach((key,i)=>destination=destination.replace(new RegExp(':'+key+'[*+?]?','g'),match[i+1]||''));if(url.search)destination+=(destination.includes('?')?'&':'?')+url.search.slice(1);
   const bytes=Buffer.from(destination);res.writeHead(row.statusCode,{Location:destination,'Content-Length':bytes.length});res.end(head?undefined:bytes);return;
  }
  if(url.pathname==='/api/search'){await send(await searchResponse(request),res,head);return;}
  if(url.pathname.startsWith('/og/')){await send(await ogResponse(request),res,head);return;}
  let pathname=decodeURIComponent(url.pathname);if(pathname.includes('\0'))throw Error('Invalid path');
  const version=pathname.startsWith('/v5/')?'/v5':pathname.startsWith('/v6/')?'/v6':'';
  let page=pathname.replace(/\.mdx?$/,'');if(page.startsWith(version+'/resources/recipes/'))page=page.replace('/resources/recipes/','/cookbook/');
  if(markdown.has(page)&&(pathname.endsWith('.md')||pathname.endsWith('.mdx')||markdownDecision(request))){const bytes=await readFile(root+'/public'+page+'.md');const canonical='https://ai-sdk.dev'+page;await send(new Response(bytes,{headers:markdownHeaders(canonical)}),res,head);return;}
  if(pathname==='/agents.md'){const bytes=(await readFile('public/agents.md','utf8')).replaceAll('https://ai-sdk.dev',url.origin);await send(new Response(bytes,{headers:{'Content-Type':'text/markdown; charset=utf-8'}}),res,head);return;}
  const destination=path.resolve(root,'public','.'+pathname+(path.extname(pathname)?'':'/index.html'));
  if(!destination.startsWith(path.join(root,'public')+path.sep)){await send(await notFoundResponse(request),res,head);return;}
  let info;try{info=await stat(destination);}catch{await send(await notFoundResponse(request),res,head);return;}
  if(!info.isFile()){await send(await notFoundResponse(request),res,head);return;}
  const headers={'Content-Type':mime[path.extname(destination)]||'application/octet-stream','Content-Length':info.size};
  if(destination.endsWith('.html'))headers.Vary='Accept, User-Agent, Signature-Agent';
  const discovery=surfaces.discovery.find(p=>p.route===pathname);if(discovery)Object.assign(headers,discovery.headers);
  const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range||'');
  if(range){const start=Number(range[1]),end=range[2]?Math.min(Number(range[2]),info.size-1):info.size-1;if(start>end||start>=info.size){res.writeHead(416,{'Content-Range':'bytes */'+info.size});res.end();return;}res.writeHead(206,{...headers,'Accept-Ranges':'bytes','Content-Range':'bytes '+start+'-'+end+'/'+info.size,'Content-Length':end-start+1});if(head)res.end();else createReadStream(destination,{start,end}).pipe(res);return;}
  res.writeHead(200,{...headers,'Accept-Ranges':'bytes'});if(head)res.end();else createReadStream(destination).pipe(res);
 }catch(error){console.error(error.message);if(!res.headersSent)res.writeHead(500);res.end('Publication request failed');}
}).listen(port,'127.0.0.1',()=>console.log(JSON.stringify({port,fixtures,frameworkRuntime:false})));
