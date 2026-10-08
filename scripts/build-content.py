"""Complete publication: maintained inputs -> preparation -> Nift + HTTP assets."""
from pathlib import Path
import json,os,subprocess,sys,time
root=Path(__file__).resolve().parents[1];node=os.environ.get('AI_SDK_NODE','node');force=['--force']if'--force'in sys.argv else[];agent=not(root/'authored').exists();phases=[]
def run(name,args):
 start=time.perf_counter();subprocess.run(args,cwd=root,env={**os.environ,'NODE_ENV':'production'},check=True);phases.append({'name':name,'elapsed_s':time.perf_counter()-start})
if not agent:run('authored source synchronization',[node,'scripts/sync-collections.mjs'])
run('content island compilation',[node,'scripts/build-islands.mjs',*force]);run('shared UI compilation',[node,'scripts/build-chrome.mjs',*force])
if agent:
 run('maintained HTML island preparation',['python3','scripts/refresh-islands.py','--all-content',*force]);run('ancillary HTML island preparation',['python3','scripts/refresh-islands.py','--ancillary',*force])
else:
 run('MDX compatibility and server rendering',[node,'scripts/render-proof.mjs','--all-content',*force]);run('content navigation',[node,'scripts/prepare-content-navigation.mjs']);run('ancillary authored pages',[node,'scripts/render-ancillary.mjs']);run('Markdown projection conversion',[node,'scripts/prepare-projections.mjs']);run('discovery projections',[node,'scripts/prepare-discovery.mjs'])
run('shared page UI preparation',[node,'scripts/prepare-content-shells.mjs',*(['--rendered-source']if agent else[]),*force]);run('Nift composition',['python3','scripts/compose-content.py',*force]);run('search indexing',[node,'scripts/prepare-search.mjs',*(['--rendered-source']if agent else[])]);run('runtime handler compilation',[node,'scripts/build-runtime.mjs']);run('reference and runtime publication',['python3','scripts/publish-surfaces.py'])
(root/'generated/content-pipeline-phases.json').write_text(json.dumps(phases,indent=2)+'\n');print(json.dumps({'pipelineSeconds':sum(p['elapsed_s']for p in phases),'phases':phases},indent=2))
