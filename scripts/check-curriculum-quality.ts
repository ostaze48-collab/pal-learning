import {lessons} from '../lib/data';
import {auditCurriculum} from '../lib/lessonQualityGate';
import {validateMisconceptionLibrary} from '../lib/misconceptionLibrary';
import {getDirectedTeachingScenes} from '../lib/lessonDirector';
import {getTeachingVisual} from '../lib/teachingVisuals';

const report=auditCurriculum(lessons);
const misconceptionReport=validateMisconceptionLibrary();
const blocked=report.lessons.filter(x=>!x.ready);
const warnings=report.lessons.flatMap(x=>x.issues.filter(i=>i.severity==='warning').map(i=>({lessonId:x.lessonId,score:x.score,...i})));
const blockers=report.lessons.flatMap(x=>x.issues.filter(i=>i.severity==='blocker').map(i=>({lessonId:x.lessonId,score:x.score,...i})));
const noInteractiveObjectives=report.lessons.filter(x=>x.kind==='learning'&&x.interactiveTeachingObjectives<x.objectiveCount).map(x=>({lessonId:x.lessonId,covered:x.interactiveTeachingObjectives,total:x.objectiveCount,percent:x.interactiveObjectivePercent}));
const noRichEvidence=report.lessons.filter(x=>x.kind==='learning'&&x.richInteractionCount===0).map(x=>({lessonId:x.lessonId,interactions:x.evidenceInteractions,kinds:x.evidenceKinds}));
const noFadedObjectives=lessons.filter(x=>x.kind!=='assessment').flatMap(lesson=>lesson.learningPoints.flatMap((objective,index)=>{
  const scenes=getDirectedTeachingScenes(lesson,index)||[];
  const visuals=scenes.map((_,sceneIndex)=>getTeachingVisual(lesson.id,index+1,sceneIndex+1));
  const hasFaded=visuals.some(visual=>visual?.purpose==='guided_application'&&visual.scaffold==='faded');
  return hasFaded?[]:[{lessonId:lesson.id,subject:lesson.subject,objectiveId:index+1,objective,sceneCount:scenes.length,visualCount:visuals.filter(Boolean).length}];
}));
const missingVisualScenes=lessons.filter(x=>x.kind!=='assessment').flatMap(lesson=>lesson.learningPoints.flatMap((objective,index)=>{
  const scenes=getDirectedTeachingScenes(lesson,index)||[];
  return scenes.flatMap((_,sceneIndex)=>getTeachingVisual(lesson.id,index+1,sceneIndex+1)?[]:[{lessonId:lesson.id,subject:lesson.subject,objectiveId:index+1,sceneNumber:sceneIndex+1,objective}]);
}));

console.log('\n=== SAMA & SALMA · CURRICULUM QUALITY ===');
console.log(`Learning lessons: ${report.learningLessons}`);
console.log(`Assessments: ${report.assessments}`);
console.log(`Ready: ${report.ready}`);
console.log(`Blocked: ${report.blocked}`);
console.log(`Average learning quality: ${report.averageScore}/100`);
console.log(`Teaching blueprint objective coverage: ${report.teachingBlueprintObjectiveCoverage}%`);
console.log(`Objectives with at least one interactive experience: ${report.interactiveTeachingObjectiveCoverage}%`);
console.log(`Interactive teaching scene coverage: ${report.interactiveTeachingSceneCoverage}%`);
console.log(`Objectives reaching faded interactive application: ${report.fadedApplicationObjectiveCoverage}%`);
console.log(`Faded application scenes: ${report.fadedApplicationScenes}`);
console.log(`Lessons with rich evidence interactions: ${report.lessonsWithRichInteractions}/${report.learningLessons}`);
console.log(`Explicit misconception patterns: ${misconceptionReport.count}`);
console.log('\nFADED APPLICATION BY SUBJECT');
for(const row of report.fadedApplicationBySubject)console.log(`- ${row.subject}: ${row.fadedApplicationCoverage}% (${row.fadedApplicationObjectives}/${row.objectives}) · any interaction ${row.interactiveCoverage}%`);

if(noFadedObjectives.length){
  console.log('\nOBJECTIVES WITHOUT FADED APPLICATION');
  for(const item of noFadedObjectives)console.log(`- ${item.lessonId} · ${item.subject} · objective ${item.objectiveId} · scenes ${item.sceneCount} · visuals ${item.visualCount} · ${item.objective}`);
}else console.log('\nOBJECTIVES WITHOUT FADED APPLICATION: none');

if(missingVisualScenes.length){
  console.log('\nTEACHING SCENES WITHOUT A VISUAL');
  for(const item of missingVisualScenes)console.log(`- ${item.lessonId} · ${item.subject} · objective ${item.objectiveId} · scene ${item.sceneNumber} · ${item.objective}`);
}else console.log('\nTEACHING SCENES WITHOUT A VISUAL: none');

if(noRichEvidence.length){
  console.log('\nLEARNING LESSONS WITHOUT RICH EVIDENCE');
  for(const item of noRichEvidence)console.log(`- ${item.lessonId} · interactions ${item.interactions.join(',')||'none'} · kinds ${item.kinds.join(',')||'none'}`);
}else console.log('\nLEARNING LESSONS WITHOUT RICH EVIDENCE: none');

if(noInteractiveObjectives.length){
  console.log('\nOBJECTIVES WITHOUT AN INTERACTIVE EXPERIENCE');
  for(const lesson of noInteractiveObjectives.slice(0,80))console.log(`- ${lesson.lessonId}: ${lesson.covered}/${lesson.total} objectives interactive (${lesson.percent}%)`);
  if(noInteractiveObjectives.length>80)console.log(`... ${noInteractiveObjectives.length-80} more lessons`);
}else console.log('\nOBJECTIVES WITHOUT AN INTERACTIVE EXPERIENCE: none');

if(misconceptionReport.issues.length){
  console.log('\nMISCONCEPTION LIBRARY ISSUES');
  for(const issue of misconceptionReport.issues)console.log(`- ${issue}`);
}else console.log('\nMISCONCEPTION LIBRARY: valid');

if(blockers.length){
  console.log('\nBLOCKERS');
  for(const issue of blockers)console.log(`- ${issue.lessonId}${issue.objectiveId?` · objective ${issue.objectiveId}`:''} · ${issue.code}: ${issue.message}`);
}else console.log('\nBLOCKERS: none');

if(warnings.length){
  console.log('\nWARNINGS');
  for(const issue of warnings.slice(0,80))console.log(`- ${issue.lessonId}${issue.objectiveId?` · objective ${issue.objectiveId}`:''} · ${issue.code}: ${issue.message}`);
  if(warnings.length>80)console.log(`... ${warnings.length-80} more warnings`);
}else console.log('\nWARNINGS: none');

const strict=process.env.CURRICULUM_QUALITY_STRICT==='1';
if(strict&&(blocked.length||misconceptionReport.issues.length)){
  console.error(`\nQuality gate failed: ${blocked.length} blocked lesson(s), ${misconceptionReport.issues.length} misconception-library issue(s).`);
  process.exit(1);
}

console.log(`\nQuality gate mode: ${strict?'STRICT':'REPORT_ONLY'}`);