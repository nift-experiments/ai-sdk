import React from 'react';
import {GeistdocsProvider} from '@vercel/geistdocs/layout';
import {Navbar} from '@vercel/geistdocs/navbar';import {Footer} from '@vercel/geistdocs/footer';
import {RouteProvider} from './adapters/route-context';import {config} from './lib/geistdocs/config';
export function GlobalChrome({route,article}:any){const version=route.startsWith('/v5/')?'v5':route.startsWith('/v6/')?'v6':'v7';return <RouteProvider value={route}><GeistdocsProvider config={config} lang="en" search={{options:{tag:version}}}><Navbar config={config}/><div style={{display:'contents'}} data-ai-article-slot dangerouslySetInnerHTML={{__html:article}}/><Footer/></GeistdocsProvider></RouteProvider>;}
