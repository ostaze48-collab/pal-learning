import {lessons,type Lesson} from './data';

export type ObjectiveRetentionStatus='learning'|'due'|'retained'|'needs_support'|'unscored';
export type ObjectiveRetentionRecord={
 lessonId:string;
 student:string;
 objectiveId:number;
 objectiveText:string;
 level:number;
 status:ObjectiveRetentionStatus;
 dueAt:string;
 lastEvidenceAt:string;
 lastCorrect:boolean|null;
 attempts:number;
 updatedAt:string;
};
export type DueObjectiveReview={lesson:Lesson;record:ObjectiveRetentionRecord};

const intervals=[1,3,7,14,30];
function key(student:string,lessonId:string,objectiveId:number){return `objectiveReview:${student}:${lessonId}:${objectiveId}`}
function dayKey(time=Date.now()){const d=new Date(time);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function read(keyName:string){if(typeof window==='undefined')return null;const raw=localStorage.getItem(keyName);if(!raw)return null;try{return JSON.parse(raw) as ObjectiveRetentionRecord}catch{return null}}
function nextDue(level:number,correct:boolean|null,now:number){if(correct===true){const days=intervals[Math.max(0,Math.min(intervals.length-1,level-1))];return now+days*86400000}return now+86400000}

export function recordObjectiveEvidenceForRetention(lesson:Lesson,objectiveId:number,correct:boolean|null,evidenceAt:string){
 if(typeof window==='undefined'||objectiveId<1)return null;
 const objectiveText=lesson.learningPoints[objectiveId-1]||lesson.summary;const storageKey=key(lesson.student,lesson.id,objectiveId);const old=read(storageKey);
 if(old?.lastEvidenceAt===evidenceAt)return old;
 const previousLevel=Math.max(0,Math.min(5,Number(old?.level)||0));
 const level=correct===true?Math.min(5,previousLevel+1):correct===false?Math.max(0,previousLevel-1):previousLevel;
 const now=Date.parse(evidenceAt);const base=Number.isFinite(now)?now:Date.now();const dueAt=new Date(nextDue(Math.max(1,level),correct,base)).toISOString();
 const status:ObjectiveRetentionStatus=correct===true?(level>=3?'retained':'learning'):correct===false?'needs_support':'unscored';
 const record:ObjectiveRetentionRecord={lessonId:lesson.id,student:lesson.student,objectiveId,objectiveText,level,status,dueAt,lastEvidenceAt:evidenceAt,lastCorrect:correct,attempts:Math.max(0,Number(old?.attempts)||0)+1,updatedAt:new Date().toISOString()};
 localStorage.setItem(storageKey,JSON.stringify(record));return record;
}

export function markRetentionRoundCompleted(student:string,at=Date.now()){if(typeof window==='undefined')return;localStorage.setItem(`objectiveRetentionDay:${student}`,dayKey(at))}
export function hasRetentionRoundToday(student:string,now=Date.now()){if(typeof window==='undefined')return false;return localStorage.getItem(`objectiveRetentionDay:${student}`)===dayKey(now)}

export function markObjectiveRetentionDue(record:ObjectiveRetentionRecord){if(typeof window==='undefined')return record;const next={...record,status:'due' as const,updatedAt:new Date().toISOString()};localStorage.setItem(key(record.student,record.lessonId,record.objectiveId),JSON.stringify(next));return next}

export function getObjectiveRetention(student:string,lessonId:string,objectiveId:number){return read(key(student,lessonId,objectiveId))}

export function getDueObjectiveReviews(student:string,now=Date.now(),limit=6):DueObjectiveReview[]{
 if(typeof window==='undefined'||hasRetentionRoundToday(student,now))return [];
 const due:DueObjectiveReview[]=[];
 for(const lesson of lessons){if(lesson.student!==student||lesson.kind==='assessment'||localStorage.getItem(`lesson:${lesson.id}`)!=='done')continue;for(let i=0;i<Math.max(1,lesson.learningPoints.length);i++){const record=read(key(student,lesson.id,i+1));if(!record)continue;const when=new Date(record.dueAt).getTime();if(Number.isFinite(when)&&when<=now)due.push({lesson,record:{...record,status:'due'}})}}
 return due.sort((a,b)=>new Date(a.record.dueAt).getTime()-new Date(b.record.dueAt).getTime()||a.record.level-b.record.level).slice(0,limit);
}