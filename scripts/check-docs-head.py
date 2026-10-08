"""Pinned reference head semantics; framework build assets are separately owned."""
from pathlib import Path
from bs4 import BeautifulSoup
import json,argparse
p=argparse.ArgumentParser();p.add_argument('reference',type=Path);p.add_argument('--current',action='store_true');args=p.parse_args();root=Path(__file__).resolve().parents[1]
ref=args.reference/'http-reference';references={r['path']:r for r in json.loads((ref/'all-html-cases-responses.json').read_text())};rows=[]
def metadata(s):return {v.get('name',v.get('property')):v.get('content') for v in s.head.select('meta[name],meta[property]') if v.get('name',v.get('property')) not in ['viewport','next-size-adjust']}
def links(s,rel):return [(v.get('type'),v.get('href')) for v in s.head.select('link[rel="'+rel+'"]')]
for page in json.loads((root/('generated/current-docs-pages.json' if args.current else 'generated/docs-pages.json')).read_text()):
 reference=BeautifulSoup((ref/references[page['route']]['file']).read_text(),'html.parser');own=BeautifulSoup((root/'public'/page['name']).with_suffix('.html').read_text(),'html.parser')
 row={'route':page['route'],'metadata_equal':metadata(reference)==metadata(own),'title_equal':reference.title.get_text()==own.title.get_text(),'canonical_equal':links(reference,'canonical')==links(own,'canonical'),'markdown_alternate_equal':links(reference,'alternate')==links(own,'alternate'),'llms_link_equal':links(reference,'llms-txt')==links(own,'llms-txt')};rows.append(row)
failed=[r for r in rows if not all(v for k,v in r.items() if k!='route')]
(root/('investigation/A4-CURRENT-DOCS-HEAD-PROOF.json' if args.current else 'investigation/A5-DOCS-HEAD-PROOF.json')).write_text(json.dumps(rows,indent=2)+'\n');print(json.dumps({'pages':len(rows),'failed':failed},indent=2));assert not failed
