'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {lessons,students} from '../../lib/data';

type Snapshot={completed:string[];scores:Record<string,number>};

export default function Parent(){
 const [snapshot,setSnapshot]=useState<Snapshot>({completed:[],scores:{}});
 useEffect(()=>{
   const completed=lessons.filter(l=>localStorage.getItem(`lesson:${l.id}`)==='done').map(l=>l.id);
   const scores:Record<string,number>={};
   lessons.forEach(l=>{const raw=localStorage.getItem(`lesson:${l.id}:score`);if(raw!==null)scores[l.id]=Number(raw)});
   setSnapshot({completed,scores});
 },[]);
 return <main className="shell"><div className="wrap"><div className="top"><Link className="btn secondary" href="/">← الرئيسية</Link><div className="brand">لوحة الأب</div></div><h1>متابعة التعلم</h1><p className="muted">تقدم سلمى وسما محفوظ حاليًا على هذا الجهاز. نعرض الإنجاز ومتوسط نتائج التدريبات، وسنضيف تحليل المهارات والمراجعة المتباعدة لاحقًا.</p><div className="grid">{students.map(s=>{const own=lessons.filter(l=>l.student===s.slug);const done=own.filter(l=>snapshot.completed.includes(l.id));const percent=own.length?Math.round(done.length/own.length*100):0;const scored=done.filter(l=>snapshot.scores[l.id]!==undefined);const avg=scored.length?Math.round(scored.reduce((sum,l)=>sum+(snapshot.scores[l.id]/l.questions.length*100),0)/scored.length):0;return <div className="card" key={s.slug}><h2>{s.name}</h2><div className="stats"><div className="stat"><strong>{s.grade}</strong><div className="muted">الصف</div></div><div className="stat"><strong>{done.length}</strong><div className="muted">دروس مكتملة</div></div><div className="stat"><strong>{avg}%</strong><div className="muted">متوسط التدريب</div></div></div><div style={{marginTop:14}} className="progress"><span style={{width:`${percent}%`}}/></div><div className="muted" style={{marginTop:8}}>{percent}% من المحتوى المتاح · {own.length} دروس متاحة</div>{done.length>0&&<div style={{marginTop:14,display:'grid',gap:7}}>{done.map(l=><div className="lesson" key={l.id}><div><strong>{l.title}</strong><div className="muted" style={{fontSize:12}}>تم إكماله</div></div><strong>{snapshot.scores[l.id]!==undefined?`${Math.round(snapshot.scores[l.id]/l.questions.length*100)}%`:'✓'}</strong></div>)}</div>}</div>})}</div></div></main>
}
