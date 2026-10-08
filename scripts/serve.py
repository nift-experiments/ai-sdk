"""Standalone migration publication server; no upstream writes or framework."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from urllib.parse import urlsplit,urlunsplit
import argparse,json,re
p=argparse.ArgumentParser();p.add_argument('--port',type=int,default=4332);args=p.parse_args()
root=Path(__file__).resolve().parents[1]
rules=[(row,re.compile(row['regex'])) for row in json.loads((root/'routes/redirects.json').read_text())]
class Site(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(root/'public'),**kw)
 def do_GET(self):
  request=urlsplit(self.path)
  for row,pattern in rules:
   conditions=row.get('has',[])
   if any(condition['type']!='host' or not re.fullmatch(condition['value'],self.headers.get('Host','').split(':')[0]) for condition in conditions):continue
   match=pattern.fullmatch(request.path)
   if not match:continue
   destination=row['destination']
   for key,value in zip(row['parameters'],match.groups()):destination=re.sub(':'+re.escape(key)+r'[*+?]?',lambda _:value or '',destination)
   if request.query:destination+=('&' if '?' in destination else '?')+request.query
   self.send_response(row['statusCode']);self.send_header('Location',destination);self.send_header('Content-Length','0');self.end_headers();return
  if not Path(request.path).suffix:
   self.path=urlunsplit(('', '',request.path.rstrip('/')+'/index.html',request.query,''))
  super().do_GET()
 def do_HEAD(self):
  # Static HEAD probes use the same route normalization. Redirect HEAD parity
  # and negotiated Markdown/API handling are separate ancillary acceptance.
  request=urlsplit(self.path)
  if not Path(request.path).suffix:self.path=request.path.rstrip('/')+'/index.html'
  super().do_HEAD()
 def end_headers(self):
  self.send_header('Content-Security-Policy',"connect-src 'self'; script-src 'self' 'unsafe-inline'; form-action 'none'")
  super().end_headers()
ThreadingHTTPServer(('127.0.0.1',args.port),Site).serve_forever()
