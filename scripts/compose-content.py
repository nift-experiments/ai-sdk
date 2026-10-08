"""Nift owns raw page composition; all prepared fragments have dependencies."""
from pathlib import Path
import json,html,time,subprocess,sys
root=Path(__file__).resolve().parents[1]
def changed(file,value):
 p=root/file;p.parent.mkdir(parents=True,exist_ok=True)
 if not p.exists() or p.read_text()!=value:p.write_text(value)
def raw(file):return '@dep('+json.dumps(file)+')$[rawHtml('+json.dumps(file)+')]'
start=time.perf_counter()
current=json.loads((root/'generated/content-pages.json').read_text())
base=json.loads((root/('proof-pages.json' if (root/'authored').exists() else 'generated/compose-pages.json')).read_text())
model=current+[page for page in base if page['route'] not in {x['route'] for x in current}]
islands=json.loads((root/'generated/islands-build.json').read_text());entry='/'+islands['entry'].removeprefix('public/')
head=(root/'templates/document-head.html').read_text()
head=head.replace('</head>',''.join('<link rel="stylesheet" href="/'+file.removeprefix('public/')+'"/>' for file in islands['outputs'] if file.endswith('.css'))+'</head>')
trees=json.loads((root/('generated/content-navigation.json' if (root/'authored').exists() else 'content-navigation.json')).read_text())
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
 if page in current and page.get('layout')!='global':
  tree=trees[page['navigationVersion']+'/'+page['family']];meta=page['metadata'];page_title=meta['title'];document_title=(section_label(tree,page['route']) or page_title) if page_title=='Overview' else page_title;title=str(document_title)+' | AI SDK';description=meta.get('description');canonical='https://ai-sdk.dev'+page['route'].replace('/resources/recipes/','/cookbook/')
  values='<title>'+html.escape(title)+'</title><link rel="canonical" href="'+html.escape(canonical,quote=True)+'"/><link rel="alternate" type="text/markdown" href="'+html.escape('https://ai-sdk.dev'+page['route']+'.md',quote=True)+'"/>'
  for attribute,key,value in [('name','description',description),('property','og:title',title),('property','og:description',description),('name','twitter:title',title),('name','twitter:description',description)]:
   if value is not None:values+='<meta '+attribute+'="'+key+'" content="'+html.escape(str(value),quote=True)+'"/>'
  slug=page['path'].removesuffix('.mdx').removesuffix('/index');image='https://ai-sdk.dev/og/'+slug+'/image.png'
  if page['navigationVersion']=='v7':
   for attribute,key in [('property','og:image'),('name','twitter:image')]:values+='<meta '+attribute+'="'+key+'" content="'+image+'"/>'
  else:values+='<meta name="robots" content="noindex, follow"/>'
  prefix=head.replace('__AI_METADATA__',values)+prefix
  suffix+='<script type="module" src="'+entry+'"></script><script src="/assets/body-controls.js" defer></script></body></html>'
  extra=['templates/document-head.html','generated/chrome-build.json',*(['content-pages.json','content-navigation.json'] if not (root/'authored').exists() else [])]
 elif page.get('layout')=='global':
  meta=page['metadata'];title=meta['title'].get('absolute') if isinstance(meta['title'],dict) else str(meta['title'])+' | AI SDK';description=meta.get('description','The TypeScript toolkit for building AI applications and agents.')
  values='<title>'+html.escape(title)+'</title>'
  canonical=meta.get('alternates',{}).get('canonical')
  if canonical:values+='<link rel="canonical" href="'+html.escape('https://ai-sdk.dev'+('' if canonical=='/' else canonical),quote=True)+'"/>'
  values+='<meta name="description" content="'+html.escape(description,quote=True)+'"/>'
  og=meta.get('openGraph',{});social_title=og.get('title',title);social_description=og.get('description',description)
  for attribute,key,value in [('property','og:title',social_title),('property','og:description',social_description),('name','twitter:title',social_title),('name','twitter:description',social_description)]:values+='<meta '+attribute+'="'+key+'" content="'+html.escape(str(value),quote=True)+'"/>'
  for attribute,key in [('property','og:image'),('name','twitter:image')]:
   images=og.get('images',[])
   if images:
    image=images[0];image=image.get('url') if isinstance(image,dict) else image
    if image.startswith('/'):image='https://ai-sdk.dev'+image
    values+='<meta '+attribute+'="'+key+'" content="'+html.escape(image,quote=True)+'"/>'
  if 'robots' in meta:values+='<meta name="robots" content="'+('index' if meta['robots'].get('index',True) else 'noindex')+', '+('follow' if meta['robots'].get('follow',True) else 'nofollow')+'"/>'
  prefix=head.replace('__AI_METADATA__',values)+prefix
  suffix+='<script type="module" src="'+entry+'"></script><script src="/assets/body-controls.js" defer></script></body></html>'
  extra=['templates/document-head.html','generated/chrome-build.json']
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
changed('generated/content-composition-metrics.json',json.dumps({'pages':len(model),'prepare_s':prepare,'nift_s':time.perf_counter()-build},indent=2)+'\n')
