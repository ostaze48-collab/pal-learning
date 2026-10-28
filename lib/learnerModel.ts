import {lessons} from './data';
import {recoverySkills} from './recoverySkills';
import {readTeachingProfile,type TeachingMode} from './teachingProfile';
import {readCreativeOutcome,type CreativeSignal} from './creativeLearningProfile';
import {buildKnowledgeMap} from './masteryEngine';

export type LearnerGap={skillId:string;subskillId?:string;title:string;score:number;gradeAnchor?:string;cause?:string};
export type LearnerMisconception={lessonId:string;questionId:string;misconception:string;feedback:string;at?:string};
export type LearnerLessonSignal={lessonId:string;title:string;mastery:number;wrongQuestionIds:string[];understandingOutcome?:string;understandingFeedback?:string;summaryNeedsWork?:string;summaryNextStep?:string};
export type LearnerKnowledgeSignal={lessonId:string;title:string;status:string;readinessStatus:string;score:number|null;readiness:number|null;weakPrerequisites:Array<{title:string;score:number|null}>};
export type LearnerModel={student:string;subject:string;preferredTeachingMode?:TeachingMode;teachingModeScores:Record<string,number>;subjectMastery:number|null;recentLessons:LearnerLessonSignal[];gaps:LearnerGap[];misconceptions:LearnerMisconception[];creativeSignals:CreativeSignal[];knowledgeSignals:LearnerKnowledgeSignal[];updatedAt:string};

