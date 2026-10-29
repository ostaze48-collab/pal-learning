import {lessons} from './data';
import type {TeacherInterventionType} from './masteryEngine';
import type {RepresentationFamily} from './learningPatternModel';

export type InterventionOutcomeRecord={
 id:string;
 student:string;
 lessonId:string;
 subject:string;
 objectiveId:number;
 interventionType:TeacherInterventionType;
 representationFamily:RepresentationFamily|null;
 misconceptionId:string|null;
 prerequisiteBridgeId:string|null;
 correct:boolean|null;
 outcome:string;
 startedAt:string|null;
 completedAt:string;
};
export type InterventionEffectiveness={
 interventionType:TeacherInterventionType;
 samples:number;
 successes:number;
 failures:number;
 unscored:number;
 successRate:number|null;
 byFamily:Array<{family:RepresentationFamily;samples:number;successes:number;successRate:number}>;
};

type UxEvent={event?:string;at?:string;objectiveId?:number;interventionType?:TeacherInterventionType;representationFamily?:RepresentationFamily;preferredFamily?:RepresentationFamily;misconceptionId?:string|null;prerequisiteBridgeId?:string|null;correct?:boolean|null;outcome?:string};

function key(student:string){return `interventionOutcomes:${student}`}
function readStored(student:string):InterventionOutcomeRecord[]{if(typeof window==='undefined')return[];try{const raw=localStorage.getItem(key(student));const rows=raw?JSON.parse(raw):[];return Array.isArray(rows)?rows:[]}catch{return[]}}
function write(student:string,rows:InterventionOutcomeRecord[]){if(typeof window==='undefined')return;try{localStorage.setItem(key(student),JSON.stringify(rows.slice(-300)))}catch{}}
function readUx(lessonId:string):UxEvent[]{if(typeof window==='undefined')return[];try{const raw=localStorage.getItem(`lessonUx:${lessonId}`);const rows=raw?JSON.parse(raw):[];return Array.isArray(rows)?rows:[]}catch{return[]}}
function validIntervention(value:unknown):TeacherInterventionType{const allowed:TeacherInterventionType[]=['none','spaced_review','objective_reteach','prerequisite_bridge','transfer_practice','concept_rebuild','evidence_conflict'];return allowed.includes(value as TeacherInterventionType)?value as TeacherInterventionType:'objective_reteach'}
function family(value:unknown):RepresentationFamily|null{const allowed:RepresentationFamily[]=['spatial','construct','compare','experiment','context','language','data'];return allowed.includes(value as RepresentationFamily)?value as RepresentationFamily:null}

function inferFromUx(student:string):InterventionOutcomeRecord[]{
 if(typeof window==='undefined')return[];const out:InterventionOutcomeRecord[]=[];
 for(const lesson of lessons.filter(x=>x.student===student)){
  const events=readUx(lesson.id);for(let i=0;i<events.length;i++){
   const start=events[i];if(start?.event!=='alternate_teaching_complete')continue;const objectiveId=Math.max(1,Number(start.objectiveId)||1);let result:UxEvent|undefined;
   for(let j=i+1;j<events.length;j++){
    const candidate=events[j];if(candidate?.event==='alternate_teaching_complete')break;
    if(candidate?.event==='targeted_recheck'&&Number(candidate.objectiveId)===objectiveId){result=candidate;break}
   }
   const completedAt=String(start.at||result?.at||'');if(!completedAt)continue;const representation=family(start.representationFamily)||family(start.preferredFamily);
   out.push({id:`ux:${lesson.id}:${objectiveId}:${completedAt}`,student,lessonId:lesson.id,subject:lesson.subject,objectiveId,interventionType:validIntervention(start.interventionType),representationFamily:representation,misconceptionId:start.misconceptionId?String(start.misconceptionId):null,prerequisiteBridgeId:start.prerequisiteBridgeId?String(start.prerequisiteBridgeId):null,correct:typeof result?.correct==='boolean'?Boolean(result.correct):null,outcome:String(result?.outcome||'unscored'),startedAt:null,completedAt});
  }
 }
 return out;
}
function mergedHistory(student:string){
 const rows=[...inferFromUx(student),...readStored(student)];const byEpisode=new Map<string,InterventionOutcomeRecord>();
 for(const row of rows){const episode=row.startedAt?`${row.lessonId}:${row.objectiveId}:${row.startedAt}`:`${row.lessonId}:${row.objectiveId}:${row.completedAt}`;const existing=byEpisode.get(episode);if(!existing||existing.correct===null&&row.correct!==null)byEpisode.set(episode,row)}
 return [...byEpisode.values()].sort((a,b)=>Date.parse(a.completedAt)-Date.parse(b.completedAt));
}

export function recordInterventionOutcome(input:Omit<InterventionOutcomeRecord,'id'|'completedAt'>){
 if(typeof window==='undefined')return null;const completedAt=new Date().toISOString();const id=`${input.lessonId}:${input.objectiveId}:${input.interventionType}:${completedAt}`;const record:InterventionOutcomeRecord={...input,id,completedAt};const old=readStored(input.student);const deduped=old.filter(x=>!(x.lessonId===record.lessonId&&x.objectiveId===record.objectiveId&&x.startedAt&&record.startedAt&&x.startedAt===record.startedAt));deduped.push(record);write(input.student,deduped);return record;
}

export function getInterventionEffectiveness(student:string,subject?:string){
 const rows=mergedHistory(student).filter(x=>!subject||x.subject===subject);const types=[...new Set(rows.map(x=>x.interventionType))];return types.map(interventionType=>{
  const group=rows.filter(x=>x.interventionType===interventionType);const scored=group.filter(x=>typeof x.correct==='boolean');const successes=scored.filter(x=>x.correct===true).length;const failures=scored.filter(x=>x.correct===false).length;const families=[...new Set(group.map(x=>x.representationFamily).filter(Boolean))] as RepresentationFamily[];const byFamily=families.map(familyName=>{const familyRows=group.filter(x=>x.representationFamily===familyName&&typeof x.correct==='boolean');const familySuccess=familyRows.filter(x=>x.correct===true).length;return {family:familyName,samples:familyRows.length,successes:familySuccess,successRate:familyRows.length?Math.round(familySuccess/familyRows.length*100):0}}).sort((a,b)=>b.samples-a.samples||b.successRate-a.successRate);
  return {interventionType,samples:scored.length,successes,failures,unscored:group.length-scored.length,successRate:scored.length?Math.round(successes/scored.length*100):null,byFamily} satisfies InterventionEffectiveness;
 }).sort((a,b)=>b.samples-a.samples);
}

export function getInterventionFamilyRecommendation(student:string,subject:string,interventionType:TeacherInterventionType){
 const summary=getInterventionEffectiveness(student,subject).find(x=>x.interventionType===interventionType);if(!summary)return null;const eligible=summary.byFamily.filter(x=>x.samples>=3);if(!eligible.length)return null;const best=[...eligible].sort((a,b)=>b.successRate-a.successRate||b.samples-a.samples)[0];if(best.successRate<65)return null;return {family:best.family,confidence:Math.min(95,55+best.samples*5+Math.max(0,best.successRate-65)),samples:best.samples,successRate:best.successRate};
}

export function getInterventionOutcomeHistory(student:string){return mergedHistory(student)}
