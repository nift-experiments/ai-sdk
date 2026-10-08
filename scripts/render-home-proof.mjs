import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();
await build({entryPoints:[root+'/ui/island-server.tsx'],outfile:root+'/generated/island-server.cjs',bundle:true,platform:'node',format:'cjs',external:['react','react/*','react-dom','react-dom/*'],alias:{'next/link':root+'/ui/adapters/link.tsx','next/navigation':root+'/ui/adapters/navigation.ts','next/image':root+'/ui/adapters/image.tsx'},tsconfig:root+'/tsconfig.json'});
const req=createRequire(import.meta.url);const {islandMarkup}=req(root+'/generated/island-server.cjs');
await mkdir(root+'/generated/home',{recursive:true});await writeFile(root+'/generated/home/hero.html','<div data-ai-island="HeroInteractive" data-ai-prefix="home-hero-">'+islandMarkup('HeroInteractive',{},'home-hero-')+'</div><script type="application/json">{}</script>');
