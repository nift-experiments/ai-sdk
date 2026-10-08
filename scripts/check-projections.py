"""Check Markdown downloads against the immutable production reference."""
from pathlib import Path
import json,sys
root=Path(__file__).resolve().parents[1];reference=Path(sys.argv[1]);rows=[]
for page in json.loads((root/'generated/projection-pages.json').read_text()):
 version=page['version'];family=page['family'];base=('/'+version if version!='v7' else '')+'/'+family
 slug=page['route'].removeprefix(base).lstrip('/')
 endpoint={'docs':'llms.mdx','providers':'providers-llms.mdx','cookbook':'cookbook-llms.mdx'}[family]
 frozen=reference/'reference-build-03/.next/server/app/en'/('' if version=='v7' else version)/endpoint/(slug+'.body')
 rows.append({'route':page['route'],'equal':(root/page['file']).read_bytes()==frozen.read_bytes()})
(root/'investigation/A6-MARKDOWN-PROJECTION-PROOF.json').write_text(json.dumps(rows,indent=2)+'\n')
failed=[r for r in rows if not r['equal']];print(json.dumps({'pages':len(rows),'failed':failed}));sys.exit(bool(failed))
