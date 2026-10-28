import {lessons} from './data';
import {recoverySkills} from './recoverySkills';
import {readTeachingProfile,type TeachingMode} from './teachingProfile';

export type LearnerGap={skillId:string;subskillId?:string;title:string;score:number;gradeAnchor?:string;cause?:string};
export type LearnerMisconception={lessonId:string;questionId:string;misconception:string;feedback:string;at?:string};
export type LearnerLessonSignal={lessonId:string;title:string;mastery:number;wrongQuestionIds:string[];understandingOutcome?:string;understandingFeedback?:string};
export type LearnerModel={
  student:string;
  subject:string;
  preferredTeachingMode?:TeachingMode;
  teachingModeScores:Record<string,number>;
  subjectMastery:number|null;
  recentLessons:LearnerLessonSignal[];
  gaps:LearnerGap[];
  misconceptions:LearnerMisconception[];
  updatedAt:string;
};

export function buildLearnerModel(student:string,subject:string):LearnerModel{
  if(typeof window==='undefined')return {student,subject,teachingModeScores:{},subjectMastery:null,recentLessons:[],gaps:[],misconceptions:[],updatedAt:new Date(0).toISOString()};
  const teaching=readTeachingProfile(student,subject);
  const teachingModeScores:Record<string,number>={};
  for(const [mode,stats] of Object.entries(teaching.modes||{})){if(stats)teachingModeScores[mode]=Number((stats as any).score||0)}

  const ownLessons=lessons.filter(l=>l.student===student&&l.subject===subject);
  const recentLessons:LearnerLessonSignal[]=[];
  const masteryValues:number[]=[];
  for(const lesson of ownLessons){
    let mastery:number|undefined;let wrongQuestionIds:string[]=[];
    const reportRaw=localStorage.getItem(`lesson:${lesson.id}:report`);
    if(reportRaw){try{const report=JSON.parse(reportRaw);if(Number.isFinite(Number(report.mastery)))mastery=Number(report.mastery);if(Array.isArray(report.wrongQuestionIds))wrongQuestionIds=report.wrongQuestionIds.map(String)}catch{}}
    if(mastery===undefined){const scoreRaw=localStorage.getItem(`lesson:${lesson.id}:score`);if(scoreRaw!==null&&lesson.questions.length)mastery=Math.round(Number(scoreRaw)/lesson.questions.length*100)}
    if(mastery===undefined)continue;
    masteryValues.push(mastery);
    let understandingOutcome:string|undefined;let understandingFeedback:string|undefined;
    const uRaw=localStorage.getItem(`aiUnderstanding:${lesson.id}`);if(uRaw){try{const u=JSON.parse(uRaw);understandingOutcome=String(u.outcome||'');understandingFeedback=String(u.feedback||'')}catch{}}
    recentLessons.push({lessonId:lesson.id,title:lesson.title,mastery,wrongQuestionIds,understandingOutcome,understandingFeedback});
  }
  recentLessons.sort((a,b)=>{const ar=localStorage.getItem(`lesson:${a.lessonId}:report`);const br=localStorage.getItem(`lesson:${b.lessonId}:report`);let at=0,bt=0;try{if(ar)at=Date.parse(JSON.parse(ar).completedAt||'')||0}catch{}try{if(br)bt=Date.parse(JSON.parse(br).completedAt||'')||0}catch{}return bt-at});

  const gaps:LearnerGap[]=[];
  for(const skill of recoverySkills){
    if(skill.subject!==subject)continue;
    const planRaw=localStorage.getItem(`recoveryPlan:${student}:${skill.id}`);
    if(planRaw){try{const plan=JSON.parse(planRaw);for(const w of plan.weak||[]){if(Number(w.score)<80)gaps.push({skillId:skill.id,subskillId:String(w.id||''),title:String(w.title||skill.title),score:Number(w.score),gradeAnchor:String(w.gradeAnchor||''),cause:String(w.cause||w.diagnosis||'')})}}catch{}}
    else{
      const raw=localStorage.getItem(`recovery:${student}:${skill.id}`);if(raw!==null&&Number(raw)<80)gaps.push({skillId:skill.id,title:skill.title,score:Number(raw),cause:skill.whyItMatters});
    }
  }
  gaps.sort((a,b)=>a.score-b.score);

  const misconceptions:LearnerMisconception[]=[];
  for(const lesson of ownLessons){
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);if(!key||!key.startsWith(`aiAnswerFeedback:${lesson.id}:`))continue;
      const raw=localStorage.getItem(key);if(!raw)continue;
      try{const x=JSON.parse(raw);if(x?.misconception)misconceptions.push({lessonId:lesson.id,questionId:key.split(':').slice(2).join(':'),misconception:String(x.misconception),feedback:String(x.feedback||''),at:String(x.at||'')})}catch{}
    }
  }
  misconceptions.sort((a,b)=>Date.parse(b.at||'')-Date.parse(a.at||''));

  return {
    student,subject,
    preferredTeachingMode:teaching.preferredMode,
    teachingModeScores,
    subjectMastery:masteryValues.length?Math.round(masteryValues.reduce((a,b)=>a+b,0)/masteryValues.length):null,
    recentLessons:recentLessons.slice(0,6),
    gaps:gaps.slice(0,10),
    misconceptions:misconceptions.slice(0,10),
    updatedAt:new Date().toISOString()
  };
}
