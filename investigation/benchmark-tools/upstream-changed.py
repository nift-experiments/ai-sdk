"""One production publication per controlled input case, separate pinned checkout."""
from pathlib import Path
import subprocess,os,json,shutil,time,hashlib,psutil
base=Path(os.environ.get('AI_SDK_BENCHMARK_BASE','/tmp/ai-sdk-baseline')).resolve();B=base.parent;original=B/'ai-sdk-upstream';root=Path(os.environ.get('AI_SDK_UPSTREAM_CHANGED_CHECKOUT',str(B/'ai-sdk-upstream-changed'))).resolve();app=root/'apps/docs';out=base/'benchmarks/optimized-changed-upstream';out.mkdir(parents=True,exist_ok=True)
node=base/'toolchain/node-v24.21.0-linux-x64/bin/node';pnpm=base/'toolchain/pnpm/package/bin/pnpm.cjs'
if not root.exists():subprocess.run(['git','clone','--shared',str(original),str(root)],check=True)
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()=='3ebefff610f96892c50be48cf1838c453e2349f7'
modules=app/'node_modules';assert (root/'node_modules/.modules.yaml').exists(), 'Install the frozen documentation dependencies in this isolated checkout first'
cache=modules/'.cache/ai-sdk-docs';cache.mkdir(parents=True,exist_ok=True)
for sha in ['0fb3a2241334c3e9df9aa15c86cb26c1cee9ba3a','239ea3a151f81aa55b78d8eeca5fd20555730de5']:
 if not(cache/sha).exists():shutil.copytree(original/'apps/docs/node_modules/.cache/ai-sdk-docs'/sha,cache/sha)
snapshot=out/'pristine-application-state';snapshot.mkdir(exist_ok=True)
for name in ['.next','.source','content']:
 if not(snapshot/name).exists():shutil.copytree(original/'apps/docs'/name,snapshot/name)
env={**os.environ,'PATH':str(node.parent)+':'+os.environ['PATH'],'NODE_ENV':'production','NEXT_TELEMETRY_DISABLED':'1','NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL':'https://ai-sdk.dev','NODE_OPTIONS':'--dns-result-order=ipv4first --require='+str(base/'frozen-images.cjs')}
for key in ['AI_GATEWAY_API_KEY','MXBAI_API_KEY','MXBAI_STORE_ID','GEISTDOCS_CHAT_PROXY_URL','GEISTDOCS_CHAT_PROXY_TOKEN','GEISTDOCS_CHAT_SECRET']:env.pop(key,None)
if not(out/'warm-state-prepared.json').exists():
 for name in ['.next','.source','content']:
  shutil.rmtree(app/name,ignore_errors=True)
 with (out/'unmeasured-warmup.log').open('w') as log:subprocess.run([str(node),str(pnpm),'--dir','apps/docs','build:site'],cwd=root,env=env,stdout=log,stderr=subprocess.STDOUT,check=True)
 for name in ['.next','.source','content']:
  shutil.rmtree(snapshot/name);shutil.copytree(app/name,snapshot/name)
 (out/'warm-state-prepared.json').write_text(json.dumps({'command':'pnpm --dir apps/docs build:site','reason':'Prepare cache in this isolated checkout so paths match; not a benchmark sample'})+'\n')
case_state=snapshot
rows=[];inputs={}
def save(path):
 path=Path(path)
 if path not in inputs:
  inputs[path]=path.read_bytes() if path.exists() else None;backup=out/'immutable-inputs'/path.relative_to(root);backup.parent.mkdir(parents=True,exist_ok=True)
  if path.exists():backup.write_bytes(inputs[path])
 return path
def restore():
 for path,value in inputs.items():
  if value is None:path.unlink(missing_ok=True)
  else:path.write_bytes(value)
 inputs.clear()
def measure(case,assertion=None):
 for name in ['.next','.source','content']:
  shutil.rmtree(app/name,ignore_errors=True);shutil.copytree(case_state/name,app/name)
 target=out/case;target.mkdir(exist_ok=True);start=time.perf_counter();peak=0;samples=0
 with (target/'build.log').open('w') as log:
  child=subprocess.Popen(['/usr/bin/time','-v','-o',str(target/'whole.time'),str(node),str(pnpm),'--dir','apps/docs','build:site'],cwd=root,env=env,stdout=log,stderr=subprocess.STDOUT);parent=psutil.Process(child.pid)
  while child.poll() is None:
   try:members=[parent,*parent.children(recursive=True)]
   except psutil.NoSuchProcess:members=[]
   rss=0
   for member in members:
    try:rss+=member.memory_info().rss
    except(psutil.NoSuchProcess,psutil.AccessDenied):pass
   peak=max(peak,rss);samples+=1;time.sleep(.05)
  assert child.wait()==0,('upstream changed build failed',case)
 elapsed=time.perf_counter()-start
 if assertion:assertion()
 import re
 memory=int(re.search(r'Maximum resident set size \(kbytes\): (\d+)',(target/'whole.time').read_text())[1]);row={'project':'upstream','case':case,'elapsed_s':elapsed,'maximum_process_phase_rss_kib':memory,'sampled_peak_sum_rss_bytes':peak,'memory_samples':samples,'command':'pnpm --dir apps/docs build:site','application_state':'copied pristine warm application cache before each measured edit; package/OS caches retained','source_head':'3ebefff610f96892c50be48cf1838c453e2349f7'};rows.append(row);(out/'samples.json').write_text(json.dumps(rows,indent=2)+'\n');print(json.dumps(row),flush=True)
