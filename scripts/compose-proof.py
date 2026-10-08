"""A3 prototype: explicit raw composition of six representative pages."""
from pathlib import Path
import json,subprocess,time,sys,re,html
ROOT=Path(__file__).resolve().parents[1]
def changed(path,value):
 p=ROOT/path;p.parent.mkdir(parents=True,exist_ok=True)
 if not p.exists() or p.read_text()!=value:p.write_text(value)
def raw(path):return '@dep('+json.dumps(path)+')$[rawHtml('+json.dumps(path)+')]'
start=time.perf_counter()
model=json.loads((ROOT/'proof-pages.json').read_text())
islands=json.loads((ROOT/'generated/islands-build.json').read_text())
entry='/'+islands['entry'].removeprefix('public/')
metadata={}
if (ROOT/'generated/a3-render-results.json').exists() and (ROOT/'sources').exists():
 for row in json.loads((ROOT/'generated/a3-render-results.json').read_text()):metadata['sources/'+row['file']]=row['metadata']
tracked=[];owned=[]
for page in model:
 name=page['name']
 prefix=(ROOT/page['prefix']).read_text()
 meta=metadata.get(page['source'],page.get('metadata'))
 if meta is not None:
  title=html.escape(str(meta.get('title') or page['route'].split('/')[-1]),quote=True)
  description=meta.get('description')
  prefix=re.sub(r'(<h1[^>]*data-geistdocs-article="title"[^>]*>).*?(</h1>)',lambda m:m[1]+title+m[2],prefix,flags=re.S)
  prefix=re.sub(r'<title>.*?</title>','<title>'+title+' | AI SDK</title>',prefix,flags=re.S)
  def update_tag(match):
   tag=match[0]
   if re.search(r'(?:name|property)="(?:description|og:description|twitter:description)"',tag):
    return re.sub(r'content="[^"]*"','content="'+html.escape(str(description),quote=True)+'"',tag) if description is not None else ''
   if re.search(r'property="(?:og:title|twitter:title)"|name="twitter:title"',tag):return re.sub(r'content="[^"]*"','content="'+title+' | AI SDK"',tag)
   return tag
  prefix=re.sub(r'<meta\b[^>]*>',update_tag,prefix)
  prefix=re.sub(r'<p class="mb-8[^"<>]*">.*?</p>',('<p class="mb-8 text-lg text-gray-900">'+html.escape(str(description))+'</p>') if description is not None else '',prefix,flags=re.S)
 prefix_path='generated/prefix/'+name+'.html';changed(prefix_path,prefix)
 suffix=(ROOT/page['suffix']).read_text().replace('__AI_THEME__',(ROOT/'templates/theme.html').read_text()).replace('</body>','<script type="module" src="'+entry+'"></script><script src="/assets/site.js" defer></script></body>')
 suffix_path='generated/suffix/'+name+'.html';changed(suffix_path,suffix)
 deps=[page['source'],page['prefix'],page['suffix'],'proof-pages.json','templates/theme.html']
 wrapper=''.join('@dep('+json.dumps(x)+')' for x in deps)+raw(prefix_path)+raw(page['body'])+raw(suffix_path)
 changed('generated/wrappers/'+name+'.html',wrapper)
 tracked.append({'name':name,'title':page['route'],'template':'templates/raw.html'});owned.append('public/'+name+'.html')
changed('.nift/tracked.json',json.dumps({'tracked':tracked},indent=2)+'\n')
changed('templates/raw.html','@script { fn(rawHtml(path)) { f := file(path); f.open(); value := f.read_all(); f.close(); return value; } }@content')
config=json.loads((ROOT/'.nift/config.json').read_text());config['config']['content-dir']='generated/wrappers/';changed('.nift/config.json',json.dumps(config,indent=2)+'\n')
old=json.loads((ROOT/'generated/owned.json').read_text()) if (ROOT/'generated/owned.json').exists() else []
for retired in set(old)-set(owned):(ROOT/retired).unlink(missing_ok=True)
changed('generated/owned.json',json.dumps(owned,indent=2)+'\n')
prep=time.perf_counter()-start
run=time.perf_counter();subprocess.run(['nift','build',*(['--all'] if '--force' in sys.argv else [])],cwd=ROOT,check=True)
changed('generated/composition-metrics.json',json.dumps({'prepare_s':prep,'nift_s':time.perf_counter()-run,'pages':len(model)},indent=2)+'\n')
