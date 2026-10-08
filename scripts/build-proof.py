"""A3 representative pipeline; full migration acceptance is tracked separately."""
from pathlib import Path
import os,subprocess,sys,time,json
ROOT=Path(__file__).resolve().parents[1]
node=os.environ.get('AI_SDK_NODE','node');force=['--force'] if '--force' in sys.argv else []
phases=[]
def run(name,args):
 start=time.perf_counter();subprocess.run(args,cwd=ROOT,check=True);phases.append({'name':name,'elapsed_s':time.perf_counter()-start})
run('island compilation',[node,'scripts/build-islands.mjs',*force])
if (ROOT/'sources').exists():
 run('MDX compatibility and SSR',[node,'scripts/render-proof.mjs',*force])
 key=json.loads((ROOT/'generated/islands-build.json').read_text())['key']
 marker=ROOT/'generated/home-island-key'
 if force or not marker.exists() or marker.read_text()!=key:
  run('home island SSR',[node,'scripts/render-home-proof.mjs']);marker.write_text(key)
else:run('HTML island refresh',['python3','scripts/refresh-islands.py',*force])
run('Nift composition',['python3','scripts/compose-proof.py',*force])
(ROOT/'generated/pipeline-phases.json').write_text(json.dumps(phases,indent=2)+'\n')