primary=json.loads((B/'ai-sdk/generated/content-source-map.json').read_text())['pages'];docs=[row for row in primary if row['version']=='v7' and row['family']=='docs'];intro=next(row for row in docs if row['route']=='/docs/introduction')
def source(row):return root/'content'/row['source'].split('/v7/',1)[1]
try:
 for count in [1,10,100]:
  for row in ([intro]+[row for row in docs if row['route']!=intro['route']])[:count]:
   p=save(source(row));p.write_bytes(p.read_bytes()+b'\nA9 lifecycle body fixture literal @content() $[title]\n')
  measure('body-'+str(count));restore()
 p=save(source(intro));s=p.read_text().replace('title: AI SDK by Vercel','title: A9 fixture metadata');s='\n'.join(line for line in s.split('\n') if not line.startswith('description:'));p.write_text(s);measure('metadata-update-remove');restore()
 p=save(app/'app/[lang]/layout.tsx');s=p.read_text();assert '<body>' in s;p.write_text(s.replace('<body>','<body data-a9-layout="fixture">'));measure('shared-layout');restore()
 row=next(row for row in docs if '/00-introduction/' not in row['source']);old=save(source(row));new=save(old.with_name('999-'+old.name.split('-',1)[-1]));old.rename(new);measure('navigation-order');restore()
 row=next(row for row in primary if row['version']=='v5' and row['family']=='docs');p=save(cache/'239ea3a151f81aa55b78d8eeca5fd20555730de5/content'/row['source'].split('/v5/',1)[1]);p.write_bytes(p.read_bytes()+b'\nA9 historical-version fixture\n');measure('historical-version');restore()
 row=next(row for row in primary if row['version']=='v7' and row['family']=='providers');p=save(source(row));p.write_bytes(p.read_bytes()+b'\nA9 provider-reference fixture\n');measure('provider-reference');restore()
 p=save(app/'next.config.ts');s=p.read_text();assert 'redirects: () => [' in s;p.write_text(s.replace('redirects: () => [',"redirects: () => [{source:'/a9-fixture-redirect',destination:'/docs/introduction',permanent:false},"));measure('redirect');restore()
 p=save(app/'components/docs/text-generation.tsx');s=p.read_text();assert '\n        Answer\n' in s;p.write_text(s.replace('\n        Answer\n','\n        Answer A9 fixture\n'));measure('island-source');restore()
 # Each lifecycle case begins from pristine production state. Rename and delete
 # fixtures start with the old route already in that state's source/output.
 p=save(root/'content/docs/99-a9-lifecycle.mdx');p.write_text('---\ntitle: A9 lifecycle fixture\ndescription: Route lifecycle test\n---\n\nA9 fixture content\n')
 def routes():return json.loads((app/'.next/prerender-manifest.json').read_text())['routes']
 measure('route-add',lambda:None);assert '/en/docs/a9-lifecycle' in routes();assert '/en/llms.mdx/a9-lifecycle' in routes()
 # Snapshot the successful added-route cache as the warm state for rename.
 case_state=out/'added-route-application-state';case_state.mkdir(exist_ok=True)
 for name in ['.next','.source','content']:shutil.copytree(app/name,case_state/name,dirs_exist_ok=True)
 new=save(root/'content/docs/99-a9-lifecycle-renamed.mdx');p.rename(new);measure('route-rename');assert '/en/docs/a9-lifecycle' not in routes() and '/en/docs/a9-lifecycle-renamed' in routes();assert '/en/llms.mdx/a9-lifecycle' not in routes() and '/en/llms.mdx/a9-lifecycle-renamed' in routes()
 case_state=out/'renamed-route-application-state';case_state.mkdir(exist_ok=True)
 for name in ['.next','.source','content']:shutil.copytree(app/name,case_state/name,dirs_exist_ok=True)
 new.unlink();measure('route-delete');assert '/en/docs/a9-lifecycle-renamed' not in routes();assert '/en/llms.mdx/a9-lifecycle-renamed' not in routes();restore()
finally:
 restore();assert subprocess.check_output(['git','status','--porcelain'],cwd=root,text=True).strip()==''
print('Upstream controlled input campaign complete; pinned source checkout untouched',flush=True)
