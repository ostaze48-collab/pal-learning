'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import type {Lesson} from '../../../lib/data';
import {recoverySkills} from '../../../lib/recoverySkills';
import {getDeepDiagnostic} from '../../../lib/deepDiagnostics';
import {buildKnowledgeMap} from '../../../lib/masteryEngine';
import {getNextOpenFoundationGoal} from '../../../lib/foundationGoals';

type Task={id:string;href:string;title:string;subject:string;minutes:number;type:'review'|'reteach'|'new'|'assessment'|'recovery'};
type SavedPlan={skillId:string;average:number;weak:Array<{id:string;title:string;gradeAnchor:string;score:number}>};
type TeacherDecision={decision:'advance'|'review'|'targeted_reteach';reviewAt?:string;focus?:string};

export default function DailyPlan({lessons}:{lessons:Lesson[]}){
 const [tasks,setTasks]=useState<Task[]>([]);
 const [ready,setReady]=useState(false);
 const [recoveryFirst,setRecoveryFirst]=useState(false);
 const [teacherFirst,setTeacherFirst]=useState(false);

 useEffect(()=>{
   const now=Date.now();
   const reviews:Task[]=[];
   const incomplete:Lesson[]=[];
   const slug=lessons[0]?.student;
   const knowledge=slug?buildKnowledgeMap(slug):null;
   const knowledgeNodes=knowledge?.nodes||[];
   lessons.forEach(l=>{
     const done=localStorage.getItem(`lesson:${l.id}`)==='done';
     if(!done){incomplete.push(l);return}
     let teacherHandled=false;
     const rawDecision=localStorage.getItem(`teacherDecision:${l.id}`)||localStorage.getItem(`lesson:${l.id}:teacherDecision`);
     if(rawDecision){try{const decision=JSON.parse(rawDecision) as TeacherDecision;if(decision.decision==='targeted_reteach'){reviews.push({id:l.id,href:`/lesson/${l.id}`,title:decision.focus?`ثبتي: ${decision.focus}`:`ثبتي نقطة من ${l.title}`,subject:l.subject,minutes:8,type:'reteach'});teacherHandled=true}else if(decision.decision==='review'){const due=decision.reviewAt?new Date(decision.reviewAt).getTime()<=now:false;if(due){reviews.push({id:l.id,href:`/lesson/${l.id}`,title:l.title,subject:l.subject,minutes:5,type:'review'});teacherHandled=true}}}catch{}}
     if(teacherHandled)return;
     let due=false;
     const rawReview=localStorage.getItem(`lesson:${l.id}:review`);
     if(rawReview){try{const meta=JSON.parse(rawReview);due=new Date(meta.dueAt).getTime()<=now}catch{}}
     const rawReport=localStorage.getItem(`lesson:${l.id}:report`);
     if(rawReport){try{const report=JSON.parse(rawReport);if(report.status==='review_needed')due=true}catch{}}
     if(due)reviews.push({id:l.id,href:`/lesson/${l.id}`,title:l.title,subject:l.subject,minutes:5,type:'review'});
   });

   reviews.sort((a,b)=>a.type===b.type?0:a.type==='reteach'?-1:b.type==='reteach'?1:0);
   const newTasks:Task[]=[];
   const subjects=[...new Set(incomplete.map(l=>l.subject))];
   subjects.forEach(subject=>{
     const subjectIncomplete=incomplete.filter(l=>l.subject===subject);
     const nodeFor=(l:Lesson)=>knowledgeNodes.find(n=>n.id===`lesson:${l.id}`);
     const readyRegular=subjectIncomplete.find(l=>l.kind!=='assessment'&&nodeFor(l)?.readinessStatus==='ready');
     const checkRegular=subjectIncomplete.find(l=>l.kind!=='assessment'&&nodeFor(l)?.readinessStatus==='check');
     const readyAssessment=subjectIncomplete.find(l=>l.kind==='assessment'&&nodeFor(l)?.readinessStatus==='ready');
     const checkAssessment=subjectIncomplete.find(l=>l.kind==='assessment'&&nodeFor(l)?.readinessStatus==='check');
     const picked=readyRegular??checkRegular??readyAssessment??checkAssessment;
     if(picked)newTasks.push({id:picked.id,href:`/lesson/${picked.id}`,title:picked.title,subject:picked.subject,minutes:picked.kind==='assessment'?Math.min(picked.minutes,15):Math.min(picked.minutes,18),type:picked.kind==='assessment'?'assessment':'new'});
   });

   let recoveryTask:Task|undefined;
   let severeGap=false;
   if(slug){
     const blockedLesson=knowledgeNodes.find(n=>n.kind==='lesson'&&n.readinessStatus==='blocked'&&(n.score===null||n.score<80));
     const blockedPrereq=blockedLesson?.weakPrerequisites.find(p=>p.score!==null&&p.score<65&&p.id.startsWith('foundation:'));
     if(blockedLesson&&blockedPrereq){
       const skillId=blockedPrereq.id.replace('foundation:','');const skill=recoverySkills.find(s=>s.id===skillId);
       if(skill){severeGap=true;recoveryTask={id:`knowledge:${skillId}`,href:`/student/${slug}/recovery/${skillId}/deep`,title:`قبل ${blockedLesson.title}: ${skill.title}`,subject:skill.subject,minutes:10,type:'recovery'}}
     }
     if(!recoveryTask){
       const exactCandidates:Array<{skillId:string;subject:string;weak:{id:string;title:string;gradeAnchor:string;score:number}}> = [];
       const retentionCandidates:Array<{skillId:string;subject:string;subId:string;title:string;due:number}> = [];
       for(const skill of recoverySkills){
         const raw=localStorage.getItem(`recoveryPlan:${slug}:${skill.id}`);
         if(raw){try{const plan=JSON.parse(raw) as SavedPlan;const weakest=plan.weak?.filter(x=>x.score<80).sort((a,b)=>a.score-b.score)[0];if(weakest)exactCandidates.push({skillId:skill.id,subject:skill.subject,weak:weakest})}catch{}}
         const diagnostic=getDeepDiagnostic(skill.id);
         for(const sub of diagnostic?.subskills||[]){
           const reviewRaw=localStorage.getItem(`recoveryReview:${slug}:${skill.id}:${sub.id}`);if(!reviewRaw)continue;
           try{const meta=JSON.parse(reviewRaw);const due=new Date(meta.dueAt).getTime();const deepScore=Number(localStorage.getItem(`recoveryDeep:${slug}:${skill.id}:${sub.id}`));if(meta.status==='retention_check'&&Number.isFinite(due)&&due<=now&&deepScore>=80)retentionCandidates.push({skillId:skill.id,subject:skill.subject,subId:sub.id,title:sub.title,due})}catch{}
         }
       }
       exactCandidates.sort((a,b)=>a.weak.score-b.weak.score);retentionCandidates.sort((a,b)=>a.due-b.due);
       if(exactCandidates.length){const exact=exactCandidates[0];severeGap=exact.weak.score<50;recoveryTask={id:`${exact.skillId}:${exact.weak.id}`,href:`/student/${slug}/recovery/${exact.skillId}?focus=${encodeURIComponent(exact.weak.id)}`,title:`${exact.weak.title}`,subject:exact.subject,minutes:10,type:'recovery'}}
       else if(retentionCandidates.length){const due=retentionCandidates[0];recoveryTask={id:`retention:${due.skillId}:${due.subId}`,href:`/student/${slug}/recovery/${due.skillId}?focus=${encodeURIComponent(due.subId)}&review=1`,title:`ثبتي: ${due.title}`,subject:due.subject,minutes:5,type:'recovery'}}
       else {const scored=recoverySkills.map(skill=>({skill,score:Number(localStorage.getItem(`recovery:${slug}:${skill.id}`))})).filter(x=>Number.isFinite(x.score)&&localStorage.getItem(`recovery:${slug}:${x.skill.id}`)!==null&&x.score<80).sort((a,b)=>a.score-b.score);if(scored.length){const {skill,score}=scored[0];severeGap=score<50;recoveryTask={id:skill.id,href:`/student/${slug}/recovery/${skill.id}/deep`,title:skill.title,subject:skill.subject,minutes:10,type:'recovery'}}}
       if(!recoveryTask){
         const goal=getNextOpenFoundationGoal(slug);
         if(goal){
           const diagnostic=getDeepDiagnostic(goal.skillId);
           const sub=diagnostic?.subskills.find(x=>x.id===goal.subskillId);
           recoveryTask={id:`foundation-goal:${goal.skillId}:${goal.subskillId}`,href:`/student/${slug}/recovery/${goal.skillId}?focus=${encodeURIComponent(goal.subskillId)}`,title:`تحدي ذهني: ${sub?.title||goal.title}`,subject:goal.subject,minutes:7,type:'recovery'};
         }
       }
     }
   }

   const urgentTeacher=reviews.find(t=>t.type==='reteach');
   const otherReviews=reviews.filter(t=>t!==urgentTeacher).slice(0,1);
   const candidates=[...(urgentTeacher?[urgentTeacher]:[]),...otherReviews,...newTasks];
   const currentGradeTasks:Task[]=[];let currentMinutes=0;
   for(const task of candidates){if(currentGradeTasks.length>=3)break;if(currentGradeTasks.length>=2&&currentMinutes+task.minutes>45)continue;currentGradeTasks.push(task);currentMinutes+=task.minutes}
   const merged=recoveryTask?(severeGap?[recoveryTask,...currentGradeTasks]:[...currentGradeTasks,recoveryTask]):currentGradeTasks;
   setRecoveryFirst(Boolean(recoveryTask&&severeGap));setTeacherFirst(Boolean(urgentTeacher&&!severeGap));setTasks(merged.slice(0,4));setReady(true);
 },[lessons]);

 if(!ready)return <section className="dailyPlan"><div className="muted">✨ أرتب لكِ مهمة اليوم…</div></section>;
 if(tasks.length===0)return <section className="dailyPlan celebrationPlan"><div><span className="tag">مهمة اليوم</span><h2>رائع! لا توجد مهام مستحقة 🎉</h2><p className="muted">يمكنك اختيار درس تحبين مراجعته أو أخذ استراحة مستحقة.</p></div></section>;

 const icon=(subject:string)=>subject==='الرياضيات'?'➗':subject==='العلوم والحياة'?'🔬':subject==='اللغة العربية'?'📚':'🌍';
 return <section className="dailyPlan"><div className="dailyPlanHead"><div><span className="tag">⭐ مهمتك الآن</span><h2>{recoveryFirst?'نبدأ بخطوة صغيرة تقوّيك':teacherFirst?'المعلم اختار نقطة نثبتها أولًا':'ماذا سننجز اليوم؟'}</h2><p>{recoveryFirst?'المعلم وجد مهارة مرتبطة مباشرة بما ستتعلمينه. نقوّيها باختصار ثم نعود إلى درس صفك.':teacherFirst?'لن نعيد الدرس كاملًا؛ نتحقق من نقطة واحدة ثم نكمل المسار.':'الخطة تجمع درس صفك مع تحديات قصيرة تقوّي سرعتك وثقتك من دون إيقاف المسار.'}</p></div><div className="todayTime"><strong>{tasks.reduce((s,t)=>s+t.minutes,0)}</strong><span>دقيقة تقريبًا</span></div></div><div className="dailyTasks">{tasks.map((task,index)=><div className={`dailyTask ${task.type==='recovery'?'recoveryTask':task.type==='reteach'?'reteachTask':''}`} key={`${task.type}-${task.id}`}><div className="taskOrder">{index+1}</div><div className="dailyTaskIcon">{task.type==='review'?'🔄':task.type==='reteach'?'🎯':task.type==='assessment'?'🏆':task.type==='recovery'?'⚡':icon(task.subject)}</div><div className="dailyTaskCopy"><small>{task.type==='review'?'مراجعة سريعة':task.type==='reteach'?'تثبيت اختاره المعلم':task.type==='assessment'?'تحدي قصير':task.type==='recovery'?'تحدي مهارة قصير':task.subject} · {task.minutes} دقائق</small><strong>{task.title}</strong></div><Link className="btn" href={task.href} onClick={()=>{if(task.type==='review'||task.type==='reteach')localStorage.setItem(`lesson:${task.id}:reviewMode`,'1')}}>{task.type==='review'?'راجعي':task.type==='reteach'?'ثبتيها':task.type==='recovery'?'ابدئي التحدي':'ابدئي'} ←</Link></div>)}</div></section>;
}
