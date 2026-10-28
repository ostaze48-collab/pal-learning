'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import type {Lesson} from '../../../lib/data';
import {recoverySkills} from '../../../lib/recoverySkills';

type Task={id:string;href:string;title:string;subject:string;minutes:number;type:'review'|'new'|'assessment'|'recovery'};
type SavedPlan={skillId:string;average:number;weak:Array<{id:string;title:string;gradeAnchor:string;score:number}>};

export default function DailyPlan({lessons}:{lessons:Lesson[]}){
 const [tasks,setTasks]=useState<Task[]>([]);
 const [ready,setReady]=useState(false);

 useEffect(()=>{
   const now=Date.now();
   const reviews:Task[]=[];
   const incomplete:Lesson[]=[];
   const slug=lessons[0]?.student;
   lessons.forEach(l=>{
     const done=localStorage.getItem(`lesson:${l.id}`)==='done';
     if(!done){incomplete.push(l);return}
     let due=false;
     const rawReview=localStorage.getItem(`lesson:${l.id}:review`);
     if(rawReview){try{const meta=JSON.parse(rawReview);due=new Date(meta.dueAt).getTime()<=now}catch{}}
     const rawReport=localStorage.getItem(`lesson:${l.id}:report`);
     if(rawReport){try{const report=JSON.parse(rawReport);if(report.status==='review_needed')due=true}catch{}}
     if(due)reviews.push({id:l.id,href:`/lesson/${l.id}`,title:l.title,subject:l.subject,minutes:5,type:'review'});
   });

   const newTasks:Task[]=[];
   const subjects=[...new Set(incomplete.map(l=>l.subject))];
   subjects.forEach(subject=>{
     const regular=incomplete.find(l=>l.subject===subject&&l.kind!=='assessment');
     const assessment=incomplete.find(l=>l.subject===subject&&l.kind==='assessment');
     const picked=regular??assessment;
     if(picked)newTasks.push({id:picked.id,href:`/lesson/${picked.id}`,title:picked.title,subject:picked.subject,minutes:picked.kind==='assessment'?Math.min(picked.minutes,15):picked.minutes,type:picked.kind==='assessment'?'assessment':'new'});
   });

   let recoveryTask:Task|undefined;
   if(slug){
     const exactCandidates:Array<{skillId:string;subject:string;weak:{id:string;title:string;gradeAnchor:string;score:number}}> = [];
     for(const skill of recoverySkills){
       const raw=localStorage.getItem(`recoveryPlan:${slug}:${skill.id}`);
       if(!raw)continue;
       try{
         const plan=JSON.parse(raw) as SavedPlan;
         const weakest=plan.weak?.filter(x=>x.score<80).sort((a,b)=>a.score-b.score)[0];
         if(weakest)exactCandidates.push({skillId:skill.id,subject:skill.subject,weak:weakest});
       }catch{}
     }
     exactCandidates.sort((a,b)=>a.weak.score-b.weak.score);
     if(exactCandidates.length){
       const exact=exactCandidates[0];
       recoveryTask={id:`${exact.skillId}:${exact.weak.id}`,href:`/student/${slug}/recovery/${exact.skillId}?focus=${encodeURIComponent(exact.weak.id)}`,title:`${exact.weak.title} · ${exact.weak.gradeAnchor}`,subject:exact.subject,minutes:10,type:'recovery'};
     }else{
       const scored=recoverySkills.map(skill=>({skill,score:Number(localStorage.getItem(`recovery:${slug}:${skill.id}`))})).filter(x=>Number.isFinite(x.score)&&localStorage.getItem(`recovery:${slug}:${x.skill.id}`)!==null&&x.score<80).sort((a,b)=>a.score-b.score);
       if(scored.length){const {skill}=scored[0];recoveryTask={id:skill.id,href:`/student/${slug}/recovery/${skill.id}/deep`,title:`تشخيص أدق: ${skill.title}`,subject:skill.subject,minutes:10,type:'recovery'}}
     }
   }

   const currentGradeTasks=[...reviews.slice(0,1),...newTasks].slice(0,3);
   const merged=recoveryTask?[...currentGradeTasks,recoveryTask]:currentGradeTasks;
   setTasks(merged.slice(0,4));
   setReady(true);
 },[lessons]);

 if(!ready)return <section className="dailyPlan"><div className="muted">نجهز خطة اليوم…</div></section>;
 if(tasks.length===0)return <section className="dailyPlan"><div><span className="tag">خطة اليوم</span><h2>لا توجد مهام مستحقة 🎉</h2><p className="muted">يمكنك اختيار أي درس للمراجعة أو التقدم في المحتوى.</p></div></section>;

 const icon=(subject:string)=>subject==='الرياضيات'?'📘':subject==='العلوم والحياة'?'🔬':subject==='اللغة العربية'?'📕':'🔤';
 return <section className="dailyPlan"><div className="dailyPlanHead"><div><span className="tag">خطة اليوم</span><h2>ماذا سنتعلم اليوم؟</h2><p className="muted" style={{margin:'6px 0 0'}}>المسار الرئيس للصف الحالي، ومعه جلسة استدراك واحدة فقط لأدق فجوة تم تشخيصها.</p></div><strong>{tasks.reduce((s,t)=>s+t.minutes,0)} دقيقة تقريبًا</strong></div><div className="dailyTasks">{tasks.map(task=><div className={`dailyTask ${task.type==='recovery'?'recoveryTask':''}`} key={`${task.type}-${task.id}`}><div className="dailyTaskIcon">{task.type==='review'?'🔄':task.type==='assessment'?'📝':task.type==='recovery'?'🧩':icon(task.subject)}</div><div style={{flex:1}}><div className="muted" style={{fontSize:12}}>{task.type==='review'?'مراجعة مستحقة':task.type==='assessment'?'اختبار وحدة':task.type==='recovery'?'استدراك دقيق':task.subject} · {task.minutes} دقائق</div><strong>{task.title}</strong></div><Link className="btn" href={task.href} onClick={()=>{if(task.type==='review')localStorage.setItem(`lesson:${task.id}:reviewMode`,'1')}}>{task.type==='review'?'راجعي':task.type==='recovery'?'ثبتي هذه النقطة':'ابدئي'}</Link></div>)}</div></section>;
}
