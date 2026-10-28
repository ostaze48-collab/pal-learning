import OpenAI from 'openai';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const root=process.cwd();
const cfg=JSON.parse(await fsp.readFile(path.join(root,'curriculum/source-pages.json'),'utf8'));
const outDir=path.join(root,'curriculum/discovered');
const catalogPath=path.join(root,'curriculum/discovered.json');
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
function guessSubject(label,url){
  const s=`${label} ${decodeURIComponent(url)}`.toLowerCase();
  if(/رياض|math/.test(s))return 'الرياضيات';
  if(/عرب|لغتنا/.test(s))return 'اللغة العربية';
  if(/english|انجلي|إنجلي/.test(s))return 'English';
  if(/علوم|science/.test(s))return 'العلوم والحياة';
  return null;
}
function safeName(item,index){
  const hash=crypto.createHash('sha1').update(item.url).digest('hex').slice(0,10);
  const ext=(new URL(item.url).pathname.match(/\.[a-z0-9]{2,5}$/i)||['.pdf'])[0];
  return `${String(index+1).padStart(4,'0')}_g${item.grade||'x'}_${item.subject?.replace(/\s+/g,'-')||'mixed'}_${item.kind}_${hash}${ext}`.replace(/[\\/:*?"<>|]/g,'-');
}

async function discover(){
  const found=[];
  for(const page of cfg.pages){
    console.log('crawl',page.url);
    try{
      const res=await fetch(page.url,{headers:{'user-agent':'Salma-Sama-Curriculum-KB/1.0'}});
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
        const subject=guessSubject(label,url);
        const kind=guessKind(label,url,page.kind);
        found.push({url,label:label||path.basename(pathname),grade,subject,kind,authority:page.authority,sourcePage:page.url,enabled:true});
      }
    }catch(err){console.warn('crawl failed',page.url,err.message)}
  }
  const unique=[...new Map(found.map(x=>[x.url,x])).values()];
  unique.sort((a,b)=>(a.grade||99)-(b.grade||99)||String(a.subject).localeCompare(String(b.subject))||a.kind.localeCompare(b.kind));
  await fsp.writeFile(catalogPath,JSON.stringify({generatedAt:new Date().toISOString(),count:unique.length,files:unique},null,2));
  console.log(`discovered ${unique.length} candidate curriculum files -> ${catalogPath}`);
}

async function downloadEnabled(){
  const catalog=JSON.parse(await fsp.readFile(catalogPath,'utf8'));
  await fsp.mkdir(outDir,{recursive:true});
  const downloaded=[];
  for(const [index,item] of catalog.files.filter(x=>x.enabled).entries()){
    try{
      const fileName=safeName(item,index);const filePath=path.join(outDir,fileName);
      if(!fs.existsSync(filePath)){
        console.log('download',item.url);
        const res=await fetch(item.url,{headers:{'user-agent':'Salma-Sama-Curriculum-KB/1.0'}});
        if(!res.ok)throw new Error(`HTTP ${res.status}`);
        const buf=Buffer.from(await res.arrayBuffer());
        await fsp.writeFile(filePath,buf);
      }
      downloaded.push({...item,filePath,fileName});
    }catch(err){console.warn('download failed',item.url,err.message)}
  }
  await fsp.writeFile(path.join(root,'curriculum/downloaded.json'),JSON.stringify({generatedAt:new Date().toISOString(),count:downloaded.length,files:downloaded},null,2));
  console.log(`downloaded ${downloaded.length} files`);
}

async function upload(){
  if(!process.env.OPENAI_API_KEY)throw new Error('OPENAI_API_KEY is required');
  const downloaded=JSON.parse(await fsp.readFile(path.join(root,'curriculum/downloaded.json'),'utf8'));
  const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
  let vectorStoreId=process.env.OPENAI_CURRICULUM_VECTOR_STORE_ID;
  if(!vectorStoreId){
    const store=await client.vectorStores.create({name:'Palestinian Curriculum - Salma Sama'});
    vectorStoreId=store.id;
    console.log('created vector store:',vectorStoreId);
  }
  for(const item of downloaded.files){
    console.log('upload',item.fileName);
    const indexed=await client.vectorStores.files.uploadAndPoll(vectorStoreId,fs.createReadStream(item.filePath),{pollIntervalMs:1000});
    if(indexed.status!=='completed')console.warn('index status',indexed.status,item.fileName);
  }
  await fsp.writeFile(path.join(root,'curriculum/vector-store.json'),JSON.stringify({vectorStoreId,uploadedAt:new Date().toISOString(),count:downloaded.files.length},null,2));
  console.log('\nSet this on Render:');
  console.log(`OPENAI_CURRICULUM_VECTOR_STORE_ID=${vectorStoreId}`);
}

if(mode==='discover')await discover();
else if(mode==='download')await downloadEnabled();
else if(mode==='upload')await upload();
else if(mode==='all'){await discover();await downloadEnabled();await upload()}
else throw new Error('Use: discover | download | upload | all');
