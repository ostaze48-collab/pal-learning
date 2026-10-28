import OpenAI from 'openai';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const root=process.cwd();
const cfg=JSON.parse(await fsp.readFile(path.join(root,'curriculum/source-pages.json'),'utf8'));
const outDir=path.join(root,'curriculum/discovered');
const catalogPath=path.join(root,'curriculum/discovered.json');
const downloadedPath=path.join(root,'curriculum/downloaded.json');
const mode=process.argv[2]||'discover';

function cleanHref(href,base){
  if(!href)return null;
  try{return new URL(href.replace(/&amp;/g,'&'),base).href}catch{return null}
}
function stripHtml(text){return text.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim()}
function guessKind(label,url,defaultKind){
  const s=`${label} ${decodeURIComponent(url)}`.toLowerCase();
  if(/نموذج|اجابة|إجابة|answer|solution/.test(s))return 'solution';
  if(/اختبار|امتحان|exam|test/.test(s))return 'assessment';
  if(/ورقة|worksheet/.test(s))return 'worksheet';
  if(/دليل|guide/.test(s))return 'teacher-guide';
  if(/رزمة|package/.test(s))return 'package';
  return defaultKind;
}
function guessGrade(label,url,grades){
  const s=`${label} ${decodeURIComponent(url)}`;
  for(const g of cfg.targetGrades){if(new RegExp(`(?:صف|grade|/|_|-)\\s*${g}(?:\\D|$)`,'i').test(s))return g}
  return grades?.length===1?grades[0]:null;
}
function normalizeSubject(value){
  if(!value)return null;
  const s=String(value).toLowerCase();
  if(/رياض|math/.test(s))return 'الرياضيات';
  if(/عرب|لغتنا/.test(s))return 'اللغة العربية';
  if(/english|انجلي|إنجلي|اللغة الإنجليزية/.test(s))return 'English';
  if(/علوم|science/.test(s))return 'العلوم والحياة';
  return null;
}
function guessSubject(label,url){return normalizeSubject(`${label} ${decodeURIComponent(url)}`)}
function guessSemester(label,url,defaultSemester){
  if(defaultSemester)return defaultSemester;
  const s=`${label} ${decodeURIComponent(url)}`.toLowerCase();
  if(/(?:الفصل|semester|p)[-_ ]?1\b|فصل أول|فصل اول/.test(s))return 1;
  if(/(?:الفصل|semester|p)[-_ ]?2\b|فصل ثاني|فصل ثان/.test(s))return 2;
  return null;
}
function safeName(item,index){
  const hash=crypto.createHash('sha1').update(item.url).digest('hex').slice(0,10);
  return `${String(index+1).padStart(4,'0')}_g${item.grade||'x'}_s${item.semester||'x'}_${item.subject?.replace(/\s+/g,'-')||'mixed'}_${item.kind}_${hash}.pdf`.replace(/[\\/:*?"<>|]/g,'-');
}
function sha256(buffer){return crypto.createHash('sha256').update(buffer).digest('hex')}
function metadataMarkdown(item,fileName,hash,bytes){
  return `# Palestinian Curriculum Source Metadata\n\n- File: ${fileName}\n- Label: ${item.label||''}\n- Grade: ${item.grade??'unknown'}\n- Semester: ${item.semester??'unknown'}\n- Subject: ${item.subject||'unknown'}\n- Resource type: ${item.kind}\n- Authority: ${item.authority}\n- Source page: ${item.sourcePage}\n- Original URL: ${item.url}\n- SHA-256: ${hash}\n- Bytes: ${bytes}\n\n## Grounding rule\nUse this document only as provenance metadata for its paired curriculum file. Official ministry/Palestinian e-learning sources outrank generated explanations and external educational sites.\n`;
}

async function discover(){
  const found=[];
  for(const page of cfg.pages){
    console.log('crawl',page.url);
    try{
      const res=await fetch(page.url,{headers:{'user-agent':'Salma-Sama-Curriculum-KB/2.0'}});
      if(!res.ok){console.warn('skip',res.status,page.url);continue}
      const html=await res.text();
      const re=/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let m;
      while((m=re.exec(html))){
        const url=cleanHref(m[1],page.url);if(!url)continue;
        const label=stripHtml(m[2]);
        const pathname=new URL(url).pathname.toLowerCase();
        if(!pathname.endsWith('.pdf')&&!pathname.includes('/download')&&!url.includes('blob.core.windows.net'))continue;
        const grade=guessGrade(label,url,page.grades);
        if(grade&&!cfg.targetGrades.includes(grade))continue;
        const subject=normalizeSubject(page.subject)||guessSubject(label,url);
        if(subject&&cfg.targetSubjects?.length&&!cfg.targetSubjects.includes(subject))continue;
        const semester=guessSemester(label,url,page.semester);
        if(semester&&cfg.targetSemesters?.length&&!cfg.targetSemesters.includes(semester))continue;
        const kind=guessKind(label,url,page.kind);
        const sourcePriority=(page.subject&&page.semester)?100:page.subject?96:page.kind==='teacher-guide'?92:90;
        found.push({url,label:label||path.basename(pathname),grade,semester,subject,kind,authority:page.authority,sourcePage:page.url,sourcePriority,enabled:true});
      }
    }catch(err){console.warn('crawl failed',page.url,err.message)}
  }
  const unique=[...new Map(found.map(x=>[x.url,x])).values()];
  unique.sort((a,b)=>(b.sourcePriority||0)-(a.sourcePriority||0)||(a.grade||99)-(b.grade||99)||String(a.subject).localeCompare(String(b.subject))||a.kind.localeCompare(b.kind));
  await fsp.writeFile(catalogPath,JSON.stringify({generatedAt:new Date().toISOString(),count:unique.length,files:unique},null,2));
  console.log(`discovered ${unique.length} candidate curriculum files -> ${catalogPath}`);
}

async function downloadEnabled(){
  const catalog=JSON.parse(await fsp.readFile(catalogPath,'utf8'));
  await fsp.mkdir(outDir,{recursive:true});
  const downloaded=[];
  for(const [index,item] of catalog.files.filter(x=>x.enabled).entries()){
    try{
      const fileName=safeName(item,index);const filePath=path.join(outDir,fileName);let buffer;
      if(!fs.existsSync(filePath)){
        console.log('download',item.url);
        const res=await fetch(item.url,{headers:{'user-agent':'Salma-Sama-Curriculum-KB/2.0'}});
        if(!res.ok)throw new Error(`HTTP ${res.status}`);
        buffer=Buffer.from(await res.arrayBuffer());
        const contentType=String(res.headers.get('content-type')||'').toLowerCase();
        const looksPdf=buffer.subarray(0,5).toString()==='%PDF-';
        if(!looksPdf&&!contentType.includes('pdf'))throw new Error(`not a PDF (${contentType||'unknown content-type'})`);
        if(buffer.length<1024)throw new Error(`file too small (${buffer.length} bytes)`);
        await fsp.writeFile(filePath,buffer);
      }else buffer=await fsp.readFile(filePath);
      const hash=sha256(buffer);const metaName=`${fileName}.meta.md`;const metaPath=path.join(outDir,metaName);
      await fsp.writeFile(metaPath,metadataMarkdown(item,fileName,hash,buffer.length),'utf8');
      downloaded.push({...item,filePath,fileName,metadataPath:metaPath,metadataFileName:metaName,sha256:hash,bytes:buffer.length});
    }catch(err){console.warn('download failed',item.url,err.message)}
  }
  await fsp.writeFile(downloadedPath,JSON.stringify({generatedAt:new Date().toISOString(),count:downloaded.length,files:downloaded},null,2));
  console.log(`downloaded and validated ${downloaded.length} PDF files`);
}

async function upload(){
  if(!process.env.OPENAI_API_KEY)throw new Error('OPENAI_API_KEY is required');
  const downloaded=JSON.parse(await fsp.readFile(downloadedPath,'utf8'));
  const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
  let vectorStoreId=process.env.OPENAI_CURRICULUM_VECTOR_STORE_ID;
  if(!vectorStoreId){
    const store=await client.vectorStores.create({name:'Palestinian Curriculum - Salma Sama'});
    vectorStoreId=store.id;
    console.log('created vector store:',vectorStoreId);
  }
  let uploadedCount=0;
  for(const item of downloaded.files){
    for(const filePath of [item.filePath,item.metadataPath].filter(Boolean)){
      console.log('upload',path.basename(filePath));
      const indexed=await client.vectorStores.files.uploadAndPoll(vectorStoreId,fs.createReadStream(filePath),{pollIntervalMs:1000});
      if(indexed.status!=='completed')console.warn('index status',indexed.status,path.basename(filePath));
      else uploadedCount++;
    }
  }
  await fsp.writeFile(path.join(root,'curriculum/vector-store.json'),JSON.stringify({vectorStoreId,uploadedAt:new Date().toISOString(),sourceFiles:downloaded.files.length,indexedFiles:uploadedCount},null,2));
  console.log('\nSet this on Render:');
  console.log(`OPENAI_CURRICULUM_VECTOR_STORE_ID=${vectorStoreId}`);
}

async function validateCatalog(){
  const catalog=JSON.parse(await fsp.readFile(catalogPath,'utf8'));
  const stats={total:catalog.files.length,byGrade:{},bySubject:{},byKind:{},unknownSubject:0,unknownGrade:0};
  for(const x of catalog.files){
    if(x.grade)stats.byGrade[x.grade]=(stats.byGrade[x.grade]||0)+1;else stats.unknownGrade++;
    if(x.subject)stats.bySubject[x.subject]=(stats.bySubject[x.subject]||0)+1;else stats.unknownSubject++;
    stats.byKind[x.kind]=(stats.byKind[x.kind]||0)+1;
  }
  console.log(JSON.stringify(stats,null,2));
}

if(mode==='discover')await discover();
else if(mode==='download')await downloadEnabled();
else if(mode==='upload')await upload();
else if(mode==='validate')await validateCatalog();
else if(mode==='all'){await discover();await downloadEnabled();await validateCatalog();await upload()}
else throw new Error('Use: discover | download | validate | upload | all');
