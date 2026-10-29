import {lessons,type Lesson} from './data';
import {getObjectiveRetention,type ObjectiveRetentionRecord} from './objectiveRetention';

export type ObjectiveMasteryStatus='unknown'|'learning'|'needs_support'|'mastered'|'secure'|'review_due';
export type ObjectiveDimensionStatus='unknown'|'evidenced'|'needs_support'|'due';
export type ObjectiveMasteryRecord={
 student:string;
 lessonId:string;
 objectiveId:number;
 objectiveText:string;
 subject:string;
 status:ObjectiveMasteryStatus;
 confidence:number;
 teachingComplete:boolean;
 understanding:ObjectiveDimensionStatus;
 application:ObjectiveDimensionStatus;
 retention:ObjectiveDimensionStatus;
 evidenceKind:string|null;
 evidenceQuality:'direct'|'inferred'|null;
 evidenceCorrect:boolean|null;
 evidenceOutcome:string|null;
 misconceptionId:string|null;
 retentionLevel:number;
 retentionAttempts:number;
 retentionDueAt:string|null;
 lastEvidenceAt:string|null;
};
export type LessonObjectiveMastery={lesson:Lesson;objectives:ObjectiveMasteryRecord[];transfer:'unknown'|'evidenced'|'needs_support';allSecure:boolean;needsSupport:number[];reviewDue:number[]};
export type StudentObjectiveMasteryMap={student:string;lessons:LessonObjectiveMastery[];objectives:ObjectiveMasteryRecord[];updatedAt:string};

type SavedEvidence={objectiveId?:number;scope?:string;kind?:string;quality?:string;correct?:boolean|null;outcome?:string;misconceptionId?:string|null;updatedAt?:string};
function readJson(key:string){if(typeof window==='undefined')return null;const raw=localStorage.getItem(key);if(!raw)return null;try{return JSON.parse(raw)}catch{return null}}
function objectiveTexts(lesson:Lesson){return lesson.learningPoints.length?lesson.learningPoints:[lesson.summary]}
function latestEvidence(lessonId:string,objectiveId:number):SavedEvidence|null{const saved=readJson(`lessonEvidence:${lessonId}`);const rows=Array.isArray(saved?.results)?saved.results:[];const matches=rows.filter((x:any)=>x?.scope==='objective'&&Number(x?.objectiveId)===objectiveId);return matches.length?matches[matches.length-1]:null}
function teachingComplete(lesson:Lesson,objectiveId:number){const events=readJson(`lessonUx:${lesson.id}`);if(Array.isArray(events)&&events.some((e:any)=>e?.event==='teaching_objective_experience_complete'&&Number(e?.objectiveId)===objectiveId))return true;const coverage=readJson(`lessonCoverage:${lesson.id}`);return Boolean(coverage?.objectives?.[objectiveId-1]?.taught)}
function evidenceAt(evidence:SavedEvidence|null){const raw=evidence?.updatedAt;if(raw)return String(raw);return null}
function isApplicationKind(kind:string|null){return ['apply','construct','compare','correct_error','transfer'].includes(String(kind||''))}
function retentionDimension(record:ObjectiveRetentionRecord|null,now:number):ObjectiveDimensionStatus{if(!record)return'unknown';if(record.lastCorrect===false||record.status==='needs_support')return'needs_support';const due=new Date(record.dueAt).getTime();if(Number.isFinite(due)&&due<=now)return'due';if(record.lastCorrect===true)return'evidenced';return'unknown'}
function statusFor(teaching:boolean,evidence:SavedEvidence|null,retention:ObjectiveRetentionRecord|null,now:number):ObjectiveMasteryStatus{
 const correct=typeof evidence?.correct==='boolean'?evidence.correct:null;const misconception=Boolean(evidence?.misconceptionId)||evidence?.outcome==='misconception';
 if(correct===false||misconception||retention?.lastCorrect===false)return'needs_support';
 if(correct===true){const due=new Date(retention?.dueAt||'').getTime();if(retention&&Number.isFinite(due)&&due<=now)return'review_due';if((retention?.level||0)>=3&&retention?.lastCorrect===true)return'secure';return'mastered'}
 if(teaching||evidence)return'learning';return'unknown';
}
function confidenceFor(evidence:SavedEvidence|null,retention:ObjectiveRetentionRecord|null,status:ObjectiveMasteryStatus){if(!evidence)return 0;let score=evidence.quality==='direct'?76:62;if(typeof evidence.correct==='boolean')score+=8;if(evidence.misconceptionId)score+=6;score+=Math.min(12,Math.max(0,Number(retention?.attempts)||0)*3);if(status==='secure')score+=4;return Math.max(0,Math.min(96,score))}

