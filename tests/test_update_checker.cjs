'use strict';
const assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const {version,newer,selectRelease,readReleases}=require('../src/update-check.cjs');
assert.deepEqual(version('v0.2.10'),[0,2,10]);assert.equal(version('v1.0.0-beta'),null);
assert(newer([0,10,0],[0,2,9]));assert(!newer([1,1,1],[1,1,1]));assert(!newer([0,2,100],[1,0,0]));
const releases=[{tag_name:'v0.1.1'},{tag_name:'v0.2.0',prerelease:true},{tag_name:'v9.0.0',draft:true},{tag_name:'v1.0.0-beta'},{tag_name:'../../malicious'}];
assert.deepEqual(selectRelease(releases,'0.1.1'),{version:'0.2.0',url:'https://github.com/VaczZUwU/codex-themes/releases/tag/v0.2.0'});
assert.equal(selectRelease(releases,'0.2.0'),null);assert.equal(selectRelease(releases,'0.3.0'),null);assert.equal(selectRelease({},'0.1.1'),null);
function client(status,body,timeout=false){return {get(url,options,callback){assert.equal(url,'https://api.github.com/repos/VaczZUwU/codex-themes/releases?per_page=30');assert.equal(options.headers.Authorization,undefined);
  const request=new EventEmitter();request.setTimeout=(ms,fn)=>{assert.equal(ms,6000);if(timeout)setImmediate(fn);};request.destroy=error=>request.emit('error',error);
  if(!timeout)setImmediate(()=>{const response=new EventEmitter();response.statusCode=status;response.resume=()=>{};response.setEncoding=()=>{};callback(response);response.emit('data',body);response.emit('end');});return request;
}};}
(async()=>{assert.deepEqual(await readReleases(client(200,JSON.stringify(releases))),releases);
await assert.rejects(readReleases(client(403,'rate limit')));await assert.rejects(readReleases(client(200,'broken')));await assert.rejects(readReleases(client(200,'{}')));await assert.rejects(readReleases(client(200,'',true)),/Timeout/);
console.log('Update checker: versions, prereleases, drafts, trusted links, public request, malformed response, rate limit and timeout passed.');})().catch(error=>{console.error(error);process.exitCode=1;});
