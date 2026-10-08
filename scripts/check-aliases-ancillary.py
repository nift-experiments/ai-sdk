from pathlib import Path
from bs4 import BeautifulSoup
import json,sys
r=Path(sys.argv[1]).resolve();b=r.parent/'ai-sdk-baseline/http-reference';refs={x['path']:x for x in json.loads((b/'all-html-cases-responses.json').read_text())};rows=[]
for p in json.loads((r/'generated/content-pages.json').read_text()):
 if p.get('layout')!='global' and p.get('family')!='recipes':continue
 old=BeautifulSoup((b/refs[p['route']]['file']).read_bytes(),'html.parser');new=BeautifulSoup((r/'public'/(p['name']+'.html')).read_bytes(),'html.parser');selector='main' if p.get('layout')=='global' else '[data-geistdocs-article="body"]';o=old.select_one(selector);n=new.select_one(selector)
 def text(v):
  for s in v.select('script'):s.decompose()
  return ' '.join(v.get_text(' ',strip=True).split())
 
 if o is None or n is None:
  def fallback(soup):
   node=soup.select_one('h1,h2')
   if node is None:raise RuntimeError('Missing page heading '+p['route'])
   while node.parent and not node.parent.has_attr('data-geistdocs-container') and not node.parent.has_attr('data-ai-article-slot'):node=node.parent
   return node
  o=fallback(old);n=fallback(new)
 ot=text(o);nt=text(n)
 def links(v):return [(x.get('href'),x.get_text(' ',strip=True)) for x in v.select('a')]
 rows.append({'route':p['route'],'textEqual':ot==nt,'linksEqual':links(o)==links(n),**({'expectedText':ot[:250],'actualText':nt[:250]} if ot!=nt else {})})
failed=[x for x in rows if not x['textEqual'] or not x['linksEqual']];(r/'investigation/A9-ALIASES-ANCILLARY-PROOF.json').write_text(json.dumps(rows,indent=2)+'\n');print(json.dumps({'pages':len(rows),'failures':failed[:8],'failureCount':len(failed)},indent=2));sys.exit(bool(failed))
