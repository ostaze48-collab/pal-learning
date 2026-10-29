import type {Lesson} from './data';
import {buildObjectiveQuestionMap} from './objectiveCoverage';
import {buildEvidenceTasks} from './evidenceDesign';
import {getDirectedTeachingScenes} from './lessonDirector';
import {getTeachingVisual} from './teachingVisuals';

export type LessonQualityIssue={
 severity:'blocker'|'warning';
 code:'NO_OBJECTIVES'|'NO_QUESTIONS'|'OBJECTIVE_WITHOUT_DIRECT_EVIDENCE'|'OBJECTIVE_WITHOUT_INTERACTIVE_EXPERIENCE'|'TOO_FEW_QUESTIONS'|'NO_EXAMPLE'|'NO_SUMMARY'|'WEAK_EVIDENCE_VARIETY'|'GENERIC_TEACHING_ONLY'|'PARTIAL_TEACHING_BLUEPRINT';
 objectiveId?:number;
 message:string;
};

export type LessonQualityResult={
 lessonId:string;
 kind:'learning'|'assessment';
 ready:boolean;
 score:number;
 objectiveCount:number;
 directEvidenceObjectives:number;
 teachingBlueprintObjectives:number;
 teachingBlueprintPercent:number;
 teachingSceneCount:number;
 interactiveTeachingScenes:number;
 interactiveTeachingPercent:number;
 interactiveTeachingObjectives:number;
 interactiveObjectivePercent:number;
 fadedApplicationScenes:number;
 fadedApplicationObjectives:number;
 fadedApplicationObjectivePercent:number;
 evidenceKinds:string[];
 evidenceInteractions:string[];
 richInteractionCount:number;
 issues:LessonQualityIssue[];
};

export function auditLessonQuality(lesson:Lesson):LessonQualityResult{
 const issues:LessonQualityIssue[]=[];
 if(lesson.kind==='assessment'){
   if(!lesson.questions.length)issues.push({severity:'blocker',code:'NO_QUESTIONS',message:'الاختبار لا يحتوي أسئلة.'});
   else if(lesson.questions.length<3)issues.push({severity:'warning',code:'TOO_FEW_QUESTIONS',message:'الاختبار قصير جدًا وقد لا يعطي صورة مستقرة عن الوحدة.'});
   const blockers=issues.filter(x=>x.severity==='blocker').length;const warnings=issues.filter(x=>x.severity==='warning').length;
   return {lessonId:lesson.id,kind:'assessment',ready:blockers===0,score:Math.max(0,100-blockers*30-warnings*7),objectiveCount:0,directEvidenceObjectives:0,teachingBlueprintObjectives:0,teachingBlueprintPercent:0,teachingSceneCount:0,interactiveTeachingScenes:0,interactiveTeachingPercent:0,interactiveTeachingObjectives:0,interactiveObjectivePercent:0,fadedApplicationScenes:0,fadedApplicationObjectives:0,fadedApplicationObjectivePercent:0,evidenceKinds:['assessment'],evidenceInteractions:['choice'],richInteractionCount:0,issues};
 }

 const objectiveCount=lesson.learningPoints.length;
 if(!objectiveCount)issues.push({severity:'blocker',code:'NO_OBJECTIVES',message:'لا توجد أهداف داخلية يمكن للمحرك ضمان تغطيتها.'});
 if(!lesson.questions.length)issues.push({severity:'blocker',code:'NO_QUESTIONS',message:'لا توجد أدلة تحقق بعد التعلم.'});
 if(!lesson.summary?.trim())issues.push({severity:'warning',code:'NO_SUMMARY',message:'الدرس يحتاج فكرة مركزية واضحة تقود تجربة التعلم.'});
 if(!lesson.example?.trim())issues.push({severity:'warning',code:'NO_EXAMPLE',message:'الدرس يحتاج مثالًا أو موقفًا تطبيقيًا واضحًا.'});

 const plans=Array.from({length:objectiveCount},(_,index)=>getDirectedTeachingScenes(lesson,index)||[]);
 const teachingBlueprintObjectives=plans.filter(scenes=>scenes.length>0).length;
 const teachingBlueprintPercent=objectiveCount?Math.round(teachingBlueprintObjectives/objectiveCount*100):0;
 const teachingSceneCount=plans.reduce((sum,scenes)=>sum+scenes.length,0);
 let interactiveTeachingScenes=0;let interactiveTeachingObjectives=0;let fadedApplicationScenes=0;let fadedApplicationObjectives=0;const objectivesWithoutInteraction:number[]=[];
 plans.forEach((scenes,objectiveIndex)=>{let objectiveHasInteraction=false;let objectiveHasFadedApplication=false;scenes.forEach((_,sceneIndex)=>{const visual=getTeachingVisual(lesson.id,objectiveIndex+1,sceneIndex+1);if(visual){interactiveTeachingScenes++;objectiveHasInteraction=true;if(visual.purpose==='guided_application'&&visual.scaffold==='faded'){fadedApplicationScenes++;objectiveHasFadedApplication=true}}});if(objectiveHasInteraction)interactiveTeachingObjectives++;else if(scenes.length)objectivesWithoutInteraction.push(objectiveIndex+1);if(objectiveHasFadedApplication)fadedApplicationObjectives++});
 const interactiveTeachingPercent=teachingSceneCount?Math.round(interactiveTeachingScenes/teachingSceneCount*100):0;
 const interactiveObjectivePercent=objectiveCount?Math.round(interactiveTeachingObjectives/objectiveCount*100):0;
 const fadedApplicationObjectivePercent=objectiveCount?Math.round(fadedApplicationObjectives/objectiveCount*100):0;
 if(objectiveCount&&teachingBlueprintObjectives===0)issues.push({severity:'warning',code:'GENERIC_TEACHING_ONLY',message:'الدرس ما زال يعتمد على قالب شرح عام؛ يحتاج مسار تعلم موجّهًا بأهدافه.'});
 else if(teachingBlueprintObjectives<objectiveCount)issues.push({severity:'warning',code:'PARTIAL_TEACHING_BLUEPRINT',message:`مسار التعلم الموجّه يغطي ${teachingBlueprintObjectives} من ${objectiveCount} أهداف فقط.`});
 for(const objectiveId of objectivesWithoutInteraction)issues.push({severity:'warning',code:'OBJECTIVE_WITHOUT_INTERACTIVE_EXPERIENCE',objectiveId,message:'الهدف يملك مسار تعلم موجّهًا لكنه لا يملك بعد لحظة تفاعلية من نوع افعلي/غيّري/لاحظي.'});

 const map=buildObjectiveQuestionMap(lesson);const tasks=buildEvidenceTasks(lesson);let directEvidenceObjectives=0;
 for(const objective of map){const task=tasks.find(x=>x.objectiveId===objective.id);const hasDirectQuestion=objective.links.some(x=>x.quality==='direct');const hasDirectTask=task?.quality==='direct';if(hasDirectQuestion||hasDirectTask)directEvidenceObjectives++;else issues.push({severity:'blocker',code:'OBJECTIVE_WITHOUT_DIRECT_EVIDENCE',objectiveId:objective.id,message:`الهدف الداخلي ${objective.id} لا يملك حتى الآن دليل تحقق مباشرًا بما يكفي.`})}
 if(objectiveCount&&lesson.questions.length<objectiveCount&&directEvidenceObjectives<objectiveCount)issues.push({severity:'warning',code:'TOO_FEW_QUESTIONS',message:`عدد الأسئلة الخام (${lesson.questions.length}) أقل من عدد الأهداف (${objectiveCount})، وما زالت مهام الدليل لا تعوض كل النقص.`});
 const evidenceKinds=[...new Set(tasks.map(x=>x.kind))];const evidenceInteractions=[...new Set(tasks.map(x=>x.interaction))];const richInteractionCount=tasks.filter(x=>!['choice','short_text'].includes(x.interaction)).length;
 if(objectiveCount>=3&&evidenceKinds.length<2&&evidenceInteractions.length<2)issues.push({severity:'warning',code:'WEAK_EVIDENCE_VARIETY',message:'كل الأهداف تقريبًا تُقاس بالطريقة نفسها؛ يفضّل تنويع دليل الفهم بين تطبيق وتفسير ومطابقة/ترتيب/تجربة عندما تسمح طبيعة الدرس.'});
 const blockers=issues.filter(x=>x.severity==='blocker').length;const warnings=issues.filter(x=>x.severity==='warning').length;
 const score=Math.max(0,100-blockers*22-warnings*7);
 return {lessonId:lesson.id,kind:'learning',ready:blockers===0,score,objectiveCount,directEvidenceObjectives,teachingBlueprintObjectives,teachingBlueprintPercent,teachingSceneCount,interactiveTeachingScenes,interactiveTeachingPercent,interactiveTeachingObjectives,interactiveObjectivePercent,fadedApplicationScenes,fadedApplicationObjectives,fadedApplicationObjectivePercent,evidenceKinds,evidenceInteractions,richInteractionCount,issues};
}

