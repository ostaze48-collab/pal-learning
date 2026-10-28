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
const UA='Salma-Sama-Curriculum-KB/3.0';

function cleanHref(href,base){
  if(!href)return null;
  try{const u=new URL(href.replace(/&amp;/g,'&'),base);u.hash='';return u.href}catch{return null}
}
function stripHtml(text){return text.replace(/<!--[\s\S]*?-->/g,' ').replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<nav[\s\S]*?<\/nav>/gi,' ').replace(/<header[\s\S]*?<\/header>/gi,' ').replace(/<footer[\s\S]*?<\/footer>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&#8211;|&#8212;/g,'-').replace(/&#8217;/g,"'").replace(/\s+/g,' ').trim()}
function pageTitle(html,url){const m=html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);return stripHtml(m?.[1]||'')||new URL(url).pathname}
function anchors(html,base){
  const out=[];const re=/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;let m;
  while((m=re.exec(html))){const url=cleanHref(m[1],base);if(url)out.push({url,label:stripHtml(m[2])})}
  return out;
}
function isPdfLike(url){const u=new URL(url);const p=u.pathname.toLowerCase();return p.endsWith('.pdf')||p.includes('/download')||url.includes('blob.core.windows.net')}
function isHtmlChild(rootUrl,candidate){
  try{
    const root=new URL(rootUrl),u=new URL(candidate);
    if(u.origin!==root.origin||u.href===root.href||isPdfLike(u.href))return false;
    const prefix=root.pathname.endsWith('/')?root.pathname:`${root.pathname}/`;
    if(!u.pathname.startsWith(prefix))return false;
    if(/\.(?:jpg|jpeg|png|gif|webp|svg|zip|docx?|xlsx?|pptx?|mp4|mp3)$/i.test(u.pathname))return false;
    return true;
  }catch{return false}
}
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
function indexDecision(item){
  if(item.authority==='external')return {indexable:false,rejectionReason:'external_source'};
  if(!item.subject)return {indexable:false,rejectionReason:'unknown_subject'};
  if(!cfg.targetSubjects.includes(item.subject))return {indexable:false,rejectionReason:'non_target_subject'};
  if(item.semester&&cfg.targetSemesters?.length&&!cfg.targetSemesters.includes(item.semester))return {indexable:false,rejectionReason:'non_target_semester'};
  if(!item.grade)return {indexable:false,rejectionReason:'unknown_grade'};
  if(!cfg.targetGrades.includes(item.grade))return {indexable:false,rejectionReason:'non_target_grade'};
  if(!['curriculum','package','teacher-guide','worksheet','assessment','solution','framework'].includes(item.kind))return {indexable:false,rejectionReason:'unsupported_kind'};
  return {indexable:true,rejectionReason:null};
}
function sourcePriority(page,depth=0){const base=(page.subject&&page.semester)?100:page.subject?96:page.kind==='teacher-guide'?92:page.kind==='framework'?91:90;return Math.max(80,base-depth)}
function baseItem(page,url,label,sourcePage,resourceFormat,depth=0){
  const grade=guessGrade(label,url,page.grades);
  const subject=normalizeSubject(page.subject)||guessSubject(label,url);
  const semester=guessSemester(label,url,page.semester);
  const kind=resourceFormat==='html'?'curriculum':guessKind(label,url,page.kind);
  const base={url,label:label||new URL(url).pathname,grade,semester,subject,kind,authority:page.authority,sourcePage,rootSourcePage:page.url,sourcePriority:sourcePriority(page,depth),resourceFormat,enabled:true};
  return {...base,...indexDecision(base)};
}
function safeName(item,index){
  const hash=crypto.createHash('sha1').update(`${item.resourceFormat}:${item.url}`).digest('hex').slice(0,10);
  const ext=item.resourceFormat==='html'?'.md':'.pdf';
  return `${String(index+1).padStart(4,'0')}_g${item.grade||'x'}_s${item.semester||'x'}_${item.subject?.replace(/\s+/g,'-')||'mixed'}_${item.kind}_${hash}${ext}`.replace(/[\\/:*?"<>|]/g,'-');
}
function sha256(buffer){return crypto.createHash('sha256').update(buffer).digest('hex')}
function provenanceLines(item){return [`Grade: ${item.grade??'unknown'}`,`Semester: ${item.semester??'unknown'}`,`Subject: ${item.subject||'unknown'}`,`Resource type: ${item.kind}`,`Authority: ${item.authority}`,`Source priority: ${item.sourcePriority??'unknown'}`,`Source page: ${item.sourcePage}`,`Root source page: ${item.rootSourcePage||item.sourcePage}`,`Original URL: ${item.url}`]}
function metadataMarkdown(item,fileName,hash,bytes){return `# Palestinian Curriculum Source Metadata\n\n- File: ${fileName}\n- Label: ${item.label||''}\n- ${provenanceLines(item).join('\n- ')}\n- SHA-256: ${hash}\n- Bytes: ${bytes}\n\n## Grounding rule\nUse this document only as provenance metadata for its paired curriculum file. Official ministry/Palestinian e-learning sources outrank generated explanations and external educational sites.\n`}
function htmlMarkdown(item,html){
  const text=stripHtml(html).slice(0,180000);
  return `# ${item.label||pageTitle(html,item.url)}\n\n- ${provenanceLines(item).join('\n- ')}\n\n## Official page text\n\n${text}\n\n## Grounding rule\nThis is a text snapshot of an official Palestinian curriculum page. Preserve the curriculum framing and do not treat navigation or unrelated page chrome as lesson content.\n`;
}
async function fetchHtml(url){const res=await fetch(url,{headers:{'user-agent':UA}});if(!res.ok)throw new Error(`HTTP ${res.status}`);return await res.text()}
function collectPdfCandidates(page,sourceUrl,html,depth,found){
  for(const a of anchors(html,sourceUrl))if(isPdfLike(a.url)){
    const item=baseItem(page,a.url,a.label||path.basename(new URL(a.url).pathname),sourceUrl,'pdf',depth);
    if(item.grade&&!cfg.targetGrades.includes(item.grade))continue;
    if(item.subject&&cfg.targetSubjects?.length&&!cfg.targetSubjects.includes(item.subject))continue;
    if(item.semester&&cfg.targetSemesters?.length&&!cfg.targetSemesters.includes(item.semester))continue;
    found.push(item);
  }
}

async function discover(){
  const found=[];const visitedPages=new Set();
  for(const page of cfg.pages){
    console.log('crawl',page.url);
    try{
      const html=await fetchHtml(page.url);visitedPages.add(page.url);
      collectPdfCandidates(page,page.url,html,0,found);
      if(page.captureHtml)found.push(baseItem(page,page.url,pageTitle(html,page.url),page.url,'html',0));
      if(Number(page.crawlDepth||0)>0){
        const children=[...new Set(anchors(html,page.url).map(a=>a.url).filter(u=>isHtmlChild(page.url,u)))].slice(0,Number(page.maxChildPages||60));
        console.log(`  child pages: ${children.length}`);
        for(const child of children){
          if(visitedPages.has(child))continue;visitedPages.add(child);
          try{
            const childHtml=await fetchHtml(child);
            collectPdfCandidates(page,child,childHtml,1,found);
            if(page.captureHtml)found.push(baseItem(page,child,pageTitle(childHtml,child),child,'html',1));
          }catch(err){console.warn('  child crawl failed',child,err.message)}
        }
      }
    }catch(err){console.warn('crawl failed',page.url,err.message)}
  }
  const unique=[...new Map(found.map(x=>[`${x.resourceFormat}:${x.url}`,x])).values()];
  unique.sort((a,b)=>Number(b.indexable)-Number(a.indexable)||(b.sourcePriority||0)-(a.sourcePriority||0)||(a.grade||99)-(b.grade||99)||String(a.subject).localeCompare(String(b.subject))||a.kind.localeCompare(b.kind));
  const indexableCount=unique.filter(x=>x.indexable).length;
  await fsp.writeFile(catalogPath,JSON.stringify({generatedAt:new Date().toISOString(),count:unique.length,indexableCount,files:unique},null,2));
  console.log(`discovered ${unique.length} candidate curriculum resources; ${indexableCount} pass strict indexing rules -> ${catalogPath}`);
}

async function downloadEnabled(){
  const catalog=JSON.parse(await fsp.readFile(catalogPath,'utf8'));
  await fsp.mkdir(outDir,{recursive:true});
  const selected=catalog.files.filter(x=>x.enabled&&x.indexable);
  console.log(`selected ${selected.length} strictly classified resources for download`);
  const downloaded=[];
  for(const [index,item] of selected.entries()){
    try{
      const fileName=safeName(item,index);const filePath=path.join(outDir,fileName);
      if(item.resourceFormat==='html'){
        if(!fs.existsSync(filePath)){const html=await fetchHtml(item.url);await fsp.writeFile(filePath,htmlMarkdown(item,html),'utf8')}
        const buffer=await fsp.readFile(filePath);downloaded.push({...item,filePath,fileName,metadataPath:null,metadataFileName:null,sha256:sha256(buffer),bytes:buffer.length});continue;
      }
      let buffer;
      if(!fs.existsSync(filePath)){
        console.log('download',item.url);
        const res=await fetch(item.url,{headers:{'user-agent':UA}});if(!res.ok)throw new Error(`HTTP ${res.status}`);
        buffer=Buffer.from(await res.arrayBuffer());
        const contentType=String(res.headers.get('content-type')||'').toLowerCase();const looksPdf=buffer.subarray(0,5).toString()==='%PDF-';
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
  console.log(`downloaded and validated ${downloaded.length} resources`);
}

async function upload(){
  if(!process.env.OPENAI_API_KEY)throw new Error('OPENAI_API_KEY is required');
  const downloaded=JSON.parse(await fsp.readFile(downloadedPath,'utf8'));const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
  let vectorStoreId=process.env.OPENAI_CURRICULUM_VECTOR_STORE_ID;if(!vectorStoreId){const store=await client.vectorStores.create({name:'Palestinian Curriculum - Salma Sama'});vectorStoreId=store.id;console.log('created vector store:',vectorStoreId)}
  let uploadedCount=0;
  for(const item of downloaded.files)for(const filePath of [item.filePath,item.metadataPath].filter(Boolean)){
    console.log('upload',path.basename(filePath));const indexed=await client.vectorStores.files.uploadAndPoll(vectorStoreId,fs.createReadStream(filePath),{pollIntervalMs:1000});
    if(indexed.status!=='completed')console.warn('index status',indexed.status,path.basename(filePath));else uploadedCount++;
  }
  await fsp.writeFile(path.join(root,'curriculum/vector-store.json'),JSON.stringify({vectorStoreId,uploadedAt:new Date().toISOString(),sourceFiles:downloaded.files.length,indexedFiles:uploadedCount},null,2));
  console.log('\nSet this on Render:');console.log(`OPENAI_CURRICULUM_VECTOR_STORE_ID=${vectorStoreId}`);
}

async function validateCatalog(){
  const catalog=JSON.parse(await fsp.readFile(catalogPath,'utf8'));
  const stats={total:catalog.files.length,indexable:0,rejected:0,byGrade:{},bySubject:{},byKind:{},byFormat:{},indexableByGrade:{},indexableBySubject:{},indexableByKind:{},indexableByFormat:{},rejectionReasons:{},unknownSubject:0,unknownGrade:0};
  for(const x of catalog.files){
    if(x.grade)stats.byGrade[x.grade]=(stats.byGrade[x.grade]||0)+1;else stats.unknownGrade++;
    if(x.subject)stats.bySubject[x.subject]=(stats.bySubject[x.subject]||0)+1;else stats.unknownSubject++;
    stats.byKind[x.kind]=(stats.byKind[x.kind]||0)+1;stats.byFormat[x.resourceFormat]=(stats.byFormat[x.resourceFormat]||0)+1;
    if(x.indexable){stats.indexable++;stats.indexableByGrade[x.grade]=(stats.indexableByGrade[x.grade]||0)+1;stats.indexableBySubject[x.subject]=(stats.indexableBySubject[x.subject]||0)+1;stats.indexableByKind[x.kind]=(stats.indexableByKind[x.kind]||0)+1;stats.indexableByFormat[x.resourceFormat]=(stats.indexableByFormat[x.resourceFormat]||0)+1}
    else{stats.rejected++;const reason=x.rejectionReason||'unknown';stats.rejectionReasons[reason]=(stats.rejectionReasons[reason]||0)+1}
  }
  console.log(JSON.stringify(stats,null,2));
}

if(mode==='discover')await discover();
else if(mode==='download')await downloadEnabled();
else if(mode==='upload')await upload();
else if(mode==='validate')await validateCatalog();
else if(mode==='all'){await discover();await downloadEnabled();await validateCatalog();await upload()}
else throw new Error('Use: discover | download | validate | upload | all');
