import type {Lesson} from './data';

export type EvidenceQuality='direct'|'inferred'|'missing';
export type ObjectiveState='not_taught'|'taught_unverified'|'verified'|'needs_support'|'needs_stronger_evidence';

export type ObjectiveQuestionLink={questionId:string;quality:EvidenceQuality;similarity:number};
export type ObjectiveEvidence={
 id:number;
 text:string;
 taught:boolean;
 state:ObjectiveState;
 questionLinks:ObjectiveQuestionLink[];
 attempts:number;
 correctEvidence:number;
 lastCorrect:boolean|null;
 verificationScore:number|null;
 richEvidenceCount:number;
 directRichEvidence:number;
};

export type ObjectiveCoverageReport={
 lessonId:string;
 student:string;
 objectives:ObjectiveEvidence[];
 taughtCount:number;
 verifiedCount:number;
 needsSupport:number[];
 needsStrongerEvidence:number[];
 allTaught:boolean;
 allVerified:boolean;
 updatedAt:string;
};

type EvidenceEvent={
 event?:string;
 question?:string;
 correct?:boolean|null;
 at?:string;
 objectiveId?:number;
 quality?:EvidenceQuality;
 outcome?:string;
 confidence?:number;
 mode?:string;
};

const stopWords=new Set([
 'من','في','على','إلى','الى','عن','أن','ان','ما','ماذا','كيف','هو','هي','هذا','هذه','ذلك','التي','الذي','ثم','أو','او','و','مع','بين','يمكن','تستطيع','يعرف','تعرف','يفهم','فهم','استخدام','استخدم','تطبيق','يطبق','تحديد','حدد','تمييز','يميز',
 'the','a','an','to','of','in','on','and','or','is','are','be','can','use','using','identify','understand','apply','explain'
]);

function normalize(text:string){
 return text.toLowerCase()
  .replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي')
  .replace(/[ًٌٍَُِّْـ]/g,'')
  .replace(/[^\p{L}\p{N}\s]/gu,' ')
  .replace(/\s+/g,' ')
  .trim();
}

function tokens(text:string){return new Set(normalize(text).split(' ').filter(x=>x.length>2&&!stopWords.has(x)))}
function similarity(a:string,b:string){const aa=tokens(a),bb=tokens(b);if(!aa.size||!bb.size)return 0;let overlap=0;for(const x of aa)if(bb.has(x))overlap++;return overlap/Math.max(1,Math.min(aa.size,bb.size))}

export function buildObjectiveQuestionMap(lesson:Lesson){
 const objectives=lesson.learningPoints.length?lesson.learningPoints:[lesson.summary];
 return objectives.map((objective,index)=>{
   const ranked=lesson.questions.map((q,qIndex)=>({questionId:q.id,qIndex,similarity:similarity(objective,`${q.text} ${q.explanation}`)})).sort((a,b)=>b.similarity-a.similarity);
   const direct=ranked.filter(x=>x.similarity>=0.22).slice(0,2);
   if(direct.length)return {id:index+1,text:objective,links:direct.map(x=>({questionId:x.questionId,quality:'direct' as const,similarity:x.similarity}))};
   if(lesson.questions.length){const fallback=lesson.questions[index%lesson.questions.length];return {id:index+1,text:objective,links:[{questionId:fallback.id,quality:'inferred' as const,similarity:ranked[0]?.similarity??0}]};}
   return {id:index+1,text:objective,links:[] as ObjectiveQuestionLink[]};
 });
}

export function evaluateObjectiveCoverage(lesson:Lesson,opts:{taught:boolean[];events:EvidenceEvent[]}):ObjectiveCoverageReport{
 const mapped=buildObjectiveQuestionMap(lesson);
 const latestByQuestion=new Map<string,boolean>();
 const attemptsByQuestion=new Map<string,number>();
 const correctByQuestion=new Map<string,number>();
 for(const e of opts.events){
   if(e.event!=='quiz_answer'||!e.question||typeof e.correct!=='boolean')continue;
   latestByQuestion.set(e.question,e.correct);attemptsByQuestion.set(e.question,(attemptsByQuestion.get(e.question)||0)+1);if(e.correct)correctByQuestion.set(e.question,(correctByQuestion.get(e.question)||0)+1);
 }
 const objectives:ObjectiveEvidence[]=mapped.map((o,index)=>{
   const taught=Boolean(opts.taught[index]);
   const directLinks=o.links.filter(x=>x.quality==='direct');
   const links=o.links;
   const attempts=links.reduce((s,l)=>s+(attemptsByQuestion.get(l.questionId)||0),0);
   const correctEvidence=links.reduce((s,l)=>s+(correctByQuestion.get(l.questionId)||0),0);
   const latest=links.map(l=>latestByQuestion.has(l.questionId)?latestByQuestion.get(l.questionId)!:null).filter(x=>x!==null) as boolean[];
   const quizLastCorrect=latest.length?latest.every(Boolean):null;
   const quizScore=attempts?Math.round(correctEvidence/attempts*100):null;

   const rich=opts.events.filter(e=>e.event==='objective_evidence'&&Number(e.objectiveId)===o.id);
   const scoredRich=rich.filter(e=>typeof e.correct==='boolean');
   const reliableDirect=rich.filter(e=>e.quality==='direct'&&typeof e.correct==='boolean'&&(Number(e.confidence??1)>=0.5||e.mode==='local_choice'));
   const directTrue=reliableDirect.some(e=>e.correct===true);
   const directFalse=reliableDirect.some(e=>e.correct===false);
   const latestRich=[...reliableDirect].reverse()[0];
   const richLast=latestRich?Boolean(latestRich.correct):null;
   const richScore=scoredRich.length?Math.round(scoredRich.filter(e=>e.correct===true).length/scoredRich.length*100):null;

   let lastCorrect:boolean|null=richLast!==null?richLast:quizLastCorrect;
   let verificationScore:number|null=richScore!==null&&quizScore!==null?Math.round((richScore*0.6)+(quizScore*0.4)):richScore??quizScore;
   let state:ObjectiveState='not_taught';
   if(taught){
     const hasDirectEvidence=directLinks.length>0||reliableDirect.length>0;
     if(directTrue&&verificationScore!==null&&verificationScore>=65)state='verified';
     else if(directFalse)state='needs_support';
     else if(quizLastCorrect===true&&directLinks.length>0&&quizScore!==null&&quizScore>=70)state='verified';
     else if(attempts>0&&quizLastCorrect===false&&directLinks.length>0)state='needs_support';
     else if(!hasDirectEvidence)state='needs_stronger_evidence';
     else state='taught_unverified';
   }
   return {id:o.id,text:o.text,taught,state,questionLinks:links,attempts:attempts+rich.length,correctEvidence:correctEvidence+rich.filter(e=>e.correct===true).length,lastCorrect,verificationScore,richEvidenceCount:rich.length,directRichEvidence:reliableDirect.length};
 });
 const needsSupport=objectives.filter(x=>x.state==='needs_support').map(x=>x.id);
 const needsStrongerEvidence=objectives.filter(x=>x.state==='needs_stronger_evidence'||x.state==='taught_unverified').map(x=>x.id);
 const verifiedCount=objectives.filter(x=>x.state==='verified').length;
 const taughtCount=objectives.filter(x=>x.taught).length;
 return {lessonId:lesson.id,student:lesson.student,objectives,taughtCount,verifiedCount,needsSupport,needsStrongerEvidence,allTaught:taughtCount===objectives.length,allVerified:verifiedCount===objectives.length,updatedAt:new Date().toISOString()};
}
