'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {lessons,students} from '../../lib/data';

export default function Parent(){
 const [completed,setCompleted]=useState<string[]>([]);
 useEffect(()=>{setCompleted(lessons.filter(l=>localStorage.getItem(`lesson:${l.id}`)==='done').map(l=>l.id))},[]);
 return <main className="shell"><div className="wrap"><div className="top"><Link className="btn secondary" href="/">← الرئيسية</Link><div className="brand">لوحة الأب</div></div><h1>متابعة التعلم</h1><p className="muted">نسخة أولى بسيطة. سنضيف تحليل المهارات والمراجعات بعد استقرار محرك الدروس.</p><div className="grid">{students.map(s=>{const own=lessons.filter(l=>l.student===s.slug);const done=own.filter(l=>completed.includes(l.id));const percent=own.length?Math.round(done.length/own.length*100):0;return <div className="card" key={s.slug}><h2>{s.name}</h2><div className="stats"><div className="stat"><strong>{s.grade}</strong><div className="muted">الصف</div></div><div className="stat"><strong>{done.length}</strong><div className="muted">دروس مكتملة</div></div><div className="stat"><strong>{own.length}</strong><div className="muted">دروس متاحة</div></div></div><div style={{marginTop:14}} className="progress"><span style={{width:`${percent}%`}}/></div><div className="muted" style={{marginTop:8}}>{percent}% من المحتوى المتاح</div></div>})}</div></div></main>
}
