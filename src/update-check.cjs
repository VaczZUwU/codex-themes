'use strict';
const https=require('node:https'),fs=require('node:fs'),path=require('node:path');
const REPO='VaczZUwU/codex-themes';
function version(value){const m=/^v?(\d+)\.(\d+)\.(\d+)$/.exec(value||'');return m?m.slice(1).map(Number):null;}
function newer(a,b){return a.some((value,i)=>value!==b[i]&&a.slice(0,i).every((value,j)=>value===b[j])&&value>b[i]);}
function selectRelease(releases,current){
  const installed=version(current);if(!installed||!Array.isArray(releases))return null;
  const candidates=releases.filter(r=>r&&!r.draft&&version(r.tag_name));
  candidates.sort((a,b)=>{const x=version(a.tag_name),y=version(b.tag_name);return y[0]-x[0]||y[1]-x[1]||y[2]-x[2];});
  const latest=candidates[0];if(!latest||!newer(version(latest.tag_name),installed))return null;
  const v=version(latest.tag_name).join('.');return {version:v,url:`https://github.com/${REPO}/releases/tag/${encodeURIComponent(latest.tag_name)}`};
}
function readReleases(client=https){return new Promise((resolve,reject)=>{
  const request=client.get(`https://api.github.com/repos/${REPO}/releases?per_page=30`,{headers:{Accept:'application/vnd.github+json','User-Agent':'codex-themes-update-check','X-GitHub-Api-Version':'2022-11-28'}},response=>{
    if(response.statusCode!==200){response.resume();reject(new Error('Unavailable'));return;}
    let body='',size=0;response.setEncoding('utf8');response.on('data',chunk=>{size+=Buffer.byteLength(chunk);if(size>1024*1024){request.destroy(new Error('Invalid response'));return;}body+=chunk;});
    response.on('error',reject);response.on('end',()=>{try{const value=JSON.parse(body);if(!Array.isArray(value))throw new Error('Invalid response');resolve(value);}catch(error){reject(error);}});
  });request.setTimeout(6000,()=>request.destroy(new Error('Timeout')));request.on('error',reject);
});}
function start({app,webContents},current){
  if(process.__codexThemesUpdateStarted)return;process.__codexThemesUpdateStarted=true;
  let status={current,available:false,checking:true};
  const deliver=wc=>{if(!status||wc.isDestroyed()||!/^app:\/\/-\/index\.html(?:[?#]|$)/.test(wc.getURL()))return;
    const data=JSON.stringify(status);wc.executeJavaScript(`window.__codexThemesUpdate=${data};window.dispatchEvent(new CustomEvent('codex-themes-update',{detail:window.__codexThemesUpdate}));`).catch(()=>{});
  };
  app.on('web-contents-created',(_event,wc)=>wc.on('did-finish-load',()=>deliver(wc)));
  app.whenReady().then(async()=>{
    const cacheFile=path.join(app.getPath('userData'),'codex-themes-update.json');
    try{const cached=JSON.parse(fs.readFileSync(cacheFile,'utf8'));const release=selectRelease(cached.releases,current);if(release){status={...release,current,available:true};webContents.getAllWebContents().forEach(deliver);}}catch{}
    try{const releases=await readReleases();const release=selectRelease(releases,current);status=release?{...release,current,available:true}:{current,available:false};
      try{const temporary=cacheFile+'.tmp';fs.writeFileSync(temporary,JSON.stringify({checkedAt:Date.now(),releases:releases.map(r=>({tag_name:r.tag_name,draft:r.draft,prerelease:r.prerelease}))}));fs.renameSync(temporary,cacheFile);}catch{}
      webContents.getAllWebContents().forEach(deliver);
    }catch{if(!status.available){status={current,available:false,offline:true};webContents.getAllWebContents().forEach(deliver);} /* Offline and rate limits never delay launching Codex. */ }
  }).catch(()=>{});
}
module.exports={version,newer,selectRelease,readReleases,start};
