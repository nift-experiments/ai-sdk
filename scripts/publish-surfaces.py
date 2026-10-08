"""Publish generated or explicitly maintained reference and runtime assets."""
from pathlib import Path
import json,shutil,html,re,time
publication_start=time.perf_counter();publication_metrics={"changed_files":0,"copied_bytes":0}
root=Path(__file__).resolve().parents[1];agent=not(root/'authored').exists()
def changed(file,data):
 file=root/file;file.parent.mkdir(parents=True,exist_ok=True)
 if not file.exists()or file.read_bytes()!=data:file.write_bytes(data);publication_metrics['changed_files']+=1;publication_metrics['copied_bytes']+=len(data)
old_owned=[]
try:old_owned=json.loads((root/'generated/public-reference-owned.json').read_text())
except FileNotFoundError:
 try:
  old_surfaces=json.loads((root/'runtime/surfaces.json').read_text());old_owned=['public'+route+'.md'for route in old_surfaces['markdown']]+['public'+page['route']for page in old_surfaces['discovery']]
 except FileNotFoundError:pass
reference_start=time.perf_counter()
projections=json.loads((root/('projection-pages.json'if agent else'generated/projection-pages.json')).read_text());discovery=json.loads((root/('discovery-pages.json'if agent else'generated/discovery-pages.json')).read_text())
for p in projections+discovery:
 source=p['source']if agent else p['file'];changed('public'+p['route']+('.md'if p in projections else''),(root/source).read_bytes())
publication_metrics['reference_publication_s']=time.perf_counter()-reference_start
metadata_start=time.perf_counter()
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
publication_metrics['route_metadata_s']=time.perf_counter()-metadata_start
runtime_start=time.perf_counter()
changed('runtime/og-pages.json',json.dumps([{'slug':re.sub(r'(^|/)index$','',p['path'].removesuffix('.mdx')),'metadata':p['metadata']}for p in primary],separators=(',',':')).encode())
chat_pages=json.loads((root/'content-pages.json').read_text()) if agent else json.loads((root/'generated/content-source-map.json').read_text())['pages']
if not agent:
 results={p['file']:p for p in json.loads((root/'generated/content-render-results.json').read_text())}
 chat_pages=[{**p,'path':p['file'].removeprefix(p['version']+'/'+p['family']+'/'),'metadata':results[p['file']]['metadata'],'structuredData':results[p['file']]['structuredData']}for p in chat_pages]
changed('runtime/chat-pages.json',json.dumps(chat_pages,separators=(',',':')).encode())
for file in (root/'maintained-assets/og').iterdir():changed('runtime/og/'+file.name,file.read_bytes())
for version in['v7','v6','v5']:changed('runtime/search/'+version+'-database.json',(root/'generated/search'/ (version+'-database.json')).read_bytes())
changed('runtime/surfaces.json',json.dumps({'markdown':[p['route']for p in projections],'discovery':discovery},separators=(',',':')).encode())
# Redirects are a maintained source; publication snapshots their exact bytes.
redirect_start=time.perf_counter();redirect_bytes=(root/'routes/redirects.json').read_bytes();rules=json.loads(redirect_bytes)
for rule in rules:re.compile(rule['regex'])
changed('runtime/redirects.json',redirect_bytes);publication_metrics['redirect_preparation_s']=time.perf_counter()-redirect_start
new_owned=['public'+p['route']+('.md'if p in projections else'')for p in projections+discovery]
for retired in set(old_owned)-set(new_owned):
 if not retired.startswith('public/'):raise ValueError('Unexpected reference ownership path')
 (root/retired).unlink(missing_ok=True)
(root/'generated/public-reference-owned.json').write_text(json.dumps(new_owned)+'\n');publication_metrics['runtime_assets_s']=time.perf_counter()-runtime_start;publication_metrics['total_s']=time.perf_counter()-publication_start
(root/'generated/publication-work-metrics.json').write_text(json.dumps(publication_metrics,indent=2)+'\n')
print(json.dumps({'markdown' :len(projections),'discovery':len(discovery),'xmlUrls':len(entries),'markdownRenderers':0}))
