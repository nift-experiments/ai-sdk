import React from 'react';
import {WeatherCard} from './components/docs/weather-card';
// Real cookbook chat props contain intrinsic markup and a WeatherCard.
// Keep those children explicit JSON, without serializing executable functions.
const children={WeatherCard};
export function serializeIslandProps(value:any):any{
 if(React.isValidElement(value)){
  const type=value.type===React.Fragment?'fragment':typeof value.type==='string'?value.type:Object.entries(children).find(([,component])=>component===value.type)?.[0];
  if(!type)throw Error('Unregistered island child: '+(typeof value.type==='function'?value.type.name:String(value.type)));
  return {__aiReactNode:type,props:serializeIslandProps(value.props),key:value.key};
 }
 if(Array.isArray(value))return value.map(serializeIslandProps);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,child])=>[key,serializeIslandProps(child)]));
 if(typeof value==='function'||typeof value==='symbol')throw Error('Unregistered executable island prop');
 return value;
}
export function reviveIslandProps(value:any):any{
 if(React.isValidElement(value))return value;
 if(Array.isArray(value))return value.map(reviveIslandProps);
 if(value&&typeof value==='object'){
  if(value.__aiReactNode){
   if(typeof value.__aiReactNode!=='string'||(!/^[a-z][a-z0-9-]*$/.test(value.__aiReactNode)&&value.__aiReactNode!=='fragment'&&!Object.hasOwn(children,value.__aiReactNode)))throw Error('Unregistered maintained island child');
   const type=value.__aiReactNode==='fragment'?React.Fragment:children[value.__aiReactNode as keyof typeof children]??value.__aiReactNode;
   return React.createElement(type,{...reviveIslandProps(value.props),key:value.key});
  }
  return Object.fromEntries(Object.entries(value).map(([key,child])=>[key,reviveIslandProps(child)]));
 }
 return value;
}
