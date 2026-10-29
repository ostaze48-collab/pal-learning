import {lessons} from '../lib/data';
import {auditCurriculum} from '../lib/lessonQualityGate';

const report=auditCurriculum(lessons);
const blocked=report.lessons.filter(x=>!x.ready);
const warnings=report.lessons.flatMap(x=>x.issues.filter(i=>i.severity==='warning').map(i=>({lessonId:x.lessonId,score:x.score,...i})));
const blockers=report.lessons.flatMap(x=>x.issues.filter(i=>i.severity==='blocker').map(i=>({lessonId:x.lessonId,score:x.score,...i})));

console.log('\n=== SAMA & SALMA · CURRICULUM QUALITY ===');
console.log(`Learning lessons: ${report.learningLessons}`);
console.log(`Assessments: ${report.assessments}`);
console.log(`Ready: ${report.ready}`);
console.log(`Blocked: ${report.blocked}`);
console.log(`Average learning quality: ${report.averageScore}/100`);
console.log(`Teaching blueprint objective coverage: ${report.teachingBlueprintObjectiveCoverage}%`);
console.log(`Interactive teaching scene coverage: ${report.interactiveTeachingSceneCoverage}%`);
console.log(`Lessons with rich evidence interactions: ${report.lessonsWithRichInteractions}/${report.learningLessons}`);

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
if(strict&&blocked.length){
  console.error(`\nQuality gate failed: ${blocked.length} lesson(s) contain blocker issues.`);
  process.exit(1);
}

console.log(`\nQuality gate mode: ${strict?'STRICT':'REPORT_ONLY'}`);
