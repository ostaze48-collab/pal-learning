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

function key(student:string){return `interventionOutcomes:${student}`}
function read(student:string):InterventionOutcomeRecord[]{if(typeof window==='undefined')return[];try{const raw=localStorage.getItem(key(student));const rows=raw?JSON.parse(raw):[];return Array.isArray(rows)?rows:[]}catch{return[]}}
function write(student:string,rows:InterventionOutcomeRecord[]){if(typeof window==='undefined')return;try{localStorage.setItem(key(student),JSON.stringify(rows.slice(-300)))}catch{}}

export function recordInterventionOutcome(input:Omit<InterventionOutcomeRecord,'id'|'completedAt'>){
 if(typeof window==='undefined')return null;const completedAt=new Date().toISOString();const id=`${input.lessonId}:${input.objectiveId}:${input.interventionType}:${completedAt}`;const record:InterventionOutcomeRecord={...input,id,completedAt};const old=read(input.student);const deduped=old.filter(x=>!(x.lessonId===record.lessonId&&x.objectiveId===record.objectiveId&&x.startedAt&&record.startedAt&&x.startedAt===record.startedAt));deduped.push(record);write(input.student,deduped);return record;
}

export function getInterventionEffectiveness(student:string,subject?:string){
 const rows=read(student).filter(x=>!subject||x.subject===subject);const types=[...new Set(rows.map(x=>x.interventionType))];return types.map(interventionType=>{
  const group=rows.filter(x=>x.interventionType===interventionType);const scored=group.filter(x=>typeof x.correct==='boolean');const successes=scored.filter(x=>x.correct===true).length;const failures=scored.filter(x=>x.correct===false).length;const families=[...new Set(group.map(x=>x.representationFamily).filter(Boolean))] as RepresentationFamily[];const byFamily=families.map(family=>{const familyRows=group.filter(x=>x.representationFamily===family&&typeof x.correct==='boolean');const familySuccess=familyRows.filter(x=>x.correct===true).length;return {family,samples:familyRows.length,successes:familySuccess,successRate:familyRows.length?Math.round(familySuccess/familyRows.length*100):0}}).sort((a,b)=>b.samples-a.samples||b.successRate-a.successRate);
  return {interventionType,samples:scored.length,successes,failures,unscored:group.length-scored.length,successRate:scored.length?Math.round(successes/scored.length*100):null,byFamily} satisfies InterventionEffectiveness;
 }).sort((a,b)=>b.samples-a.samples);
}

export function getInterventionFamilyRecommendation(student:string,subject:string,interventionType:TeacherInterventionType){
 const summary=getInterventionEffectiveness(student,subject).find(x=>x.interventionType===interventionType);if(!summary)return null;const eligible=summary.byFamily.filter(x=>x.samples>=3);if(!eligible.length)return null;const best=[...eligible].sort((a,b)=>b.successRate-a.successRate||b.samples-a.samples)[0];if(best.successRate<65)return null;return {family:best.family,confidence:Math.min(95,55+best.samples*5+Math.max(0,best.successRate-65)),samples:best.samples,successRate:best.successRate};
}

export function getInterventionOutcomeHistory(student:string){return read(student)}
