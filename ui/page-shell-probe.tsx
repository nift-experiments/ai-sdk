import React from 'react';
import {createDocsPage} from '@vercel/geistdocs/pages/docs';
import {createSource} from '@vercel/geistdocs/source';
import {MobileDocsBar} from '@vercel/geistdocs/mobile-docs-bar';
import {Upsell} from './components/docs/upsell';
import {config} from './lib/geistdocs/config';
import {DocsChrome} from './docs-chrome';
// Probe the public page factory with structured records and a raw body slot.
// No compiled MDX module or source renderer is loaded here.
export function pageShellProbe({files,route}:any){
 const source=createSource({baseUrl:'/docs',config,docs:{toFumadocsSource:()=>({files:files.map((file:any)=>file.type==='page'?{...file,data:{...file.data,body:()=> <span data-ai-raw-body-slot=""/>}}:file)})}});
 // Projection ownership is still open; this probe exercises the layout only.
 source.getPageMarkdown=async()=>'';
 const page=createDocsPage({config,source,renderTop:({data})=><MobileDocsBar toc={data.toc}/>,tableOfContent:{footer:<Upsell/>},tableOfContentPopover:{enabled:false}});
 const slug=route.slice('/docs'.length).split('/').filter(Boolean);
 return <DocsChrome route={route} tree={source.source.pageTree.en} versionPaths={{}}><page.Page params={Promise.resolve({lang:'en',slug})}/></DocsChrome>;
}
