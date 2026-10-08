from pathlib import Path
from bs4 import BeautifulSoup
import json,re,sys,urllib.parse
root=Path(sys.argv[1]);pages=json.loads((root/'generated/content-pages.json').read_text());rules=json.loads((root/'routes/redirects.json').read_text());assets=set();redirects={};missing={}
def classify(url,origin):
 if not url.startswith('/') or url.startswith('//'):return
 path=urllib.parse.unquote(urllib.parse.urlsplit(url).path)
 if not path:return
 candidates=[root/'public'/path.lstrip('/'),root/'public'/path.lstrip('/')/'index.html']
 if any(p.is_file() for p in candidates):assets.add(path);return
 if path.startswith('/og/') or path=='/api/search':return
 for rule in rules:
  if rule.get('has'):continue
  if re.match(rule['regex'],path):redirects[path]={'source':rule['source'],'destination':rule['destination']};return
 missing.setdefault(path,[]).append(origin)
for p in pages:
 soup=BeautifulSoup((root/'public'/(p['name']+'.html')).read_text(),'html.parser')
 for tag in soup.find_all(True):
  for key in ['src','href','poster']:
   if tag.get(key):classify(tag[key],p['route'])
for file in (root/'public').rglob('*.css'):
 for url in re.findall(r'url\([\"\']?([^\)\"\']+)',file.read_text()):
  if not url.startswith('/'):url=urllib.parse.urljoin('/'+str(file.relative_to(root/'public')),url)
  classify(url,str(file.relative_to(root)))
record={'htmlRoutes':len(pages),'resolvedLocalPaths':sorted(assets),'redirectLinks':redirects,'unresolvedPaths':missing,'methodology':'Every local src/href/poster plus CSS url; existing static file or index, bounded runtime or host-unconstrained redirect required.'}
(root/'investigation/A7-ASSET-RESOLUTION.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps({'routes':len(pages),'resolved':len(assets),'redirects':len(redirects),'missing':{k:v[:2]for k,v in missing.items()}},indent=2));sys.exit(bool(missing))
