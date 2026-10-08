import React from 'react';
import {renderToString} from 'react-dom/server';
import {DocsChrome} from './docs-chrome';
import {DocsArticle} from './docs-article';
import {getPageFooterItems} from '@migration/page-footer';
export function shellMarkup(props:any){
 const neighbors=getPageFooterItems(props.tree,props.route);
 const input={...props,neighbors};
 return {html:renderToString(<DocsChrome {...input}><DocsArticle {...input} body="<!--AI-SDK-RAW-BODY-->"/></DocsChrome>,{identifierPrefix:'chrome-'}),props:input};
}
