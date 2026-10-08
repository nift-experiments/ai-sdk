import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
export function chromeBuildOptions(root){
 const alias=Object.fromEntries(['link','navigation','image','error','script'].map(name=>['next/'+name,path.join(root,'ui/adapters/'+name+(name==='navigation'?'.ts':'.tsx'))]));
 alias['@vercel/analytics/react']=path.join(root,'ui/adapters/analytics.ts');
 // Four corpus-required UI modules lack public exports in the pinned package.
 // Keep this coupling explicit and confined here; no framework server imports.
 const require=createRequire(path.join(root,'package.json'));
 const directory=path.dirname(require.resolve('@vercel/geistdocs/config'));
 for(const name of ['page-actions-client','page-breadcrumb','page-footer','table-of-contents'])alias['@migration/'+name]=path.join(directory,'internal',name+'.js');
 const plugins=[{name:'migration-transport-and-maintained-fonts',setup(build){
  build.onLoad({filter:/geistdocs\/dist\/internal\/feedback-action\.js$/},async()=>({contents:await readFile(path.join(root,'ui/adapters/feedback.ts'),'utf8'),loader:'ts',resolveDir:root}));
  // This unused barrel export would otherwise execute Next font compilers.
  // The accepted CSS and font bytes are already maintained static assets.
  build.onLoad({filter:/geistdocs\/dist\/providers\/public\/core\/fonts\.js$/},()=>({contents:"export const geistFontClasses='';",loader:'js'}));
 }}];
 return {alias,plugins,define:{'process.env.NODE_ENV':JSON.stringify('production'),'process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL':JSON.stringify('ai-sdk.dev')}};
}
