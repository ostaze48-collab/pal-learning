'use client';
import {useEffect,useState} from 'react';
import type {Lesson} from '../../../lib/data';
import {buildLearnerModel} from '../../../lib/learnerModel';

type Decision='advance'|'review'|'targeted_reteach';
type Summary={headline:string;mastered:string;needsWork:string;nextStep:string;reviewQuestion:string;decision?:Decision;reviewInDays?:number;focus?:string};

export default function AILessonSummary({lesson,mastery,wrongQuestionIds=[],gapTitle}:{lesson:Lesson;mastery:number;wrongQuestionIds?:string[];gapTitle?:string|null}){
  const [summary,setSummary]=useState<Summary|null>(null);const [loading,setLoading]=useState(true);
  useEffect(()=>{let cancelled=false;const learnerModel=buildLearnerModel(lesson.student,lesson.subject);fetch('/api/ai-teacher/summary',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lessonId:lesson.id,mastery,wrongQuestionIds,gapTitle,learnerModel})}).then(r=>r.json()).then(data=>{if(cancelled)return;if(data?.summary){const next:Summary=data.summary;setSummary(next);try{const at=new Date().toISOString();localStorage.setItem(`aiLessonSummary:${lesson.id}`,JSON.stringify({...next,at}));if(next.decision){const reviewInDays=Math.max(1,Number(next.reviewInDays)||1);const reviewAt=new Date(Date.now()+reviewInDays*24*60*60*1000).toISOString();localStorage.setItem(`teacherDecision:${lesson.id}`,JSON.stringify({lessonId:lesson.id,student:lesson.student,subject:lesson.subject,decision:next.decision,reviewInDays,reviewAt,focus:String(next.focus||''),mastery,at}))}}catch{}}}).finally(()=>{if(!cancelled)setLoading(false)});return()=>{cancelled=true}},[lesson.id,mastery,wrongQuestionIds.join(','),gapTitle]);
  if(loading)return <section className="aiWrapUp"><strong>🧑‍🏫 المعلم يقرر الخطوة التالية بناءً على هذه الجلسة…</strong></section>;
  if(!summary)return null;
  const decisionLabel=summary.decision==='advance'?'✅ جاهزة للانتقال':summary.decision==='targeted_reteach'?'🎯 نثبت نقطة واحدة أولًا':'🔁 مراجعة قصيرة ثم نكمل';
  return <section className="aiWrapUp"><span className="tag">قرار المعلم</span><h3>{summary.headline}</h3>{summary.decision&&<div className={`teacherDecision ${summary.decision}`}><strong>{decisionLabel}</strong>{summary.focus&&<p>{summary.focus}</p>}</div>}<div className="aiWrapGrid"><div><strong>✅ ما أتقنتِه</strong><p>{summary.mastered}</p></div><div><strong>🧩 ما يحتاج تثبيتًا</strong><p>{summary.needsWork}</p></div><div><strong>➡️ الخطوة التالية</strong><p>{summary.nextStep}</p></div></div><div className="aiReviewPrompt"><strong>سؤال مراجعة لاحقًا</strong><p>{summary.reviewQuestion}</p>{summary.reviewInDays&&<small>سيعود هذا التحقق بعد نحو {summary.reviewInDays} {summary.reviewInDays===1?'يوم':'أيام'}.</small>}</div></section>;
}
