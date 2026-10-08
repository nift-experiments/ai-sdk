"""Publish generated or explicitly maintained reference and runtime assets."""
from pathlib import Path
import json,shutil,html,re
root=Path(__file__).resolve().parents[1];agent=not(root/'authored').exists()
def changed(file,data):
 file=root/file;file.parent.mkdir(parents=True,exist_ok=True)
 if not file.exists()or file.read_bytes()!=data:file.write_bytes(data)
projections=json.loads((root/('projection-pages.json'if agent else'generated/projection-pages.json')).read_text());discovery=json.loads((root/('discovery-pages.json'if agent else'generated/discovery-pages.json')).read_text())
for p in projections+discovery:
 source=p['source']if agent else p['file'];changed('public'+p['route']+('.md'if p in projections else''),(root/source).read_bytes())
# Match the captured non-production reference robots mode. Production serving
# may opt in explicitly; never silently index a preview deployment.
changed('public/robots.txt',b'User-Agent: *\nDisallow: /\n\n')
pages=json.loads((root/'generated/content-pages.json').read_text());order=json.loads((root/'routes/source-order.json').read_text())
primary=[p for p in pages if p.get('version')=='v7'and p.get('family')in['docs','providers','cookbook']]
primary.sort(key=lambda p:(['docs','providers','cookbook'].index(p['family']),order['v7/'+p['family']].index(p['path'])if p['path']in order['v7/'+p['family']]else 1000000,p['path']))
resources=['/resources','/resources/recipes','/resources/tools']+[p['route']for p in pages if p['route'].startswith('/resources/tools/')]+['/resources/showcase']
entries=[('/',1)]+[(p['route'],1 if p['route']=='/docs/introduction'else.5)for p in primary]+[(p,.5)for p in resources]
xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join('<url>\n<loc>'+html.escape('https://ai-sdk.dev'+path)+'</loc>\n<changefreq>weekly</changefreq>\n<priority>'+str(priority)+'</priority>\n</url>\n'for path,priority in entries)+'</urlset>\n'
changed('public/sitemap.xml',xml.encode())
changed('runtime/og-pages.json',json.dumps([{'slug':re.sub(r'(^|/)index$','',p['path'].removesuffix('.mdx')),'metadata':p['metadata']}for p in primary],separators=(',',':')).encode())
chat_pages=json.loads((root/'content-pages.json').read_text()) if agent else json.loads((root/'generated/content-source-map.json').read_text())['pages']
if not agent:
 results={p['file']:p for p in json.loads((root/'generated/content-render-results.json').read_text())}
 chat_pages=[{**p,'path':p['file'].removeprefix(p['version']+'/'+p['family']+'/'),'metadata':results[p['file']]['metadata'],'structuredData':results[p['file']]['structuredData']}for p in chat_pages]
changed('runtime/chat-pages.json',json.dumps(chat_pages,separators=(',',':')).encode())
for file in (root/'maintained-assets/og').iterdir():changed('runtime/og/'+file.name,file.read_bytes())
for version in['v7','v6','v5']:changed('runtime/search/'+version+'-database.json',(root/'generated/search'/ (version+'-database.json')).read_bytes())
changed('runtime/surfaces.json',json.dumps({'markdown':[p['route']for p in projections],'discovery':discovery},separators=(',',':')).encode())
print(json.dumps({'markdown':len(projections),'discovery':len(discovery),'xmlUrls':len(entries),'markdownRenderers':0}))
