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

type QuizEvent={event?:string;question?:string;correct?:boolean;at?:string};

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

function tokens(text:string){
 return new Set(normalize(text).split(' ').filter(x=>x.length>2&&!stopWords.has(x)));
}

function similarity(a:string,b:string){
 const aa=tokens(a),bb=tokens(b);if(!aa.size||!bb.size)return 0;
 let overlap=0;for(const x of aa)if(bb.has(x))overlap++;
 return overlap/Math.max(1,Math.min(aa.size,bb.size));
}

export function buildObjectiveQuestionMap(lesson:Lesson){
 const objectives=lesson.learningPoints.length?lesson.learningPoints:[lesson.summary];
 return objectives.map((objective,index)=>{
   const ranked=lesson.questions.map((q,qIndex)=>({
     questionId:q.id,
     qIndex,
     similarity:similarity(objective,`${q.text} ${q.explanation}`)
   })).sort((a,b)=>b.similarity-a.similarity);
   const direct=ranked.filter(x=>x.similarity>=0.22).slice(0,2);
   if(direct.length)return {id:index+1,text:objective,links:direct.map(x=>({questionId:x.questionId,quality:'direct' as const,similarity:x.similarity}))};
   if(lesson.questions.length){
     const fallback=lesson.questions[index%lesson.questions.length];
     return {id:index+1,text:objective,links:[{questionId:fallback.id,quality:'inferred' as const,similarity:ranked[0]?.similarity??0}]};
   }
   return {id:index+1,text:objective,links:[] as ObjectiveQuestionLink[]};
 });
}

export function evaluateObjectiveCoverage(lesson:Lesson,opts:{taught:boolean[];events:QuizEvent[]}):ObjectiveCoverageReport{
 const mapped=buildObjectiveQuestionMap(lesson);
 const latestByQuestion=new Map<string,boolean>();
 const attemptsByQuestion=new Map<string,number>();
 const correctByQuestion=new Map<string,number>();
 for(const e of opts.events){
   if(e.event!=='quiz_answer'||!e.question||typeof e.correct!=='boolean')continue;
   latestByQuestion.set(e.question,e.correct);
   attemptsByQuestion.set(e.question,(attemptsByQuestion.get(e.question)||0)+1);
   if(e.correct)correctByQuestion.set(e.question,(correctByQuestion.get(e.question)||0)+1);
 }
 const objectives:ObjectiveEvidence[]=mapped.map((o,index)=>{
   const taught=Boolean(opts.taught[index]);
   const directLinks=o.links.filter(x=>x.quality==='direct');
   const links=o.links;
   const attempts=links.reduce((s,l)=>s+(attemptsByQuestion.get(l.questionId)||0),0);
   const correctEvidence=links.reduce((s,l)=>s+(correctByQuestion.get(l.questionId)||0),0);
   const latest=links.map(l=>latestByQuestion.has(l.questionId)?latestByQuestion.get(l.questionId)!:null).filter(x=>x!==null) as boolean[];
   const lastCorrect=latest.length?latest.every(Boolean):null;
   const verificationScore=attempts?Math.round(correctEvidence/attempts*100):null;
   let state:ObjectiveState='not_taught';
   if(taught){
     if(!links.length||!directLinks.length)state='needs_stronger_evidence';
     else if(lastCorrect===true&&verificationScore!==null&&verificationScore>=70)state='verified';
     else if(attempts>0)state='needs_support';
     else state='taught_unverified';
   }
   return {id:o.id,text:o.text,taught,state,questionLinks:links,attempts,correctEvidence,lastCorrect,verificationScore};
 });
 const needsSupport=objectives.filter(x=>x.state==='needs_support').map(x=>x.id);
 const needsStrongerEvidence=objectives.filter(x=>x.state==='needs_stronger_evidence'||x.state==='taught_unverified').map(x=>x.id);
 const verifiedCount=objectives.filter(x=>x.state==='verified').length;
 const taughtCount=objectives.filter(x=>x.taught).length;
 return {lessonId:lesson.id,student:lesson.student,objectives,taughtCount,verifiedCount,needsSupport,needsStrongerEvidence,allTaught:taughtCount===objectives.length,allVerified:verifiedCount===objectives.length,updatedAt:new Date().toISOString()};
}