export function buildLessonObjectiveMastery(lesson:Lesson,now=Date.now()):LessonObjectiveMastery{
 const objectives=objectiveTexts(lesson).map((text,index)=>{
  const objectiveId=index+1;const taught=teachingComplete(lesson,objectiveId);const evidence=latestEvidence(lesson.id,objectiveId);const retention=getObjectiveRetention(lesson.student,lesson.id,objectiveId);const status=statusFor(taught,evidence,retention,now);const correct=typeof evidence?.correct==='boolean'?evidence.correct:null;const evidenceKind=evidence?.kind?String(evidence.kind):null;const understanding:ObjectiveDimensionStatus=correct===true?'evidenced':correct===false||evidence?.outcome==='misconception'?'needs_support':'unknown';const application:ObjectiveDimensionStatus=isApplicationKind(evidenceKind)?(correct===true?'evidenced':correct===false?'needs_support':'unknown'):'unknown';const retentionState=retentionDimension(retention,now);
  return {student:lesson.student,lessonId:lesson.id,objectiveId,objectiveText:text,subject:lesson.subject,status,confidence:confidenceFor(evidence,retention,status),teachingComplete:taught,understanding,application,retention:retentionState,evidenceKind,evidenceQuality:evidence?.quality==='direct'?'direct':evidence?.quality==='inferred'?'inferred':null,evidenceCorrect:correct,evidenceOutcome:evidence?.outcome?String(evidence.outcome):null,misconceptionId:evidence?.misconceptionId?String(evidence.misconceptionId):null,retentionLevel:Math.max(0,Number(retention?.level)||0),retentionAttempts:Math.max(0,Number(retention?.attempts)||0),retentionDueAt:retention?.dueAt||null,lastEvidenceAt:evidenceAt(evidence)} satisfies ObjectiveMasteryRecord;
 });
 const saved=readJson(`lessonEvidence:${lesson.id}`);const transfer=saved?.transfer;const transferStatus:LessonObjectiveMastery['transfer']=transfer?.correct===true?'evidenced':transfer?.correct===false?'needs_support':'unknown';
 return {lesson,objectives,transfer:transferStatus,allSecure:objectives.length>0&&objectives.every(x=>x.status==='secure'),needsSupport:objectives.filter(x=>x.status==='needs_support').map(x=>x.objectiveId),reviewDue:objectives.filter(x=>x.status==='review_due').map(x=>x.objectiveId)};
}

export function buildStudentObjectiveMasteryMap(student:string,now=Date.now()):StudentObjectiveMasteryMap{
 const lessonMaps=lessons.filter(x=>x.student===student&&x.kind!=='assessment').map(lesson=>buildLessonObjectiveMastery(lesson,now));return {student,lessons:lessonMaps,objectives:lessonMaps.flatMap(x=>x.objectives),updatedAt:new Date().toISOString()};
}

export function getObjectiveMastery(student:string,lessonId:string,objectiveId:number,now=Date.now()){return buildStudentObjectiveMasteryMap(student,now).objectives.find(x=>x.lessonId===lessonId&&x.objectiveId===objectiveId)||null}
