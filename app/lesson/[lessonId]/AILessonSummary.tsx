'use client';
import {useEffect,useState} from 'react';
import type {Lesson} from '../../../lib/data';
import {buildLearnerModel} from '../../../lib/learnerModel';

type Summary={headline:string;mastered:string;needsWork:string;nextStep:string;reviewQuestion:string};

export default function AILessonSummary({lesson,mastery,wrongQuestionIds=[],gapTitle}:{lesson:Lesson;mastery:number;wrongQuestionIds?:string[];gapTitle?:string|null}){
  const [summary,setSummary]=useState<Summary|null>(null);const [loading,setLoading]=useState(true);
  useEffect(()=>{let cancelled=false;const learnerModel=buildLearnerModel(lesson.student,lesson.subject);fetch('/api/ai-teacher/summary',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lessonId:lesson.id,mastery,wrongQuestionIds,gapTitle,learnerModel})}).then(r=>r.json()).then(data=>{if(cancelled)return;if(data?.summary){setSummary(data.summary);try{localStorage.setItem(`aiLessonSummary:${lesson.id}`,JSON.stringify({...data.summary,at:new Date().toISOString()}))}catch{}}}).finally(()=>{if(!cancelled)setLoading(false)});return()=>{cancelled=true}},[lesson.id,mastery,wrongQuestionIds.join(','),gapTitle]);
  if(loading)return <section className="aiWrapUp"><strong>🤖 المعلم يحلل ما تعلمتِه في هذه الجلسة…</strong></section>;
  if(!summary)return null;
  return <section className="aiWrapUp"><span className="tag">خلاصة المعلم</span><h3>{summary.headline}</h3><div className="aiWrapGrid"><div><strong>✅ ما أتقنتِه</strong><p>{summary.mastered}</p></div><div><strong>🧩 ما يحتاج تثبيتًا</strong><p>{summary.needsWork}</p></div><div><strong>➡️ الخطوة التالية</strong><p>{summary.nextStep}</p></div></div><div className="aiReviewPrompt"><strong>سؤال مراجعة لاحقًا</strong><p>{summary.reviewQuestion}</p></div></section>;
}
