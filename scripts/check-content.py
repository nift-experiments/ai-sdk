"""Compare maintained/rendered document bodies to A1 frozen HTTP responses.

This checks content semantics, not complete page layout or browser behavior.
Pass the external baseline directory explicitly; it is not a build dependency.
"""
from pathlib import Path
import argparse,json,re
from bs4 import BeautifulSoup
p=argparse.ArgumentParser();p.add_argument('reference',type=Path);p.add_argument('--published',action='store_true');p.add_argument('--all-docs',action='store_true');p.add_argument('--all-content',action='store_true');args=p.parse_args()
root=Path(__file__).resolve().parents[1]
reference={row['path']:row for row in json.loads((args.reference/'http-reference/all-html-cases-responses.json').read_text())}
if (root/'authored').exists():
 pages=json.loads((root/('generated/content-source-map.json' if args.all_content else 'generated/docs-source-map.json' if args.all_docs else 'generated/current-docs-source-map.json')).read_text())['pages']
 inputs=[(row['route'],root/'generated'/row['file'].replace('.mdx','.html')) for row in pages]
else:
 pages=json.loads((root/('content-pages.json' if args.all_content else 'docs-pages.json' if args.all_docs else 'current-docs.json')).read_text())
 inputs=[(row['route'],root/row['source']) for row in pages]
if args.published:inputs=[(route,root/'public'/route.lstrip('/')/'index.html') for route,_ in inputs]
def text(node):return ' '.join(node.get_text(' ',strip=True).split())
def headings(node):return [(v.get('id'),text(v)) for v in node.select('h2,h3,h4,h5,h6')]
def links(node):return [(v.get('href'),text(v)) for v in node.select('a')] if node else []
def code(node):return [v.get_text() for v in node.select('pre code')]
rows=[]
for route,source in inputs:
 document=BeautifulSoup((args.reference/'http-reference'/reference[route]['file']).read_bytes(),'html.parser')
 body=document.select_one('[data-geistdocs-article="body"]')
 if body is None:raise RuntimeError('Missing reference body: '+route)
 published=BeautifulSoup(source.read_text(),'html.parser')
 own=published
 if args.published:own=own.select_one('[data-geistdocs-article="body"]')
 if own is None:raise RuntimeError('Missing published body: '+route)
 row={'route':route,'text_equal':text(body)==text(own),'heading_anchors_equal':headings(body)==headings(own),'links_equal':links(body)==links(own),'code_text_equal':code(body)==code(own)}
 if args.published:
  row['toc_links_equal']=links(document.select_one('#nd-toc'))==links(published.select_one('#nd-toc'))
 rows.append(row)
out=root/('investigation/A4-CURRENT-DOCS-PUBLICATION-CONTENT-PROOF.json' if args.published else 'investigation/A4-CURRENT-DOCS-CONTENT-PROOF.json')
if args.all_docs:out=root/('investigation/A5-DOCS-PUBLICATION-CONTENT-PROOF.json' if args.published else 'investigation/A5-DOCS-CONTENT-PROOF.json')
if args.all_content:out=root/('investigation/A6-CONTENT-PUBLICATION-PROOF.json' if args.published else 'investigation/A6-CONTENT-PROOF.json')
out.write_text(json.dumps(rows,indent=2)+'\n')
failed=[row for row in rows if not all(v for k,v in row.items() if k!='route')]
print(json.dumps({'pages':len(rows),'failed':failed},indent=2))
if failed:raise SystemExit(1)
