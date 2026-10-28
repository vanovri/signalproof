import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname} from 'node:path';
import {handle} from './api/analyze.mjs';
const root=fileURLToPath(new URL('.',import.meta.url));
const port=Number(process.env.PORT||8789), host=process.env.HOST||'127.0.0.1';
const types={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.csv':'text/csv','.json':'application/json'};
createServer(async(req,res)=>{
  const send=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  try {
    if(req.url==='/api/analyze'&&req.method==='POST') {
      if(req.headers.origin && req.headers.origin!==`http://${req.headers.host}` && req.headers.origin!==`https://${req.headers.host}`){send(403,{error:'Cross-origin requests are disabled.'});return;}
      let size=0,chunks=[];
      for await(const chunk of req){size+=chunk.length;if(size>2_000_000){send(413,{error:'Request exceeds 2 MB.'});return;}chunks.push(chunk);}
      let body;try{body=JSON.parse(Buffer.concat(chunks).toString());}catch{send(400,{error:'Invalid JSON.'});return;}
      const local=host==='127.0.0.1'&&['127.0.0.1','::ffff:127.0.0.1','::1'].includes(req.socket.remoteAddress);
      const result=await handle(body,req.headers,fetch,local);send(result.code,result.body);return;
    }
    if(req.method!=='GET'){send(405,{error:'Use GET or POST /api/analyze.'});return;}
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const target=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    const allowed=new Set(['index.html','style.css','app.mjs','engine.mjs']);
    const rel=target.slice(root.length).replaceAll('\\','/');
    if(!target.startsWith(root)||!allowed.has(rel)){send(404,{error:'Not found.'});return;}
    res.writeHead(200,{'Content-Type':types[extname(target)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'"});
    res.end(await readFile(target));
  }catch{if(!res.headersSent)send(500,{error:'Server error.'});else res.end();}
}).listen(port,host,()=>console.log(`SignalProof listening at http://${host}:${port}`));
