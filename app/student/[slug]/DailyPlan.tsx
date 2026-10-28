'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import type {Lesson} from '../../../lib/data';

type Task={id:string;title:string;subject:string;minutes:number;type:'review'|'new'|'assessment'};

export default function DailyPlan({lessons}:{lessons:Lesson[]}){
 const [tasks,setTasks]=useState<Task[]>([]);
 const [ready,setReady]=useState(false);

 useEffect(()=>{
   const now=Date.now();
   const reviews:Task[]=[];
   const incomplete:Lesson[]=[];
   lessons.forEach(l=>{
     const done=localStorage.getItem(`lesson:${l.id}`)==='done';
     if(!done){incomplete.push(l);return}
     let due=false;
     const rawReview=localStorage.getItem(`lesson:${l.id}:review`);
     if(rawReview){try{const meta=JSON.parse(rawReview);due=new Date(meta.dueAt).getTime()<=now}catch{}}
     const rawReport=localStorage.getItem(`lesson:${l.id}:report`);
     if(rawReport){try{const report=JSON.parse(rawReport);if(report.status==='review_needed')due=true}catch{}}
     if(due)reviews.push({id:l.id,title:l.title,subject:l.subject,minutes:5,type:'review'});
   });

   const newTasks:Task[]=[];
   const subjects=[...new Set(incomplete.map(l=>l.subject))];
   subjects.forEach(subject=>{
     const regular=incomplete.find(l=>l.subject===subject&&l.kind!=='assessment');
     const assessment=incomplete.find(l=>l.subject===subject&&l.kind==='assessment');
     const picked=regular??assessment;
     if(picked)newTasks.push({id:picked.id,title:picked.title,subject:picked.subject,minutes:picked.kind==='assessment'?Math.min(picked.minutes,15):picked.minutes,type:picked.kind==='assessment'?'assessment':'new'});
   });

   setTasks([...reviews.slice(0,2),...newTasks].slice(0,4));
   setReady(true);
 },[lessons]);

 if(!ready)return <section className="dailyPlan"><div className="muted">نجهز خطة اليوم…</div></section>;
 if(tasks.length===0)return <section className="dailyPlan"><div><span className="tag">خطة اليوم</span><h2>لا توجد مهام مستحقة 🎉</h2><p className="muted">يمكنك اختيار أي درس للمراجعة أو التقدم في المحتوى.</p></div></section>;

 const icon=(subject:string)=>subject==='الرياضيات'?'📘':subject==='العلوم والحياة'?'🔬':subject==='اللغة العربية'?'📕':'🔤';
 return <section className="dailyPlan"><div className="dailyPlanHead"><div><span className="tag">خطة اليوم</span><h2>ماذا سنتعلم اليوم؟</h2></div><strong>{tasks.reduce((s,t)=>s+t.minutes,0)} دقيقة تقريبًا</strong></div><div className="dailyTasks">{tasks.map(task=><div className="dailyTask" key={`${task.type}-${task.id}`}><div className="dailyTaskIcon">{task.type==='review'?'🔄':task.type==='assessment'?'📝':icon(task.subject)}</div><div style={{flex:1}}><div className="muted" style={{fontSize:12}}>{task.type==='review'?'مراجعة مستحقة':task.type==='assessment'?'اختبار وحدة':task.subject} · {task.minutes} دقائق</div><strong>{task.title}</strong></div><Link className="btn" href={`/lesson/${task.id}`} onClick={()=>{if(task.type==='review')localStorage.setItem(`lesson:${task.id}:reviewMode`,'1')}}>{task.type==='review'?'راجعي':'ابدئي'}</Link></div>)}</div></section>;
}
