const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, 'external-assets');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'all-images.json'), 'utf8'));
const inputs = new Map(manifest.filter(x=>x.file).map(x=>[x.url,x]));
const original = globalThis.fetch;
globalThis.fetch = async function(input, init) {
 const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
 const method = String(init?.method || input?.method || 'GET').toUpperCase();
 if (!['GET','HEAD'].includes(method)) throw new Error('Experiment forbids outbound writes');
 const entry = inputs.get(url);
 if (entry) {
  fs.appendFileSync(path.join(root,'delivery.jsonl'),JSON.stringify({url,method,pid:process.pid})+'\n');
  return new Response(method==='HEAD'?null:fs.readFileSync(path.join(root,entry.file)),{status:200,headers:{'content-type':entry.mime}});
 }
 return original(input, init);
};
