"""Nift owns raw page composition; all prepared fragments have dependencies."""
from pathlib import Path
import json,html,time,subprocess,sys
root=Path(__file__).resolve().parents[1]
def changed(file,value):
 p=root/file;p.parent.mkdir(parents=True,exist_ok=True)
 if not p.exists() or p.read_text()!=value:p.write_text(value)
def raw(file):return '@dep('+json.dumps(file)+')$[rawHtml('+json.dumps(file)+')]'
start=time.perf_counter()
current=json.loads((root/'generated/docs-pages.json').read_text())
base=json.loads((root/('proof-pages.json' if (root/'authored').exists() else 'generated/compose-pages.json')).read_text())
model=current+[page for page in base if page['route'] not in {x['route'] for x in current}]
islands=json.loads((root/'generated/islands-build.json').read_text());entry='/'+islands['entry'].removeprefix('public/')
head=(root/'templates/document-head.html').read_text()
trees=json.loads((root/('generated/docs-navigation.json' if (root/'authored').exists() else 'docs-navigation.json')).read_text())
def section_label(node,url):
 if node.get('index',{}).get('url','').rstrip('/')==url.rstrip('/'):return node.get('name')
 if node.get('fallback'):
  found=section_label(node['fallback'],url)
  if found is not None:return found
 for child in node.get('children',[]):
  if child.get('type')=='page' and child.get('url','').rstrip('/')==url.rstrip('/'):return node.get('name')
  found=section_label(child,url)
  if found is not None:return found
 return None
tracked=[];owned=[]
for page in model:
 name=page['name'];prefix=(root/page['prefix']).read_text();suffix=(root/page['suffix']).read_text()
 if page in current:
  tree=trees[page['navigationVersion']];meta=page['metadata'];page_title=meta['title'];document_title=(section_label(tree,page['route']) or page_title) if page_title=='Overview' else page_title;title=str(document_title)+' | AI SDK';description=meta.get('description');canonical='https://ai-sdk.dev'+page['route']
  values='<title>'+html.escape(title)+'</title><link rel="canonical" href="'+html.escape(canonical,quote=True)+'"/><link rel="alternate" type="text/markdown" href="'+html.escape(canonical+'.md',quote=True)+'"/>'
  for attribute,key,value in [('name','description',description),('property','og:title',title),('property','og:description',description),('name','twitter:title',title),('name','twitter:description',description)]:
   if value is not None:values+='<meta '+attribute+'="'+key+'" content="'+html.escape(str(value),quote=True)+'"/>'
  slug=page['route'].removeprefix('/docs/') if page['navigationVersion']=='v7' else page['route'].lstrip('/');image='https://ai-sdk.dev/og/'+slug+'/image.png'
  if page['navigationVersion']=='v7':
   for attribute,key in [('property','og:image'),('name','twitter:image')]:values+='<meta '+attribute+'="'+key+'" content="'+image+'"/>'
  else:values+='<meta name="robots" content="noindex, follow"/>'
  prefix=head.replace('__AI_METADATA__',values)+prefix
  suffix+='<script type="module" src="'+entry+'"></script><script src="/assets/body-controls.js" defer></script></body></html>'
  extra=['templates/document-head.html','generated/chrome-build.json',*(['docs-pages.json','docs-navigation.json'] if not (root/'authored').exists() else [])]
 else:
  suffix=suffix.replace('__AI_THEME__',(root/'templates/theme.html').read_text()).replace('</body>','<script type="module" src="'+entry+'"></script><script src="/assets/site.js" defer></script></body>')
  extra=['proof-pages.json','templates/theme.html']
 prefix_file='generated/publication-prefix/'+name+'.html';suffix_file='generated/publication-suffix/'+name+'.html'
 changed(prefix_file,prefix);changed(suffix_file,suffix)
 deps=[page['source'],page['prefix'],page['suffix'],*extra]
 wrapper=''.join('@dep('+json.dumps(x)+')' for x in deps)+raw(prefix_file)+raw(page['body'])+raw(suffix_file)
 changed('generated/wrappers/'+name+'.html',wrapper)
 tracked.append({'name':name,'title':page['route'],'template':'templates/raw.html'});owned.append('public/'+name+'.html')
changed('.nift/tracked.json',json.dumps({'tracked':tracked},indent=2)+'\n')
old=json.loads((root/'generated/owned.json').read_text()) if (root/'generated/owned.json').exists() else []
for retired in set(old)-set(owned):(root/retired).unlink(missing_ok=True)
changed('generated/owned.json',json.dumps(owned,indent=2)+'\n')
prepare=time.perf_counter()-start;build=time.perf_counter()
subprocess.run(['nift','build',*(['--all'] if '--force' in sys.argv else [])],cwd=root,check=True)
changed('generated/docs-composition-metrics.json',json.dumps({'pages':len(model),'prepare_s':prepare,'nift_s':time.perf_counter()-build},indent=2)+'\n')
