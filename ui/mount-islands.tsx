import React from 'react';
import {hydrateRoot} from 'react-dom/client';
import {reviveIslandProps} from './island-props';
import {islands} from './islands';
for(const host of document.querySelectorAll<HTMLElement>('[data-ai-island]')){
  const Component=islands[host.dataset.aiIsland as keyof typeof islands];
  if(!Component) throw new Error(`Unknown AI SDK island: ${host.dataset.aiIsland}`);
  const input=host.nextElementSibling;
  if(input?.tagName!=='SCRIPT'||input.getAttribute('type')!=='application/json') throw new Error('Missing island props');
  hydrateRoot(host,React.createElement(Component,reviveIslandProps(JSON.parse(input.textContent||'{}'))),{identifierPrefix:host.dataset.aiPrefix});
}
