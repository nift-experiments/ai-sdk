"""Full route metadata parity against the immutable reference HTTP archive."""
from pathlib import Path
from bs4 import BeautifulSoup
import json,sys
root=Path(__file__).resolve().parents[1];b=Path(sys.argv[1])/'http-reference';reference={r['path']:r for r in json.loads((b/'all-html-cases-responses.json').read_text())};pages=json.loads((root/'generated/content-pages.json').read_text());rows=[]
fields={'description','robots','og:title','og:description','og:image','og:site_name','og:type','twitter:card','twitter:title','twitter:description','twitter:image'}
def head(file):return BeautifulSoup(file.read_text().split('</head>',1)[0]+'</head>','html.parser')
def values(soup):
 return {'title':soup.title.get_text() if soup.title else None,'meta':sorted([(tag.get('name') or tag.get('property'),tag.get('content')) for tag in soup.select('meta') if (tag.get('name') or tag.get('property')) in fields]),'links':sorted([(','.join(tag.get('rel',[])),tag.get('type'),tag.get('href')) for tag in soup.select('link') if any(rel in tag.get('rel',[]) for rel in ['canonical','alternate','llms-txt'])])}
for page in pages:
 route=page['route'];old=values(head(b/reference[route]['file']));new=values(head(root/'public'/(page['name']+'.html')))
 rows.append({'route':route,'equal':old==new,**({'expected':old,'actual':new} if old!=new else {})})
(root/'investigation/A6-ALL-ROUTE-METADATA-PROOF.json').write_text(json.dumps(rows,indent=2)+'\n');failed=[r for r in rows if not r['equal']];print(json.dumps({'pages':len(rows),'failures':len(failed),'examples':failed[:3]},indent=2));sys.exit(bool(failed))
