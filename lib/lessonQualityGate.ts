import type {Lesson} from './data';
import {buildObjectiveQuestionMap} from './objectiveCoverage';
import {buildEvidenceTasks} from './evidenceDesign';

export type LessonQualityIssue={
 severity:'blocker'|'warning';
 code:'NO_OBJECTIVES'|'NO_QUESTIONS'|'OBJECTIVE_WITHOUT_DIRECT_EVIDENCE'|'TOO_FEW_QUESTIONS'|'NO_EXAMPLE'|'NO_SUMMARY'|'WEAK_EVIDENCE_VARIETY';
 objectiveId?:number;
 message:string;
};

export type LessonQualityResult={
 lessonId:string;
 ready:boolean;
 score:number;
 objectiveCount:number;
 directEvidenceObjectives:number;
 evidenceKinds:string[];
 evidenceInteractions:string[];
 richInteractionCount:number;
 issues:LessonQualityIssue[];
};

export function auditLessonQuality(lesson:Lesson):LessonQualityResult{
 const issues:LessonQualityIssue[]=[];
 const objectiveCount=lesson.learningPoints.length;
 if(!objectiveCount)issues.push({severity:'blocker',code:'NO_OBJECTIVES',message:'لا توجد أهداف داخلية يمكن للمحرك ضمان تغطيتها.'});
 if(!lesson.questions.length)issues.push({severity:'blocker',code:'NO_QUESTIONS',message:'لا توجد أدلة تحقق بعد التعلم.'});
 if(!lesson.summary?.trim())issues.push({severity:'warning',code:'NO_SUMMARY',message:'الدرس يحتاج فكرة مركزية واضحة تقود تجربة التعلم.'});
 if(!lesson.example?.trim())issues.push({severity:'warning',code:'NO_EXAMPLE',message:'الدرس يحتاج مثالًا أو موقفًا تطبيقيًا واضحًا.'});
 if(objectiveCount&&lesson.questions.length<objectiveCount){issues.push({severity:'warning',code:'TOO_FEW_QUESTIONS',message:`عدد الأسئلة (${lesson.questions.length}) أقل من عدد الأهداف الداخلية (${objectiveCount})، لذلك يجب أن تعوض مهام الدليل هذا النقص.`});}

 const map=buildObjectiveQuestionMap(lesson);
 const tasks=buildEvidenceTasks(lesson);
 let directEvidenceObjectives=0;
 for(const objective of map){
   const task=tasks.find(x=>x.objectiveId===objective.id);
   const hasDirectQuestion=objective.links.some(x=>x.quality==='direct');
   const hasDirectTask=task?.quality==='direct';
   if(hasDirectQuestion||hasDirectTask)directEvidenceObjectives++;
   else issues.push({severity:'blocker',code:'OBJECTIVE_WITHOUT_DIRECT_EVIDENCE',objectiveId:objective.id,message:`الهدف الداخلي ${objective.id} لا يملك حتى الآن دليل تحقق مباشرًا بما يكفي.`});
 }
 const evidenceKinds=[...new Set(tasks.map(x=>x.kind))];
 const evidenceInteractions=[...new Set(tasks.map(x=>x.interaction))];
 const richInteractionCount=tasks.filter(x=>!['choice','short_text'].includes(x.interaction)).length;
 if(objectiveCount>=3&&evidenceKinds.length<2&&evidenceInteractions.length<2)issues.push({severity:'warning',code:'WEAK_EVIDENCE_VARIETY',message:'كل الأهداف تقريبًا تُقاس بالطريقة نفسها؛ يفضّل تنويع دليل الفهم بين تطبيق وتفسير ومطابقة/ترتيب/تجربة عندما تسمح طبيعة الدرس.'});
 const blockers=issues.filter(x=>x.severity==='blocker').length;
 const warnings=issues.filter(x=>x.severity==='warning').length;
 const score=Math.max(0,100-blockers*22-warnings*7);
 return {lessonId:lesson.id,ready:blockers===0,score,objectiveCount,directEvidenceObjectives,evidenceKinds,evidenceInteractions,richInteractionCount,issues};
}

export function auditCurriculum(lessons:Lesson[]){
 const results=lessons.map(auditLessonQuality);
 const interactions:Record<string,number>={};
 for(const result of results)for(const interaction of result.evidenceInteractions)interactions[interaction]=(interactions[interaction]||0)+1;
 return {lessons:results,ready:results.filter(x=>x.ready).length,blocked:results.filter(x=>!x.ready).length,averageScore:results.length?Math.round(results.reduce((s,x)=>s+x.score,0)/results.length):0,interactionCoverage:interactions,lessonsWithRichInteractions:results.filter(x=>x.richInteractionCount>0).length,generatedAt:new Date().toISOString()};
}
