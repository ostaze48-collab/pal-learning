'use client';
import {useEffect,useState} from 'react';

const steps=[['ابدئي','🌱'],['تعلّمي','🧠'],['تدرّبي','🎯'],['احتفلي','🏆']] as const;

function detectStage(){
 if(typeof document==='undefined')return 0;
 if(document.querySelector('.lessonCelebration'))return 3;
 if(document.querySelector('.childQuestionCard:not(.diagnosticCard), .kidRemediationCard'))return 2;
 if(document.querySelector('.teacherMissionCard, .aiLessonTeacher, .creativeLessonLab'))return 1;
 return 0;
}

export default function LessonProgressRail(){
 const [stage,setStage]=useState(0);
 useEffect(()=>{const update=()=>setStage(detectStage());update();const observer=new MutationObserver(update);observer.observe(document.body,{subtree:true,childList:true,attributes:true,classFilter:['class'] as any});return()=>observer.disconnect()},[]);
 return <div className="lessonStepRail liveLessonRail" aria-label="خطوات الدرس">{steps.map(([label,icon],i)=><span key={label} className={i===stage?'active':i<stage?'done':''}><b className="railIcon">{i<stage?'✓':icon}</b><em>{i+1}</em><strong>{label}</strong></span>)}</div>;
}
