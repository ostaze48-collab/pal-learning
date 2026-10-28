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

  return <main className="shell"><div className="wrap">
    <div className="top"><Link className="btn secondary" href="/">← الرئيسية</Link><div className="brand">لوحة الأب</div></div>
    <h1>متابعة التعلم</h1>
    <p className="muted">النتائج محفوظة حاليًا على هذا الجهاز. تعرض اللوحة التقدم العام ثم تفصيل كل مادة.</p>

    <div className="grid">{students.map(s=>{
      const own=lessons.filter(l=>l.student===s.slug);
      const done=own.filter(l=>snapshot.completed.includes(l.id));
      const percent=own.length?Math.round(done.length/own.length*100):0;
      const scored=done.filter(l=>snapshot.scores[l.id]!==undefined);
      const avg=scored.length?Math.round(scored.reduce((sum,l)=>sum+(snapshot.scores[l.id]/l.questions.length*100),0)/scored.length):0;
      const subjects=[...new Set(own.map(l=>l.subject))];
      return <div className="card" key={s.slug}>
        <h2>{s.name}</h2>
        <div className="stats">
          <div className="stat"><strong>{s.grade}</strong><div className="muted">الصف</div></div>
          <div className="stat"><strong>{done.length}</strong><div className="muted">مكتمل</div></div>
          <div className="stat"><strong>{avg}%</strong><div className="muted">متوسط النتائج</div></div>
        </div>
        <div style={{marginTop:14}} className="progress"><span style={{width:`${percent}%`}}/></div>
        <div className="muted" style={{marginTop:8}}>{percent}% من المحتوى المتاح · {own.length} درسًا واختبارًا</div>

        <div style={{display:'grid',gap:10,marginTop:18}}>{subjects.map(subject=>{
          const subjectLessons=own.filter(l=>l.subject===subject);
          const subjectDone=subjectLessons.filter(l=>snapshot.completed.includes(l.id));
          const subjectScored=subjectDone.filter(l=>snapshot.scores[l.id]!==undefined);
          const subjectAvg=subjectScored.length?Math.round(subjectScored.reduce((sum,l)=>sum+(snapshot.scores[l.id]/l.questions.length*100),0)/subjectScored.length):0;
          const subjectPercent=subjectLessons.length?Math.round(subjectDone.length/subjectLessons.length*100):0;
          const icon=subject==='الرياضيات'?'📘':subject==='العلوم والحياة'?'🔬':subject==='اللغة العربية'?'📕':'🔤';
          return <div className="subjectStat" key={subject}>
            <div className="subjectStatTop"><strong>{icon} {subject}</strong><span>{subjectDone.length}/{subjectLessons.length}</span></div>
            <div className="progress"><span style={{width:`${subjectPercent}%`}}/></div>
            <div className="muted" style={{fontSize:12,marginTop:6}}>الإنجاز {subjectPercent}% · متوسط النتائج {subjectAvg}%</div>
          </div>
        })}</div>
      </div>
    })}</div>
  </div></main>
}