export function auditCurriculum(lessons:Lesson[]){
 const results=lessons.map(auditLessonQuality);const learning=results.filter(x=>x.kind==='learning');const assessments=results.filter(x=>x.kind==='assessment');const interactions:Record<string,number>={};for(const result of learning)for(const interaction of result.evidenceInteractions)interactions[interaction]=(interactions[interaction]||0)+1;
 const totalObjectives=learning.reduce((s,x)=>s+x.objectiveCount,0);const blueprintObjectives=learning.reduce((s,x)=>s+x.teachingBlueprintObjectives,0);const totalTeachingScenes=learning.reduce((s,x)=>s+x.teachingSceneCount,0);const interactiveTeachingScenes=learning.reduce((s,x)=>s+x.interactiveTeachingScenes,0);const interactiveTeachingObjectives=learning.reduce((s,x)=>s+x.interactiveTeachingObjectives,0);const fadedApplicationScenes=learning.reduce((s,x)=>s+x.fadedApplicationScenes,0);const fadedApplicationObjectives=learning.reduce((s,x)=>s+x.fadedApplicationObjectives,0);
 return {lessons:results,learningLessons:learning.length,assessments:assessments.length,ready:results.filter(x=>x.ready).length,blocked:results.filter(x=>!x.ready).length,averageScore:learning.length?Math.round(learning.reduce((s,x)=>s+x.score,0)/learning.length):0,interactionCoverage:interactions,lessonsWithRichInteractions:learning.filter(x=>x.richInteractionCount>0).length,lessonsWithTeachingBlueprint:learning.filter(x=>x.teachingBlueprintObjectives>0).length,teachingBlueprintObjectiveCoverage:totalObjectives?Math.round(blueprintObjectives/totalObjectives*100):0,interactiveTeachingSceneCoverage:totalTeachingScenes?Math.round(interactiveTeachingScenes/totalTeachingScenes*100):0,interactiveTeachingObjectiveCoverage:totalObjectives?Math.round(interactiveTeachingObjectives/totalObjectives*100):0,fadedApplicationScenes,fadedApplicationObjectiveCoverage:totalObjectives?Math.round(fadedApplicationObjectives/totalObjectives*100):0,generatedAt:new Date().toISOString()};
}