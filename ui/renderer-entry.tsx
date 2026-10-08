import {getMdxComponents} from './components/mdx-components';
import Link from './adapters/link';
import config from './source.config';
import React from 'react';
import {serializeIslandProps} from './island-props';
import {islandMarkup} from './island-server';
export {config};
export function versionedComponents(prefix:string){
  const components=getMdxComponents({link:Link,versionPrefix:prefix});
  let serial=0;
  for(const name of ['TextGeneration','CodeTemplate','PreviewSwitchProviders','BrowserIllustration','InlinePrompt','CardPlayer','ChatGeneration','ObjectGeneration','WeatherSearch'] as const){
    components[name]=(props:any)=>{
      const input={...props,...(['CodeTemplate','PreviewSwitchProviders'].includes(name)?{versionPrefix:prefix}:{})};
      const id=`ai-${serial++}-`;
      const json=JSON.stringify(serializeIslandProps(input)).replace(/</g,'\\u003c');
      return <><div data-ai-island={name} data-ai-prefix={id} dangerouslySetInnerHTML={{__html:islandMarkup(name,input,id)}}/><script type="application/json" dangerouslySetInnerHTML={{__html:json}}/></>;
    };
  }
  return components;
}
