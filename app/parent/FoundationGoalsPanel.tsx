'use client';
import {useEffect,useState} from 'react';
import {getFoundationGoals} from '../../lib/foundationGoals';
import {getDeepDiagnostic} from '../../lib/deepDiagnostics';

type Row={id:string;title:string;score:number|null;accuracy:number|null;avgMs:number|null;status:'unmeasured'|'learning'|'waiting'|'stable';dueAt?:string};

export default function FoundationGoalsPanel({student}:{student:string}){
 const [rows,setRows]=useState<Row[]>([]);const [goalTitle,setGoalTitle]=useState('');
 useEffect(()=>{
  const goals=getFoundationGoals(student);if(!goals.length){setRows([]);return}
  const out:Row[]=[];setGoalTitle(goals.map(g=>g.title).join(' · '));
  for(const goal of goals){
   const diagnostic=getDeepDiagnostic(goal.skillId);
   for(const subId of goal.subskillIds){
    const sub=diagnostic?.subskills.find(s=>s.id===subId);const rawScore=localStorage.getItem(`recoveryDeep:${student}:${goal.skillId}:${subId}`);const score=rawScore===null?null:Number(rawScore);
    let stage=0;let dueAt:string|undefined;let reviewScore=score??0;const reviewRaw=localStorage.getItem(`recoveryReview:${student}:${goal.skillId}:${subId}`);if(reviewRaw){try{const r=JSON.parse(reviewRaw);stage=Number(r.stage||0);dueAt=String(r.dueAt||'')||undefined;reviewScore=Number(r.score??reviewScore)}catch{}}
    let accuracy:number|null=null;let avgMs:number|null=null;const fluencyRaw=localStorage.getItem(`foundationFluency:${student}:${subId}`);if(fluencyRaw){try{const f=JSON.parse(fluencyRaw);accuracy=Number.isFinite(Number(f.accuracy))?Number(f.accuracy):null;avgMs=Number.isFinite(Number(f.avgMs))?Number(f.avgMs):null}catch{}}
    const waiting=score!==null&&score>=80&&stage<2&&Boolean(dueAt)&&new Date(dueAt!).getTime()>Date.now();const status:Row['status']=score===null||!Number.isFinite(score)?'unmeasured':stage>=2&&reviewScore>=80?'stable':waiting?'waiting':'learning';
    out.push({id:subId,title:sub?.title||subId,score:Number.isFinite(Number(score))?score:null,accuracy,avgMs,status,dueAt});
   }
  }
  setRows(out);
 },[student]);
 if(!rows.length)return null;
 const statusText=(r:Row)=>r.status==='stable'?'ثابتة ✅':r.status==='waiting'?'بانتظار مراجعة احتفاظ':r.status==='unmeasured'?'لم تُقَس بعد':'قيد التثبيت';
 return <section className="foundationParentPanel"><div className="foundationParentHead"><div><strong>🧠 هدف تأسيسي خاص بالمعلم</strong><span>{goalTitle}</span></div><small>يظهر في لوحة الأب فقط</small></div><div className="foundationParentRows">{rows.map(r=><div className={`foundationParentRow ${r.status}`} key={r.id}><div><strong>{r.title}</strong><small>{statusText(r)}{r.status==='waiting'&&r.dueAt?` · ${new Date(r.dueAt).toLocaleDateString('ar')}`:''}</small></div><div className="foundationMetrics"><span>{r.score===null?'—':`${r.score}%`}<small>إتقان</small></span>{r.accuracy!==null&&<span>{r.accuracy}%<small>دقة سريعة</small></span>}{r.avgMs!==null&&<span>{(r.avgMs/1000).toFixed(1)}ث<small>متوسط الاستجابة</small></span>}</div></div>)}</div><p className="muted">الهدف لا يوقف منهج الصف. المعلم يضيف له تحديات قصيرة، ويغلق كل مجموعة بعد إتقانها وثباتها في مراجعة متباعدة.</p></section>;
}
