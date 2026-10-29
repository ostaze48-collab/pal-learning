'use client';
import {useEffect} from 'react';
import type {Lesson} from '../../../lib/data';
import {evaluateObjectiveCoverage} from '../../../lib/objectiveCoverage';
import {combineMasteryEvidence} from '../../../lib/masteryEvidence';
import {refreshTeacherDecision} from '../../../lib/masteryEngine';
import {recordObjectiveEvidenceForRetention} from '../../../lib/objectiveRetention';
import {getTeachingScenes} from '../../../lib/teachingBlueprints';

function readJson(key:string){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):null}catch{return null}}

export default function ObjectiveCoverageBridge({lesson}:{lesson:Lesson}){
 useEffect(()=>{
   let last='';
   function sync(){
     const ux=readJson(`lessonUx:${lesson.id}`);const legacy=readJson(`lessonCoverage:${lesson.id}`);const report=readJson(`lesson:${lesson.id}:report`);const events=Array.isArray(ux)?ux:[];
     const objectiveCount=Math.max(1,lesson.learningPoints.length);
     const taught=Array.from({length:objectiveCount},(_,index)=>{
       const explicit=Boolean(getTeachingScenes(lesson,index)?.length);
       if(explicit)return events.some((e:any)=>e?.event==='teaching_objective_experience_complete'&&Number(e?.objectiveId)===index+1);
       if(Array.isArray(legacy?.objectives)&&legacy.objectives[index]?.taught===true)return true;
       if(events.some((e:any)=>e?.event==='coverage_complete'))return true;
       return events.some((e:any)=>e?.event==='objective_covered'&&Number(e?.objective)>=index+1);
     });
     const coverage=evaluateObjectiveCoverage(lesson,{taught,events});
     const explicitMissing=coverage.objectives.filter((objective,index)=>Boolean(getTeachingScenes(lesson,index)?.length)&&!objective.taught).map(x=>x.id);
     const transferEvent=[...events].reverse().find((e:any)=>e?.event==='transfer_evidence');
     const transferStatus=typeof transferEvent?.correct==='boolean'?(transferEvent.correct?'verified':'needs_support'):'unscored';
     const latestObjectiveEvidence=new Map<number,{correct:boolean;at:string}>();
     for(const event of events){if(event?.event==='objective_evidence'&&Number.isFinite(Number(event?.objectiveId))&&typeof event?.correct==='boolean')latestObjectiveEvidence.set(Number(event.objectiveId),{correct:Boolean(event.correct),at:String(event.at||new Date().toISOString())})}
     for(const [objectiveId,evidence] of latestObjectiveEvidence)recordObjectiveEvidenceForRetention(lesson,objectiveId,evidence.correct,evidence.at);
     const richValues=[...latestObjectiveEvidence.values()].map(x=>x.correct);
     const objectiveEvidencePercent=richValues.length?Math.round(richValues.filter(Boolean).length/richValues.length*100):null;
     const transferSuccess=typeof transferEvent?.correct==='boolean'?Boolean(transferEvent.correct):null;
     const signature=JSON.stringify({coverage,transferStatus,objectiveEvidencePercent,explicitMissing,done:Boolean(report)});if(signature===last)return;last=signature;
     localStorage.setItem(`objectiveEvidence:${lesson.id}`,JSON.stringify({...coverage,transferStatus,objectiveEvidencePercent,explicitMissing}));
     localStorage.setItem(`lesson:${lesson.id}:teachingGate`,JSON.stringify({lessonId:lesson.id,allTeachingComplete:explicitMissing.length===0,missingObjectiveIds:explicitMissing,updatedAt:new Date().toISOString()}));
     if(report){
       const enhanced=combineMasteryEvidence({
         quizPercent:Number(report.quizMastery??report.mastery??0),
         understanding:null,
         conceptSuccess:report.conceptScore??null,
         conceptAttempts:report.conceptScore===null||report.conceptScore===undefined?0:2,
         objectiveEvidencePercent,
         objectiveEvidenceCount:richValues.length,
         transferSuccess
       });
       const teachingIncomplete=explicitMissing.length>0;
       const enhancedStatus=teachingIncomplete?'review_needed':enhanced.status;
       const enhancedReason=teachingIncomplete?'جزء من تجربة الشرح المصممة لم يُستكمل بعد؛ لا نعتمد النتيجة قبل المرور به.':enhanced.reason;
       const enhancedReport={...report,mastery:enhanced.mastery,masteryConfidence:teachingIncomplete?Math.min(enhanced.confidence,60):enhanced.confidence,objectiveEvidenceScore:enhanced.objectiveEvidenceScore,transferScore:enhanced.transferScore,evidenceReason:enhancedReason,status:enhancedStatus,richEvidenceIncluded:true,teachingComplete:!teachingIncomplete};
       localStorage.setItem(`lesson:${lesson.id}:report`,JSON.stringify(enhancedReport));
       if(enhancedStatus==='review_needed'){
         const due=new Date(Date.now()+86400000).toISOString();
         enhancedReport.reviewDue=due;localStorage.setItem(`lesson:${lesson.id}:report`,JSON.stringify(enhancedReport));
         const oldReview=readJson(`lesson:${lesson.id}:review`);localStorage.setItem(`lesson:${lesson.id}:review`,JSON.stringify({...oldReview,dueAt:due,status:'retention_check'}));
       }

       const gate={lessonId:lesson.id,allTaught:coverage.allTaught,allTeachingComplete:!teachingIncomplete,allVerified:coverage.allVerified,verifiedCount:coverage.verifiedCount,total:coverage.objectives.length,needsSupport:coverage.needsSupport,needsStrongerEvidence:coverage.needsStrongerEvidence,missingTeaching:explicitMissing,transferStatus,mastery:enhanced.mastery,masteryConfidence:enhancedReport.masteryConfidence,status:teachingIncomplete?'teaching_incomplete':coverage.needsSupport.length?'support_needed':transferStatus==='needs_support'?'transfer_support_needed':coverage.allVerified?'verified':'evidence_needed',updatedAt:new Date().toISOString()};
       localStorage.setItem(`lesson:${lesson.id}:objectiveGate`,JSON.stringify(gate));

       const existingDecision=readJson(`teacherDecision:${lesson.id}`)||readJson(`lesson:${lesson.id}:teacherDecision`);
       if(existingDecision?.manual!==true){
         if(teachingIncomplete){
           const decision={decision:'review',focus:'إكمال تجربة التعلم قبل اعتماد النتيجة',reason:'تم تجاوز جزء من تجربة الشرح المخصصة؛ لا ننسب ذلك إلى مشكلة لدى الطفلة، بل نعيدها لإكمال تجربة التعلم.',confidence:95,objectiveIds:explicitMissing,source:'teaching_gate',generatedAt:new Date().toISOString()};
           localStorage.setItem(`teacherDecision:${lesson.id}`,JSON.stringify(decision));localStorage.setItem(`lesson:${lesson.id}:teacherDecision`,JSON.stringify(decision));
         }else refreshTeacherDecision(lesson,enhancedReport);
       }

       if(coverage.needsStrongerEvidence.length||teachingIncomplete){
         const qualityFlag={lessonId:lesson.id,objectiveIds:coverage.needsStrongerEvidence,missingTeaching:explicitMissing,issue:teachingIncomplete?'teaching_experience_not_completed':'content_needs_stronger_assessment_evidence',childActionRequired:teachingIncomplete,updatedAt:new Date().toISOString()};localStorage.setItem(`contentQuality:${lesson.id}`,JSON.stringify(qualityFlag));
       }else localStorage.removeItem(`contentQuality:${lesson.id}`);
     }
   }
   sync();const timer=window.setInterval(sync,800);return()=>window.clearInterval(timer);
 },[lesson.id,lesson.student,lesson.title,lesson.learningPoints,lesson.questions]);
 return null;
}