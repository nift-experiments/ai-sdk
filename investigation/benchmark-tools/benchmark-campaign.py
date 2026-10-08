"""Serialized production publications; immutable A1 archives are never changed."""
from pathlib import Path
import os,sys,json,time,subprocess,re,hashlib,statistics,shutil,psutil
base=Path(os.environ['AI_SDK_BENCHMARK_BASE']).resolve();work=base.parent;label=sys.argv[1];out=base/'benchmarks'/label;out.mkdir(parents=True,exist_ok=True)
node=base/'toolchain/node-v24.21.0-linux-x64/bin/node';pnpm=base/'toolchain/pnpm/package/bin/pnpm.cjs'
env={**os.environ,'PATH':str(base/'toolchain/nift-v4.8.0')+':'+str(node.parent)+':'+os.environ['PATH'],'AI_SDK_NODE':str(node),'NODE_ENV':'production','NEXT_TELEMETRY_DISABLED':'1','NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL':'https://ai-sdk.dev'}
for k in ['AI_GATEWAY_API_KEY','MXBAI_API_KEY','MXBAI_STORE_ID','GEISTDOCS_CHAT_PROXY_URL','GEISTDOCS_CHAT_PROXY_TOKEN','GEISTDOCS_CHAT_SECRET']:env.pop(k,None)
rows=[];resultfile=out/'samples.json'
if resultfile.exists():rows=json.loads(resultfile.read_text())
def archive(path,dest):
 if path.exists():dest.parent.mkdir(parents=True,exist_ok=True);path.rename(dest)
def fresh(project,root,target):
 backup=target/'fresh-state';backup.mkdir(parents=True,exist_ok=True)
 if project=='upstream':
  for name in ['.next','.source','content']:archive(root/'apps/docs'/name,backup/name)
 else:
  # Only generated directories and manifest-owned publication files. Authored,
  # rendered, reference and maintained public asset sources are retained.
  owned=json.loads((root/'generated/owned.json').read_text()) if (root/'generated/owned.json').exists() else []
  surfaces=json.loads((root/'runtime/surfaces.json').read_text()) if (root/'runtime/surfaces.json').exists() else {}
  files=owned+['public'+p+'.md' for p in surfaces.get('markdown',[])]+['public'+p['route'] for p in surfaces.get('discovery',[])]+['public/sitemap.xml','public/robots.txt']
  for name in files:archive(root/name,backup/name)
  for name in ['generated','runtime','public/assets/islands','public/assets/chrome','.nift/public']:archive(root/name,backup/name)
 # Recovery snapshots live outside repositories; no global package/OS cache reset.
def counts(root,project):
 paths=[root/'apps/docs/.next',root/'apps/docs/public'] if project=='upstream' else [root/'public',root/'runtime']
 return [{'directory':str(p.relative_to(root)),'files':sum(x.is_file()for x in p.rglob('*')),'bytes':sum(x.stat().st_size for x in p.rglob('*')if x.is_file())}for p in paths]
for mode in ['warm-full','fresh-application-state','unchanged-cached']:
 for sample in range(1,6):
  projects=['upstream','ai-sdk','ai-sdk-agent'];projects=projects[(sample-1)%3:]+projects[:(sample-1)%3]
  for project in projects:
   if any(r['project']==project and r['mode']==mode and r['sample']==sample for r in rows):continue
   root=work/('ai-sdk-upstream' if project=='upstream' else project);target=out/f'{mode}-{sample}-{project}';target.mkdir(parents=True,exist_ok=True)
   if mode=='fresh-application-state':fresh(project,root,target)
   runenv=env.copy()
   if project=='upstream':
    active=base/'upstream-phase-active';active.mkdir(exist_ok=True)
    for stale in active.glob('*.json'):stale.unlink()
    runenv['AI_SDK_UPSTREAM_PHASE_DIR']=str(active);runenv['NODE_OPTIONS']='--dns-result-order=ipv4first --require='+str(base/'upstream-benchmark-preload.cjs');command=[str(node),str(pnpm),'--dir','apps/docs','build:site']
   else:
    runenv['AI_SDK_PHASE_MEASUREMENTS']=str(target/'phases');command=['python3','scripts/build-content.py',*(['--force']if mode!='unchanged-cached'else[])]
   print(json.dumps({'event':'start','project':project,'mode':mode,'sample':sample}),flush=True);start=time.perf_counter()
   peak_sum_rss=0;memory_samples=0
   with (target/'build.log').open('w')as log:
    completed=subprocess.Popen(['/usr/bin/time','-v','-o',str(target/'whole.time'),*command],cwd=root,env=runenv,stdout=log,stderr=subprocess.STDOUT)
    process=psutil.Process(completed.pid)
    while completed.poll() is None:
     rss=0
     try:members=[process,*process.children(recursive=True)]
     except psutil.NoSuchProcess:members=[]
     for member in members:
      try:rss+=member.memory_info().rss
      except (psutil.NoSuchProcess,psutil.AccessDenied):pass
     peak_sum_rss=max(peak_sum_rss,rss);memory_samples+=1;time.sleep(.05)
    completed.wait()
   elapsed=time.perf_counter()-start;match=re.search(r'Maximum resident set size \(kbytes\): (\d+)',(target/'whole.time').read_text());row={'project':project,'mode':mode,'sample':sample,'elapsed_s':elapsed,'maximum_process_phase_rss_kib':int(match.group(1))if match else None,'sampled_peak_sum_rss_bytes':peak_sum_rss,'memory_samples':memory_samples,'sampled_memory_method':'50 ms sum of live driver descendants RSS; shared pages may be counted multiple times; sampled, not exact OS peak','exit_code':completed.returncode,'command':command,'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'output':counts(root,project)}
   if project=='upstream':
    shutil.copytree(active,target/'upstream-phases',dirs_exist_ok=True)
   if project=='upstream':row['phases']=[json.loads(p.read_text())for p in sorted((target/'upstream-phases').glob('*.json'))];row['cli_stage_overhead_residual_s']=elapsed-sum(p.get('elapsed_s',0)for p in row['phases']);assert len(row['phases'])==3 and len({p['stage'] for p in row['phases']})==3 and all(p.get('exit_code')==0 for p in row['phases']), 'Missing or duplicated upstream CLI phase measurements'
   if project!='upstream'and (root/'generated/content-pipeline-phases.json').exists():row['phases']=json.loads((root/'generated/content-pipeline-phases.json').read_text());shutil.copyfile(root/'generated/content-composition-metrics.json',target/'nift-composition.json')
   rows.append(row);resultfile.write_text(json.dumps(rows,indent=2)+'\n');print(json.dumps({'event':'finished',**{k:row[k]for k in ['project','mode','sample','elapsed_s','maximum_process_phase_rss_kib','exit_code']}}),flush=True)
   if completed.returncode:raise SystemExit(completed.returncode)
summary=[]
for project in ['upstream','ai-sdk','ai-sdk-agent']:
 for mode in ['warm-full','fresh-application-state','unchanged-cached']:
  data=[r for r in rows if r['project']==project and r['mode']==mode];values=[r['elapsed_s']for r in data];memory=[r['maximum_process_phase_rss_kib']/1024 for r in data];summary.append({'project':project,'mode':mode,'samples':len(data),'median_s':statistics.median(values),'min_s':min(values),'max_s':max(values),'median_maximum_process_phase_rss_mib':statistics.median(memory),'rss_min_mib':min(memory),'rss_max_mib':max(memory)})
(out/'summary.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps(summary,indent=2),flush=True)
