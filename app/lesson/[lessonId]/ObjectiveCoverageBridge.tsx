'use client';
import {useEffect} from 'react';
import type {Lesson} from '../../../lib/data';
import {evaluateObjectiveCoverage} from '../../../lib/objectiveCoverage';

function readJson(key:string){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):null}catch{return null}}

export default function ObjectiveCoverageBridge({lesson}:{lesson:Lesson}){
 useEffect(()=>{
   let last='';
   function sync(){
     const ux=readJson(`lessonUx:${lesson.id}`);const legacy=readJson(`lessonCoverage:${lesson.id}`);const report=readJson(`lesson:${lesson.id}:report`);const events=Array.isArray(ux)?ux:[];
     const objectiveCount=Math.max(1,lesson.learningPoints.length);
     const taught=Array.from({length:objectiveCount},(_,index)=>{if(Array.isArray(legacy?.objectives)&&legacy.objectives[index]?.taught===true)return true;if(events.some((e:any)=>e?.event==='coverage_complete'))return true;return events.some((e:any)=>e?.event==='objective_covered'&&Number(e?.objective)>=index+1)});
     const coverage=evaluateObjectiveCoverage(lesson,{taught,events});
     const transferEvent=[...events].reverse().find((e:any)=>e?.event==='transfer_evidence');
     const transferStatus=typeof transferEvent?.correct==='boolean'?(transferEvent.correct?'verified':'needs_support'):'unscored';
     const signature=JSON.stringify({coverage,transferStatus,done:Boolean(report)});if(signature===last)return;last=signature;
     localStorage.setItem(`objectiveEvidence:${lesson.id}`,JSON.stringify({...coverage,transferStatus}));
     if(report){
       const gate={lessonId:lesson.id,allTaught:coverage.allTaught,allVerified:coverage.allVerified,verifiedCount:coverage.verifiedCount,total:coverage.objectives.length,needsSupport:coverage.needsSupport,needsStrongerEvidence:coverage.needsStrongerEvidence,transferStatus,status:coverage.needsSupport.length?'support_needed':transferStatus==='needs_support'?'transfer_support_needed':coverage.allVerified?'verified':'evidence_needed',updatedAt:new Date().toISOString()};
       localStorage.setItem(`lesson:${lesson.id}:objectiveGate`,JSON.stringify(gate));

       const existingDecision=readJson(`teacherDecision:${lesson.id}`)||readJson(`lesson:${lesson.id}:teacherDecision`);
       if(existingDecision?.manual!==true){
         if(coverage.needsSupport.length){
           const decision={decision:'targeted_reteach',focus:'جزء من الدرس يحتاج تثبيتًا قصيرًا',reason:`أدلة مباشرة أظهرت أن الأهداف الداخلية ${coverage.needsSupport.join(', ')} تحتاج دعمًا إضافيًا.`,confidence:90,objectiveIds:coverage.needsSupport,source:'objective_coverage',generatedAt:new Date().toISOString()};
           localStorage.setItem(`teacherDecision:${lesson.id}`,JSON.stringify(decision));localStorage.setItem(`lesson:${lesson.id}:teacherDecision`,JSON.stringify(decision));
         }else if(transferStatus==='needs_support'){
           const decision={decision:'targeted_reteach',focus:`نقل فكرة ${lesson.title} إلى موقف جديد`,reason:'فهم الدرس الأساسي موجود، لكن دليل النقل كشف صعوبة في استخدام الفكرة عندما تغير السياق. المطلوب مثال جديد مختلف السطح ثم إعادة قياس قصيرة.',confidence:88,gapType:'transfer_gap',source:'transfer_evidence',generatedAt:new Date().toISOString()};
           localStorage.setItem(`teacherDecision:${lesson.id}`,JSON.stringify(decision));localStorage.setItem(`lesson:${lesson.id}:teacherDecision`,JSON.stringify(decision));
         }
       }

       if(coverage.needsStrongerEvidence.length){
         const qualityFlag={lessonId:lesson.id,objectiveIds:coverage.needsStrongerEvidence,issue:'content_needs_stronger_assessment_evidence',childActionRequired:false,updatedAt:new Date().toISOString()};localStorage.setItem(`contentQuality:${lesson.id}`,JSON.stringify(qualityFlag));
       }else localStorage.removeItem(`contentQuality:${lesson.id}`);
     }
   }
   sync();const timer=window.setInterval(sync,800);return()=>window.clearInterval(timer);
 },[lesson.id,lesson.student,lesson.title,lesson.learningPoints,lesson.questions]);
 return null;
}
