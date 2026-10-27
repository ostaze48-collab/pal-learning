'use client';

import {useEffect,useState} from 'react';
import {apiJson} from '../../../lib/api';
import {BottomNav,Notice,Pill,PrimaryButton,PrimaryLink,ProgressBar,StudentCard,StudentShell} from '../_components/StudentUI';

type Activity={experimental:boolean;activity_id:number;lesson_code:string;title:string;prompt:string;items:Array<{id:string;label:string}>;choices:string[];total:number};
type CheckResult={experimental:boolean;activity_id:number;score:number;total:number;percent:number;passed:boolean;results:Array<{item_id:string;label:string;selected:string|null;correct:boolean;correct_answer:string|null}>};

export default function ActivityPage(){
  const [activity,setActivity]=useState<Activity|null>(null);
  const [answers,setAnswers]=useState<Record<string,string>>({});
  const [result,setResult]=useState<CheckResult|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');

  useEffect(()=>{apiJson<Activity>('/demo/activity',{},true).then(setActivity).catch(e=>setError(e.message||'تعذر تحميل النشاط'));},[]);

  async function check(){
    if(!activity)return;
    setBusy(true);setError('');
    try{
      const data=await apiJson<CheckResult>(`/demo/activity/${activity.activity_id}/check`,{
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({answers}),
      },true);
      setResult(data);
    }catch(e:any){setError(e.message||'تعذر التحقق من النشاط');}
    finally{setBusy(false);}
  }

  const answered=activity?activity.items.filter(item=>answers[item.id]).length:0;

  return <StudentShell title="نشاط المطابقة" subtitle="طابق العالم بالاكتشاف المرتبط به، ثم تحقق من إجابتك." backHref="/student/lesson">
    {error&&<div style={{marginBottom:14}}><Notice tone="bad">{error}</Notice></div>}
    {!activity&&!error&&<Notice>جارٍ تحميل النشاط…</Notice>}
    {activity&&<>
      <StudentCard style={{marginBottom:14,background:'linear-gradient(135deg,#f3fbf5,#f3f7ff)'}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-start'}}><div><Pill tone="info">المجهر واكتشاف الخلية</Pill><h2 style={{fontSize:23,margin:'9px 0 5px'}}>{activity.title}</h2><p style={{margin:0,color:'#526071',lineHeight:1.75}}>{activity.prompt}</p></div><div style={{fontSize:36}}>🧩</div></div>
        <div style={{marginTop:14}}><div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:5}}><strong>اكتمل</strong><span>{answered}/{activity.total}</span></div><ProgressBar value={Math.round(answered/Math.max(1,activity.total)*100)}/></div>
      </StudentCard>

      <div style={{display:'grid',gap:11}}>{activity.items.map((item,index)=>{
        const row=result?.results.find(x=>x.item_id===item.id);
        return <StudentCard key={item.id} style={{borderColor:row?(row.correct?'#b9dfc6':'#f0c7c7'):undefined}}>
          <div style={{display:'flex',gap:9,alignItems:'center',marginBottom:9}}><span style={{width:30,height:30,borderRadius:99,display:'grid',placeItems:'center',background:'#eef4ff',color:'#2459a6',fontWeight:900}}>{index+1}</span><strong style={{fontSize:17}}>{item.label}</strong></div>
          <select value={answers[item.id]||''} onChange={e=>!result&&setAnswers(a=>({...a,[item.id]:e.target.value}))} disabled={!!result} style={{width:'100%',padding:'12px 13px',borderRadius:11,border:'1px solid #ccd5df',background:'#fff',fontSize:15}}>
            <option value="">اختر الاكتشاف…</option>
            {activity.choices.map(choice=><option key={choice} value={choice}>{choice}</option>)}
          </select>
          {row&&<div style={{marginTop:9}}><Notice tone={row.correct?'good':'warn'}>{row.correct?'مطابقة صحيحة ✓':<>ليست المطابقة الصحيحة. الإجابة: <strong>{row.correct_answer}</strong></>}</Notice></div>}
        </StudentCard>;
      })}</div>

      {!result&&<StudentCard style={{marginTop:14}}><PrimaryButton disabled={busy||answered<activity.total} onClick={()=>void check()}>{busy?'جارٍ التحقق…':'تحقق من المطابقة'}</PrimaryButton>{answered<activity.total&&<div style={{fontSize:12,color:'#667085',marginTop:8}}>أكمل جميع المطابقات أولًا.</div>}</StudentCard>}

      {result&&<StudentCard style={{marginTop:14,background:result.passed?'#f2fbf5':'#fffaf0',borderColor:result.passed?'#b9dfc6':'#ead79d'}}>
        <Pill tone={result.passed?'good':'warn'}>{result.passed?'أحسنت ✓':'راجع المطابقات'}</Pill>
        <h2 style={{margin:'9px 0 5px'}}>النتيجة: {result.score}/{result.total} · {result.percent}%</h2>
        <p style={{margin:'0 0 12px',color:'#526071',lineHeight:1.7}}>{result.passed?'أتقنت نشاط المطابقة. تابع أسئلة الدرس.':'ظهرت لك الإجابات الصحيحة للمطابقات التي تحتاج مراجعة.'}</p>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><PrimaryLink href="/student/lesson#questions">متابعة إلى الأسئلة</PrimaryLink><PrimaryButton secondary onClick={()=>{setAnswers({});setResult(null);}}>إعادة النشاط</PrimaryButton></div>
      </StudentCard>}
      <BottomNav active="lesson"/>
    </>}
  </StudentShell>;
}
