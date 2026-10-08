import {LandingPage} from './components/home/landing-page';
import React from 'react';
import Resources,{metadata as resourcesMetadata} from '../authored/pages/resources/page';
import Tools,{metadata as toolsMetadata} from '../authored/pages/resources/tools/page';
import Tool,{generateMetadata as toolMetadata} from '../authored/pages/resources/tools/[slug]/page';
import Templates,{metadata as templatesMetadata} from '../authored/pages/resources/templates/page';
import Showcase,{metadata as showcaseMetadata} from '../authored/pages/resources/showcase/page';
import Gateway,{metadata as gatewayMetadata} from '../authored/pages/unauthenticated-ai-gateway/page';
import {RecipesLanding} from './components/recipes/recipes-landing';
import {prepareHighlighter} from './components/resources/highlighted-code';
import {Island} from './island-boundary';import {tools} from './lib/tools-registry';import {socialCard} from './lib/og';
export async function ancillaryPages(){
 await prepareHighlighter();
 const pages=[{route:'/',element:<LandingPage/>,metadata:{title:{absolute:'AI SDK'},description:'A unified TypeScript SDK for building AI apps with modern streaming, fallbacks, and multi-model support—powered by Vercel.',alternates:{canonical:'/'},openGraph:{title:'AI SDK',images:['https://e742qlubrjnjqpp0.public.blob.vercel-storage.com/og.png']}}},{route:'/resources',element:<Resources/>,metadata:resourcesMetadata},{route:'/resources/tools',element:<Tools/>,metadata:toolsMetadata},{route:'/resources/templates',element:<Templates/>,metadata:templatesMetadata},{route:'/resources/showcase',element:<Showcase/>,metadata:showcaseMetadata},{route:'/unauthenticated-ai-gateway',element:<Gateway/>,metadata:gatewayMetadata},{route:'/playground-recovery',element:<Island name="PlaygroundRecovery" input={{}}/>,metadata:{title:'Recover your playground settings',robots:{index:false,follow:false}}}];
 for(const tool of tools){const params=Promise.resolve({slug:tool.slug});pages.push({route:'/resources/tools/'+tool.slug,element:await Tool({params}),metadata:await toolMetadata({params})});}
 for(const version of ['v7','v6','v5'] as const){const prefix=version==='v7'?'':'/'+version;const title='AI SDK Recipes',description='Open-source recipes, guides, and examples for building with the AI SDK.';pages.push({route:prefix+'/resources/recipes',element:<RecipesLanding version={version} versionPrefix={prefix}/>,metadata:{title,description,...(version==='v7'?{alternates:{canonical:'/resources/recipes'},...socialCard(title,description)}:{robots:{index:false,follow:true}})}});}
 return pages;
}
