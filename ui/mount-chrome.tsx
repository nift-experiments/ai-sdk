import {GlobalChrome} from './global-chrome';
import React from 'react';
import {hydrateRoot} from 'react-dom/client';
import {DocsChrome} from './docs-chrome';
import {DocsArticle} from './docs-article';
const host=document.querySelector<HTMLElement>('[data-ai-docs-chrome]');
if(host){
 const data=host.nextElementSibling;
 if(data?.tagName!=='SCRIPT')throw Error('Missing docs chrome metadata');
 const props=JSON.parse(data.textContent||'{}');
 if(props.layout==='global'){
 const article=host.querySelector('[data-ai-article-slot]')?.innerHTML;if(article===undefined)throw Error('Missing global raw body');hydrateRoot(host,React.createElement(GlobalChrome,{...props,article}),{identifierPrefix:'chrome-'});
 }else if(props.page){
  const body=host.querySelector('[data-geistdocs-article="body"]')?.innerHTML;
  if(body===undefined)throw Error('Missing raw body slot');
  hydrateRoot(host,React.createElement(DocsChrome,props,React.createElement(DocsArticle,{...props,body})),{identifierPrefix:'chrome-'});
 }else{
  const article=host.querySelector('[data-ai-article-slot]')?.innerHTML;
  if(article===undefined)throw Error('Missing opaque article slot');
  hydrateRoot(host,React.createElement(DocsChrome,{...props,article}),{identifierPrefix:'chrome-'});
 }
}
