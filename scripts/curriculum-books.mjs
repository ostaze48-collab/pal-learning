import OpenAI from 'openai';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const root=process.cwd();
const cfg=JSON.parse(await fsp.readFile(path.join(root,'curriculum/direct-resources.json'),'utf8'));
const outDir=path.join(root,'curriculum/books');
const manifestPath=path.join(root,'curriculum/books-manifest.json');
const UA='Salma-Sama-Official-Books/1.0';

function sha256(buffer){return crypto.createHash('sha256').update(buffer).digest('hex')}
function slug(s){return String(s).replace(/\s+/g,'-').replace(/[\\/:*?"<>|]/g,'-')}
function fileNameFor(x){return `g${x.grade}-s${x.semester}-${slug(x.subject)}-${path.basename(new URL(x.url).pathname)}`}
function metadataFor(x,fileName,hash,bytes){return `# Official Palestinian Curriculum Book\n\n- File: ${fileName}\n- Title: ${x.label}\n- Grade: ${x.grade}\n- Semester: ${x.semester}\n- Subject: ${x.subject}\n- Resource type: ${x.kind}\n- Authority: ${x.authority}\n- Source priority: ${x.sourcePriority}\n- Source page: ${x.sourcePage}\n- Original URL: ${x.url}\n- Verification before this run: ${x.verification}\n- SHA-256: ${hash}\n- Bytes: ${bytes}\n\n## Grounding policy\nThis official textbook is a primary curriculum source. Use it before worksheets, external summaries, or AI-generated supporting explanations when answering curriculum questions for this grade and subject.\n`;}

async function prepare(){
  await fsp.mkdir(outDir,{recursive:true});
  const prepared=[];
  for(const x of cfg.resources){
    const fileName=fileNameFor(x);const filePath=path.join(outDir,fileName);
    console.log('book download',x.grade,x.subject,x.url);
    const res=await fetch(x.url,{headers:{'user-agent':UA},redirect:'follow'});
    if(!res.ok)throw new Error(`Book download failed ${res.status}: ${x.url}`);
    const buffer=Buffer.from(await res.arrayBuffer());
    const signature=buffer.subarray(0,5).toString();
    if(signature!=='%PDF-')throw new Error(`Not a PDF (${signature}): ${x.url}`);
    if(buffer.length<10000)throw new Error(`Suspiciously small book (${buffer.length} bytes): ${x.url}`);
    await fsp.writeFile(filePath,buffer);
    const hash=sha256(buffer);const metaPath=`${filePath}.meta.md`;
    await fsp.writeFile(metaPath,metadataFor(x,fileName,hash,buffer.length),'utf8');
    prepared.push({...x,fileName,filePath,metaPath,sha256:hash,bytes:buffer.length,verifiedNow:'pdf_signature'});
    console.log('book verified',x.grade,x.subject,buffer.length,hash.slice(0,12));
  }
  await fsp.writeFile(manifestPath,JSON.stringify({preparedAt:new Date().toISOString(),count:prepared.length,books:prepared},null,2));
  console.log(`prepared ${prepared.length} official books -> ${manifestPath}`);
  return prepared;
}

async function upload(prepared){
  if(!process.env.OPENAI_API_KEY)throw new Error('OPENAI_API_KEY is required to create/upload the curriculum vector store.');
  const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
  let vectorStoreId=process.env.OPENAI_CURRICULUM_VECTOR_STORE_ID;
  if(!vectorStoreId){
    const store=await client.vectorStores.create({name:'Palestinian Curriculum - Salma Sama - Official Core'});
    vectorStoreId=store.id;
    console.log('created vector store',vectorStoreId);
  }
  let indexed=0;
  for(const book of prepared){
    for(const filePath of [book.filePath,book.metaPath]){
      console.log('index',path.basename(filePath));
      const result=await client.vectorStores.files.uploadAndPoll(vectorStoreId,fs.createReadStream(filePath),{pollIntervalMs:1000});
      if(result.status!=='completed')throw new Error(`Indexing failed (${result.status}) for ${filePath}`);
      indexed++;
    }
  }
  const state={vectorStoreId,uploadedAt:new Date().toISOString(),books:prepared.length,indexedFiles:indexed};
  await fsp.writeFile(path.join(root,'curriculum/vector-store-books.json'),JSON.stringify(state,null,2));
  console.log(`OPENAI_CURRICULUM_VECTOR_STORE_ID=${vectorStoreId}`);
}

const command=process.argv[2]||'prepare';
if(command==='prepare')await prepare();
else if(command==='upload'){const prepared=fs.existsSync(manifestPath)?JSON.parse(await fsp.readFile(manifestPath,'utf8')).books:await prepare();await upload(prepared)}
else if(command==='all'){const prepared=await prepare();await upload(prepared)}
else throw new Error('Use: prepare | upload | all');
