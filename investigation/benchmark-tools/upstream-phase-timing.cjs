// Optional measurement only: observe the three real production CLI stages.
// Do not alter their argv, behavior, dependency graph or outputs.
const fs=require('node:fs'),path=require('node:path');
const entry=(process.argv[1]||'').replaceAll('\\','/');let stage;
if(entry.endsWith('/scripts/sync-content.mjs'))stage='content-version-synchronization';
else if(/\/fumadocs-mdx\/(?:dist\/)?bin\.js$/.test(entry))stage='fumadocs-mdx-generation';
else if(/\/next\/dist\/bin\/next$/.test(entry)&&process.argv[2]==='build')stage='next-production-build';
if(stage&&require('node:worker_threads').isMainThread&&process.env.AI_SDK_UPSTREAM_PHASE_DIR){
 const folder=process.env.AI_SDK_UPSTREAM_PHASE_DIR;fs.mkdirSync(folder,{recursive:true});
 const start=process.hrtime.bigint(),file=path.join(folder,stage+'-'+process.pid+'.json');
 const record={stage,pid:process.pid,start_utc:new Date().toISOString(),scope:'CLI wall time after measurement preload, including its child work; CLI RSS is individual process only; startup/shell/package-manager residual remains in complete pipeline'};
 fs.writeFileSync(file,JSON.stringify(record)+'\n');
 process.on('exit',code=>{fs.writeFileSync(file,JSON.stringify({...record,elapsed_s:Number(process.hrtime.bigint()-start)/1e9,exit_code:code,cli_maximum_rss_kib:process.resourceUsage().maxRSS})+'\n');});
}
