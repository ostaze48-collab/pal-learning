'use client';
import {useEffect,useState} from 'react';
import {apiJson,findFirstPublishedLesson} from '../../lib/api';

export default function Student(){
  const [lesson,setLesson]=useState<any>(null);
  const [plan,setPlan]=useState<any>(null);
  const [error,setError]=useState('');
  useEffect(()=>{
    if(!localStorage.getItem('pal_student_token')){setError('سجّل الدخول لعرض مسارك الشخصي.');return;}
    Promise.all([
      findFirstPublishedLesson(),
      apiJson<any>('/learning/me/daily-plan?minutes=20',{},true)
    ]).then(([l,p])=>{setLesson(l);setPlan(p)}).catch(e=>setError(e.message||'تعذر تحميل بيانات التعلم'));
  },[]);
  return <main style={{maxWidth:900,margin:'32px auto',padding:20}}>
    <h1>مرحبًا 👋</h1>
    {error&&<div style={{padding:14,borderRadius:12,background:'#fff4e5',marginBottom:14}}>{error} <a href="/student/login">دخول الطالب</a></div>}
    <section style={{background:'white',padding:20,borderRadius:16,border:'1px solid #e8edf5'}}>
      <div style={{opacity:.65}}>أكمل تعلمك</div>
      <h2>{lesson?.lesson?.title || 'جارٍ تحميل الدرس…'}</h2>
      <p>{lesson ? `${lesson.book.title} · ${lesson.unit.title}` : 'سيظهر أول درس منشور من المنهاج.'}</p>
      <a href="/student/lesson" style={{display:'inline-block',padding:'11px 16px',borderRadius:12,background:'#1f6feb',color:'white',textDecoration:'none'}}>متابعة الدرس</a>
    </section>
    <section style={{marginTop:16,background:'white',padding:20,borderRadius:16,border:'1px solid #e8edf5'}}>
      <div style={{opacity:.65}}>خطة اليوم</div>
      {!plan&&<p>جارٍ إعداد الخطة…</p>}
      {plan?.plan?.map((x:any,i:number)=><div key={i} style={{padding:'10px 0',borderBottom:'1px solid #edf1f7'}}><strong>{x.title}</strong><div style={{fontSize:14,opacity:.7}}>{x.minutes} دقائق · {x.type}</div></div>)}
    </section>
    <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:14}}><a href="/student/progress">تقدمي حسب المهارات</a><a href="/student/recovery">مسار Learning Recovery</a></div>
  </main>
}