export function buildLearnerModel(student:string,subject:string):LearnerModel{
  if(typeof window==='undefined')return {student,subject,teachingModeScores:{},subjectMastery:null,recentLessons:[],gaps:[],misconceptions:[],creativeSignals:[],knowledgeSignals:[],updatedAt:new Date(0).toISOString()};
  const teaching=readTeachingProfile(student,subject);const teachingModeScores:Record<string,number>={};for(const [mode,stats] of Object.entries(teaching.modes||{})){if(stats)teachingModeScores[mode]=Number((stats as any).score||0)}
  const ownLessons=lessons.filter(l=>l.student===student&&l.subject===subject);const recentLessons:LearnerLessonSignal[]=[];const masteryValues:number[]=[];const creativeSignals:CreativeSignal[]=[];
  for(const lesson of ownLessons){
    const creative=readCreativeOutcome(student,lesson.id);if(creative)creativeSignals.push({lessonId:lesson.id,title:lesson.title,attempts:creative.attempts,successRate:creative.successRate,lastAt:creative.lastAt});
    let mastery:number|undefined;let wrongQuestionIds:string[]=[];const reportRaw=localStorage.getItem(`lesson:${lesson.id}:report`);
    if(reportRaw){try{const report=JSON.parse(reportRaw);if(Number.isFinite(Number(report.mastery)))mastery=Number(report.mastery);if(Array.isArray(report.wrongQuestionIds))wrongQuestionIds=report.wrongQuestionIds.map(String)}catch{}}
    if(mastery===undefined){const scoreRaw=localStorage.getItem(`lesson:${lesson.id}:score`);if(scoreRaw!==null&&lesson.questions.length)mastery=Math.round(Number(scoreRaw)/lesson.questions.length*100)}
    if(mastery===undefined)continue;masteryValues.push(mastery);
    let understandingOutcome:string|undefined;let understandingFeedback:string|undefined;let summaryNeedsWork:string|undefined;let summaryNextStep:string|undefined;
    const uRaw=localStorage.getItem(`aiUnderstanding:${lesson.id}`);if(uRaw){try{const u=JSON.parse(uRaw);understandingOutcome=String(u.outcome||'');understandingFeedback=String(u.feedback||'')}catch{}}
    const sRaw=localStorage.getItem(`aiLessonSummary:${lesson.id}`);if(sRaw){try{const s=JSON.parse(sRaw);summaryNeedsWork=String(s.needsWork||'');summaryNextStep=String(s.nextStep||'')}catch{}}
    recentLessons.push({lessonId:lesson.id,title:lesson.title,mastery,wrongQuestionIds,understandingOutcome,understandingFeedback,summaryNeedsWork,summaryNextStep});
  }
  recentLessons.sort((a,b)=>{const ar=localStorage.getItem(`lesson:${a.lessonId}:report`);const br=localStorage.getItem(`lesson:${b.lessonId}:report`);let at=0,bt=0;try{if(ar)at=Date.parse(JSON.parse(ar).completedAt||'')||0}catch{}try{if(br)bt=Date.parse(JSON.parse(br).completedAt||'')||0}catch{}return bt-at});
  creativeSignals.sort((a,b)=>Date.parse(b.lastAt||'')-Date.parse(a.lastAt||''));

  const gaps:LearnerGap[]=[];for(const skill of recoverySkills){if(skill.subject!==subject)continue;const planRaw=localStorage.getItem(`recoveryPlan:${student}:${skill.id}`);if(planRaw){try{const plan=JSON.parse(planRaw);for(const w of plan.weak||[]){if(Number(w.score)<80)gaps.push({skillId:skill.id,subskillId:String(w.id||''),title:String(w.title||skill.title),score:Number(w.score),gradeAnchor:String(w.gradeAnchor||''),cause:String(w.cause||w.diagnosis||'')})}}catch{}}else{const raw=localStorage.getItem(`recovery:${student}:${skill.id}`);if(raw!==null&&Number(raw)<80)gaps.push({skillId:skill.id,title:skill.title,score:Number(raw),cause:skill.whyItMatters})}}
  gaps.sort((a,b)=>a.score-b.score);

  const misconceptions:LearnerMisconception[]=[];for(const lesson of ownLessons){for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(!key)continue;if(key.startsWith(`aiAnswerFeedback:${lesson.id}:`)){const raw=localStorage.getItem(key);if(!raw)continue;try{const x=JSON.parse(raw);if(x?.misconception)misconceptions.push({lessonId:lesson.id,questionId:key.split(':').slice(2).join(':'),misconception:String(x.misconception),feedback:String(x.feedback||''),at:String(x.at||'')})}catch{}}else if(key===`aiUnderstanding:${lesson.id}`){const raw=localStorage.getItem(key);if(!raw)continue;try{const x=JSON.parse(raw);if(x?.outcome==='partial'||x?.outcome==='misconception'){const problem=String(x.misconception||x.feedback||'').trim();if(problem)misconceptions.push({lessonId:lesson.id,questionId:'understanding-check',misconception:problem,feedback:String(x.feedback||''),at:String(x.at||'')})}}catch{}}}}
  misconceptions.sort((a,b)=>Date.parse(b.at||'')-Date.parse(a.at||''));

  const knowledgeSignals:LearnerKnowledgeSignal[]=buildKnowledgeMap(student).nodes
    .filter(n=>n.subject===subject&&n.kind!=='foundation')
    .filter(n=>n.readinessStatus!=='ready'||n.status==='review'||n.score===null||Number(n.score)<80)
    .sort((a,b)=>{const rank=(x:any)=>x.readinessStatus==='blocked'?0:x.readinessStatus==='check'?1:x.status==='review'?2:3;return rank(a)-rank(b)})
    .slice(0,10)
    .map(n=>({lessonId:n.id.replace('lesson:',''),title:n.title,status:n.status,readinessStatus:n.readinessStatus,score:n.score,readiness:n.readiness,weakPrerequisites:n.weakPrerequisites.map(p=>({title:p.title,score:p.score}))}));

  return {student,subject,preferredTeachingMode:teaching.preferredMode,teachingModeScores,subjectMastery:masteryValues.length?Math.round(masteryValues.reduce((a,b)=>a+b,0)/masteryValues.length):null,recentLessons:recentLessons.slice(0,6),gaps:gaps.slice(0,10),misconceptions:misconceptions.slice(0,10),creativeSignals:creativeSignals.slice(0,8),knowledgeSignals,updatedAt:new Date().toISOString()};
}
