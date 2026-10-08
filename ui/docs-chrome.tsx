import React from 'react';
import {GeistdocsProvider,GeistdocsDocsLayout} from '@vercel/geistdocs/layout';
import {Navbar} from '@vercel/geistdocs/navbar';
import {Footer} from '@vercel/geistdocs/footer';
import {VersionSelect} from './components/docs/version-select';
import {config} from './lib/geistdocs/config';
import {RouteProvider} from './adapters/route-context';
// Framework UI owns navigation state; the article is an opaque HTML slot.
// Source/rendered bodies remain independently owned and Nift-composable.
export function DocsChrome({route,tree,versionPaths,article,children}:any){
 const version=route.startsWith('/v5/')?'v5':route.startsWith('/v6/')?'v6':'v7';
 return <RouteProvider value={route}><GeistdocsProvider config={config} lang="en" search={{options:{tag:version}}}>
  <Navbar config={config}/>
  <GeistdocsDocsLayout config={config} containerProps={{className:'mx-auto max-w-[1448px] bg-background-200'}} tree={tree} sidebarTop={<div className="mb-4"><VersionSelect current={version} paths={versionPaths} versions={config.versions!.items}/></div>}>
   {children??<div style={{display:'contents'}} data-ai-article-slot dangerouslySetInnerHTML={{__html:article}}/>}
  </GeistdocsDocsLayout><Footer/>
 </GeistdocsProvider></RouteProvider>;
}
