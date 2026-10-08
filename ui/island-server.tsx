import React from 'react';
import {renderToString} from 'react-dom/server';
import {islands} from './islands';
export function islandMarkup(name:keyof typeof islands,props:Record<string,unknown>,identifierPrefix:string){
  const Component=islands[name];
  return renderToString(React.createElement(Component as any,props),{identifierPrefix});
}
