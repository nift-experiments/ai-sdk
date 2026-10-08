import React from 'react';
import {DocsBody,DocsDescription,DocsPage,DocsTitle} from 'fumadocs-ui/layouts/docs/page';
import {MobileDocsBar} from '@vercel/geistdocs/mobile-docs-bar';
import {GeistdocsPageActions,GeistdocsTableOfContentsActions} from '@migration/page-actions-client';
import {PageBreadcrumb} from '@migration/page-breadcrumb';
import {PageFooter} from '@migration/page-footer';
import {GeistdocsTableOfContents} from '@migration/table-of-contents';
import {Upsell} from './components/docs/upsell';
import {config} from './lib/geistdocs/config';
// Mirrors only the pinned corpus page layout. Metadata and raw HTML remain
// explicit data; this component never imports an MDX module or compiler.
function titleNode(value:any):any{
 if(value===null||typeof value==='string'||typeof value==='number')return value;
 if(Array.isArray(value))return value.map(titleNode);
 return React.createElement(value.type==='fragment'?React.Fragment:value.type,null,titleNode(value.children));
}
export function DocsArticle({route,tree,page,body,neighbors}:any){
 const toc=page.toc.map((row:any)=>({depth:row.depth,url:row.url,title:titleNode(row.title)}));
 const actions={markdownUrl:route+'.md',path:page.path,title:page.metadata.title,url:route};
 const footer=<>
  {toc.length>0?<div className="mt-4 border-gray-alpha-400 border-t pt-4"><nav aria-label="Page actions" className="flex min-w-0 flex-col gap-1"><GeistdocsTableOfContentsActions config={config} extraActions={[]}/></nav></div>:null}
  <div className="mt-4"><Upsell/></div>
 </>;
 return <DocsPage breadcrumb={{component:<PageBreadcrumb tree={tree} url={route}/>}} footer={{component:<PageFooter {...neighbors}/>}} full={page.metadata.full} toc={toc} tableOfContent={{enabled:true,single:true,component:<GeistdocsTableOfContents toc={toc} footer={footer}/>}} tableOfContentPopover={{enabled:false}}>
  <MobileDocsBar toc={toc}/>
  <div className={'flex flex-col-reverse gap-4 md:flex-row md:items-end md:justify-between'+(page.metadata.description===undefined?' mb-8':'')}>
   <DocsTitle className="mb-0 min-w-0 text-balance" data-geistdocs-article="title">{page.metadata.title}</DocsTitle>
   <GeistdocsPageActions config={config} only="desktop" page={actions}/>
  </div>
  <DocsDescription className="text-gray-900" data-geistdocs-article="description">{page.metadata.description}</DocsDescription>
  <div className="-mt-6 mb-4 @min-[961px]:hidden"><GeistdocsPageActions config={config} only="mobile" page={actions}/></div>
  <DocsBody className="mx-auto w-full" data-geistdocs-article="body" dangerouslySetInnerHTML={{__html:body}}/>
 </DocsPage>;
}
