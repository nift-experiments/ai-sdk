from pathlib import Path
import os,subprocess,json,hashlib,time,shutil,sys
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT.parent
OUT=Path(os.environ.get('AI_SDK_VERIFICATION_OUTPUT', '/tmp/'+ROOT.name+'-lifecycle-body')).resolve();OUT.mkdir(parents=True,exist_ok=True)
NODE=os.environ.get('AI_SDK_NODE',shutil.which('node'));assert NODE, 'Node must be on PATH or AI_SDK_NODE set'
results=[]
def digest(root):
 return {str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for folder in ['public','runtime'] for p in sorted((root/folder).rglob('*')) if p.is_file()}
for project in [ROOT.name]:
 root=BASE/project;agent=project.endswith('-agent');env={**os.environ,'AI_SDK_NODE':NODE,'NODE_ENV':'production','PYTHONDONTWRITEBYTECODE':'1'}
 def build(case,force=False):
  start=time.perf_counter()
  with (OUT/(project+'-'+case+'.log')).open('w') as log:subprocess.run(['python3','scripts/build-content.py',*(['--force'] if force else [])],cwd=root,env=env,stdout=log,stderr=subprocess.STDOUT,check=True)
  return time.perf_counter()-start
 build('baseline');baseline=digest(root)
 maintained={}
 def save(relative):
  p=root/relative
  if relative not in maintained:
   maintained[relative]=p.read_bytes() if p.exists() else None
   dest=OUT/'immutable-inputs'/project/relative;dest.parent.mkdir(parents=True,exist_ok=True)
   if p.exists():dest.write_bytes(maintained[relative])
  return p
 def restore():
  for relative,value in maintained.items():
   p=root/relative
   if value is None:p.unlink(missing_ok=True)
   else:p.write_bytes(value)
 def compare(case,assertion=None):
  elapsed=build(case);inc=digest(root)
  if assertion:assertion()
  island_before=json.loads((root/'generated/islands-build.json').read_text())['key']
  force_elapsed=build(case+'-forced',True);forced=digest(root)
  differences=[p for p in set(inc)|set(forced) if inc.get(p)!=forced.get(p)]
  (OUT/(project+'-'+case+'-differences.json')).write_text(json.dumps(differences,indent=2))
  assert not differences,(project,case,differences[:12])
  row={'project':project,'case':case,'incremental_s':elapsed,'forced_s':force_elapsed,'incremental_forced_equal':True,'changed_files':sum(baseline.get(k)!=v for k,v in inc.items()),'retired_files':len(set(baseline)-set(inc))}
  results.append(row);(OUT/(project+'-body-proof.json')).write_text(json.dumps(results,indent=2)+'\n');print(json.dumps(row),flush=True)
  return island_before
 def finish():
  restore();build('restore-'+str(len(results)));actual=digest(root);different=[p for p in set(actual)|set(baseline) if actual.get(p)!=baseline.get(p)];assert not different,('restoration',project,different[:12]);maintained.clear()
 primary=json.loads((root/('content-pages.json' if agent else 'generated/content-source-map.json')).read_text());primary=primary if agent else primary['pages'];docs=[p for p in primary if p['version']=='v7' and p['family']=='docs'];intro=next(p for p in docs if p['route']=='/docs/introduction')
 try:
  for count in [1,10,100]:
   rows=[intro]+[p for p in docs if p['route']!=intro['route']][:count-1]
   key=json.loads((root/'generated/islands-build.json').read_text())['key']
   for row in rows:
    p=save(row['source']);marker='A9 lifecycle body fixture literal @content() $[title]'
    p.write_bytes(p.read_bytes()+ ('\n<p>'+marker+'</p>\n' if agent else '\n'+marker+'\n').encode())
   if agent:
    metadata=save('content-pages.json');records=json.loads(metadata.read_text());selected={row['route'] for row in rows}
    for record in records:
     if record['route'] in selected:record['structuredData']['contents'].append({'content':marker})
    metadata.write_text(json.dumps(records,indent=2)+'\n')
    for row in rows:
     reference=save('reference/markdown'+row['route']+'.md');original=reference.read_text();reference.write_text(original+'\n'+marker+'\n')
     llms=save('reference/discovery/llms.txt');text=llms.read_text();assert original.strip() in text;llms.write_text(text.replace(original.strip(),(original+'\n'+marker+'\n').strip(),1))
   compare('body-'+str(count),lambda:None)
   assert json.loads((root/'generated/islands-build.json').read_text())['key']==key,'Content edit rebuilt island graph'
   finish()
  # Metadata title update and removal are authoritative inputs in each source model.
  if agent:
   p=save('content-pages.json');data=json.loads(p.read_text());row=next(p for p in data if p['route']==intro['route']);row['metadata']['title']='A9 fixture metadata';row['metadata'].pop('description',None);p.write_text(json.dumps(data,indent=2)+'\n')
   reference=save('reference/markdown/docs/introduction.md');original=reference.read_text();updated=original.replace('title: AI SDK by Vercel','title: A9 fixture metadata');updated='\n'.join(line for line in updated.split('\n') if not line.startswith('description:'));reference.write_text(updated)
   llms=save('reference/discovery/llms.txt');text=llms.read_text();assert original.strip() in text;llms.write_text(text.replace(original.strip(),updated.strip(),1))

  else:
   p=save(intro['source']);s=p.read_text().replace('title: AI SDK by Vercel','title: A9 fixture metadata');s='\n'.join(line for line in s.split('\n') if not line.startswith('description:'));p.write_text(s)
  def meta_check():
   s=(root/'public/docs/introduction/index.html').read_text();assert '<title>A9 fixture metadata | AI SDK</title>' in s and '<meta name="description"' not in s
  compare('metadata-update-remove',meta_check);finish()
  p=save('ui/docs-chrome.tsx');s=p.read_text();assert 'containerProps={{className:' in s;p.write_text(s.replace('containerProps={{className:',"containerProps={{'data-a9-layout':'fixture',className:"));compare('shared-layout');finish()
  p=save('routes/redirects.json');data=json.loads(p.read_text());data.append({'source':'/a9-fixture-redirect','destination':'/docs/introduction','statusCode':307,'regex':'^/a9-fixture-redirect$','parameters':[]});p.write_text(json.dumps(data,indent=2)+'\n');compare('redirect',lambda:None);assert any(x['source']=='/a9-fixture-redirect' for x in json.loads((root/'runtime/redirects.json').read_text()));finish()
  p=save('ui/components/docs/text-generation.tsx');s=p.read_text();assert '\n        Answer\n' in s;p.write_text(s.replace('\n        Answer\n','\n        Answer A9 fixture\n'));compare('island-source');finish()
  # Historical and provider inputs exercise separate version/family search invalidation.
  for label,version,family in [('historical-version','v5','docs'),('provider-reference','v7','providers')]:
   row=next(p for p in primary if p['version']==version and p['family']==family);p=save(row['source']);p.write_bytes(p.read_bytes()+ ('\n<p>A9 '+label+' fixture</p>\n' if agent else '\nA9 '+label+' fixture\n').encode());compare(label);finish()
 except BaseException:
  restore()
  try:build('emergency-restoration')
  except Exception:pass
  raise
 print(project,'lifecycle completed; all changed inputs restored',flush=True)
