from pathlib import Path
import os,subprocess,json,hashlib,time,shutil,sys
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT.parent
OUT=Path(os.environ.get('AI_SDK_VERIFICATION_OUTPUT', '/tmp/'+ROOT.name+'-lifecycle-routes')).resolve();OUT.mkdir(parents=True,exist_ok=True)
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
  results.append(row);(OUT/(project+'-routes-proof.json')).write_text(json.dumps(results,indent=2)+'\n');print(json.dumps(row),flush=True)
  return island_before
 def finish():
  restore();build('restore-'+str(len(results)));actual=digest(root);different=[p for p in set(actual)|set(baseline) if actual.get(p)!=baseline.get(p)];assert not different,('restoration',project,different[:12]);maintained.clear()
 primary=json.loads((root/('content-pages.json' if agent else 'generated/content-source-map.json')).read_text());primary=primary if agent else primary['pages'];docs=[p for p in primary if p['version']=='v7' and p['family']=='docs'];intro=next(p for p in docs if p['route']=='/docs/introduction')
 try:
  # Change navigation ordering without changing route identity.
  if agent:
   p=save('content-navigation.json');trees=json.loads(p.read_text());trees['v7/docs']['children'][0],trees['v7/docs']['children'][1]=trees['v7/docs']['children'][1],trees['v7/docs']['children'][0];p.write_text(json.dumps(trees,indent=2)+'\n')
  else:
   row=next(p for p in docs if p['source'].endswith('.mdx') and '/00-introduction/' not in p['source']);old=save(row['source']);new=save(str(Path(row['source']).with_name('999-'+Path(row['source']).name.split('-',1)[-1])));new.parent.mkdir(parents=True,exist_ok=True);old.rename(new)
  compare('navigation-order');finish()
  # Keep each model's actual reference sources authoritative during route lifecycle.
  route='/docs/a9-lifecycle';oldroute=None
  def agent_route(action):
   global oldroute
   pagesfile=save('content-pages.json');pages=json.loads(pagesfile.read_text());projectionsfile=save('projection-pages.json');projections=json.loads(projectionsfile.read_text());navfile=save('content-navigation.json');nav=json.loads(navfile.read_text())
   if action=='add':
    row={**intro,'route':route,'name':route.lstrip('/')+'/index','source':'rendered/v7/docs/a9-lifecycle.html','body':'rendered/v7/docs/a9-lifecycle.html','path':'a9-lifecycle.mdx','metadata':{'title':'A9 lifecycle fixture','description':'Route lifecycle test'},'toc':[],'structuredData':{'headings':[],'contents':[{'heading':None,'content':'A9 fixture content'}]}};pages.append(row);save(row['source']).write_text('<p>A9 fixture content</p>\n');projections.append({'route':route,'version':'v7','family':'docs','source':'reference/markdown'+route+'.md','file':'generated/projections'+route+'.md'});save('reference/markdown'+route+'.md').write_text('# A9 lifecycle fixture\n\nA9 fixture content\n');nav['v7/docs']['children'].append({'type':'page','name':'A9 lifecycle fixture','url':route})
   else:
    row=next(p for p in pages if p['route']==oldroute);projection=next(p for p in projections if p['route']==oldroute)
    if action=='rename':
     old=save(row['source']);newpath='rendered/v7/docs/a9-lifecycle-renamed.html';new=save(newpath);old.rename(new);row.update(route=route,name=route.lstrip('/')+'/index',source=newpath,body=newpath,path='a9-lifecycle-renamed.mdx');old=save(projection['source']);newpath='reference/markdown'+route+'.md';new=save(newpath);old.rename(new);projection.update(route=route,source=newpath,file='generated/projections'+route+'.md')
     for node in nav['v7/docs']['children']:
      if node.get('url')==oldroute:node['url']=route
    else:
     save(row['source']).unlink();save(projection['source']).unlink();pages.remove(row);projections.remove(projection);nav['v7/docs']['children']=[node for node in nav['v7/docs']['children'] if node.get('url')!=oldroute]
   pagesfile.write_text(json.dumps(pages,indent=2)+'\n');projectionsfile.write_text(json.dumps(projections,indent=2)+'\n');navfile.write_text(json.dumps(nav,indent=2)+'\n')
   for relative in ['reference/discovery/llms.txt','reference/discovery/sitemap.md']:
    p=save(relative);s=p.read_text()
    if action=='add':s+='\n# A9 lifecycle fixture\n\n[A9 fixture]('+route+')\n\nA9 fixture content\n'
    elif action=='rename':s=s.replace(oldroute,route)
    else:s=maintained[relative].decode()
    p.write_text(s)
  source='authored/v7/docs/99-a9-lifecycle.mdx'
  for action in ['add','rename','delete']:
   if action=='rename':oldroute=route;route='/docs/a9-lifecycle-renamed'
   if action=='delete':oldroute=route
   if agent:agent_route(action)
   elif action=='add':save(source).write_text('---\ntitle: A9 lifecycle fixture\ndescription: Route lifecycle test\n---\n\nA9 fixture content\n')
   elif action=='rename':old=save(source);source='authored/v7/docs/99-a9-lifecycle-renamed.mdx';new=save(source);old.rename(new)
   else:save(source).unlink()
   def retirement():
    target=root/'public'/(route.lstrip('/')+'/index.html');markdown=root/'public'/(route.lstrip('/')+'.md')
    assert target.exists()==(action!='delete') and markdown.exists()==(action!='delete'),('route existence',action)
    if oldroute:
     assert not (root/'public'/(oldroute.lstrip('/')+'/index.html')).exists() and not (root/'public'/(oldroute.lstrip('/')+'.md')).exists(),('old route retirement',oldroute)
   compare('route-'+action,retirement)
  finish()
 except BaseException:
  restore()
  try:build('emergency-restoration')
  except Exception:pass
  raise
 print(project,'navigation and route lifecycle completed; all changed inputs restored',flush=True)
