"""Versioned docs corpus publication; complete-site acceptance remains A7."""
from pathlib import Path
import json,os,subprocess,sys,time
root=Path(__file__).resolve().parents[1];node=os.environ.get('AI_SDK_NODE','node');force=['--force'] if '--force' in sys.argv else []
agent=not (root/'authored').exists();phases=[]
def run(name,args):
 start=time.perf_counter();subprocess.run(args,cwd=root,env={**os.environ,'NODE_ENV':'production'},check=True);phases.append({'name':name,'elapsed_s':time.perf_counter()-start})
run('content island compilation',[node,'scripts/build-islands.mjs',*force])
run('shared UI compilation',[node,'scripts/build-chrome.mjs',*force])
if agent:
 run('prototype HTML island refresh',['python3','scripts/refresh-islands.py',*force])
 run('current HTML island refresh',['python3','scripts/refresh-islands.py','--all-docs',*force])
else:
 run('authored docs synchronization',[node,'scripts/sync-docs.mjs'])
 run('prototype MDX and SSR',[node,'scripts/render-proof.mjs',*force])
 run('versioned MDX compatibility and SSR',[node,'scripts/render-proof.mjs','--all-docs',*force])
 run('versioned navigation',[node,'scripts/prepare-docs-navigation.mjs'])
 run('home island SSR',[node,'scripts/render-home-proof.mjs'])
run('shared page UI preparation',[node,'scripts/prepare-docs-shells.mjs',*(['--rendered-source'] if agent else []),*force])
run('Nift composition',['python3','scripts/compose-docs.py',*force])
(root/'generated/docs-pipeline-phases.json').write_text(json.dumps(phases,indent=2)+'\n')
