"""A4 content preparation; publication acceptance remains a separate check."""
from pathlib import Path
import os,subprocess,sys,time,json
root=Path(__file__).resolve().parents[1]
node=os.environ.get('AI_SDK_NODE','node');force=['--force'] if '--force' in sys.argv else []
phases=[]
for name,script,flags in [('authored source synchronization','sync-authored.mjs',[]),('MDX compatibility and SSR','render-proof.mjs',['--current-docs',*force]),('structured navigation','prepare-current-navigation.mjs',[])]:
 start=time.perf_counter()
 subprocess.run([node,'scripts/'+script,*flags],cwd=root,check=True)
 phases.append({'name':name,'elapsed_s':time.perf_counter()-start})
(root/'generated/current-docs-preparation-phases.json').write_text(json.dumps(phases,indent=2)+'\n')
