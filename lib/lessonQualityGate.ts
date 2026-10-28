import type {Lesson} from './data';
import {buildObjectiveQuestionMap} from './objectiveCoverage';

export type LessonQualityIssue={
 severity:'blocker'|'warning';
 code:'NO_OBJECTIVES'|'NO_QUESTIONS'|'OBJECTIVE_WITHOUT_DIRECT_EVIDENCE'|'TOO_FEW_QUESTIONS'|'NO_EXAMPLE'|'NO_SUMMARY';
 objectiveId?:number;
 message:string;
};

export type LessonQualityResult={
 lessonId:string;
 ready:boolean;
 score:number;
 objectiveCount:number;
 directEvidenceObjectives:number;
 issues:LessonQualityIssue[];
};

export function auditLessonQuality(lesson:Lesson):LessonQualityResult{
 const issues:LessonQualityIssue[]=[];
 const objectiveCount=lesson.learningPoints.length;
 if(!objectiveCount)issues.push({severity:'blocker',code:'NO_OBJECTIVES',message:'لا توجد أهداف داخلية يمكن للمحرك ضمان تغطيتها.'});
 if(!lesson.questions.length)issues.push({severity:'blocker',code:'NO_QUESTIONS',message:'لا توجد أدلة تحقق بعد التعلم.'});
 if(!lesson.summary?.trim())issues.push({severity:'warning',code:'NO_SUMMARY',message:'الدرس يحتاج فكرة مركزية واضحة تقود تجربة التعلم.'});
 if(!lesson.example?.trim())issues.push({severity:'warning',code:'NO_EXAMPLE',message:'الدرس يحتاج مثالًا أو موقفًا تطبيقيًا واضحًا.'});
 if(objectiveCount&&lesson.questions.length<objectiveCount){
   issues.push({severity:'warning',code:'TOO_FEW_QUESTIONS',message:`عدد أدلة التحقق (${lesson.questions.length}) أقل من عدد الأهداف الداخلية (${objectiveCount}).`});
 }
 const map=buildObjectiveQuestionMap(lesson);
 let directEvidenceObjectives=0;
 for(const objective of map){
   const hasDirect=objective.links.some(x=>x.quality==='direct');
   if(hasDirect)directEvidenceObjectives++;
   else issues.push({severity:'blocker',code:'OBJECTIVE_WITHOUT_DIRECT_EVIDENCE',objectiveId:objective.id,message:`الهدف الداخلي ${objective.id} لا يملك دليل تحقق مباشرًا بما يكفي.`});
 }
 const blockers=issues.filter(x=>x.severity==='blocker').length;
 const warnings=issues.filter(x=>x.severity==='warning').length;
 const score=Math.max(0,100-blockers*22-warnings*7);
 return {lessonId:lesson.id,ready:blockers===0,score,objectiveCount,directEvidenceObjectives,issues};
}

export function auditCurriculum(lessons:Lesson[]){
 const results=lessons.map(auditLessonQuality);
 return {
   lessons:results,
   ready:results.filter(x=>x.ready).length,
   blocked:results.filter(x=>!x.ready).length,
   averageScore:results.length?Math.round(results.reduce((s,x)=>s+x.score,0)/results.length):0,
   generatedAt:new Date().toISOString()
 };
}
