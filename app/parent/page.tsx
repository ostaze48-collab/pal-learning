'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {lessons,students} from '../../lib/data';

type Report={mastery:number;status:'mastered'|'review_needed';wrongQuestionIds?:string[]};
type Snapshot={completed:string[];scores:Record<string,number>;reports:Record<string,Report>};

export default function Parent(){
  const [snapshot,setSnapshot]=useState<Snapshot>({completed:[],scores:{},reports:{}});
  useEffect(()=>{
    const completed=lessons.filter(l=>localStorage.getItem(`lesson:${l.id}`)==='done').map(l=>l.id);
    const scores:Record<string,number>={};
    const reports:Record<string,Report>={};
    lessons.forEach(l=>{
      const rawScore=localStorage.getItem(`lesson:${l.id}:score`);
      if(rawScore!==null)scores[l.id]=Number(rawScore);
      const rawReport=localStorage.getItem(`lesson:${l.id}:report`);
      if(rawReport){try{reports[l.id]=JSON.parse(rawReport)}catch{}}
    });
    setSnapshot({completed,scores,reports});
  },[]);

  const lessonMastery=(id:string,total:number)=>snapshot.reports[id]?.mastery ?? (snapshot.scores[id]!==undefined?Math.round(snapshot.scores[id]/total*100):0);

  return <main className="shell"><div className="wrap">
    <div className="top"><Link className="btn secondary" href="/">← الرئيسية</Link><div className="brand">لوحة الأب</div></div>
    <h1>متابعة التعلم</h1>
    <p className="muted">تعرض اللوحة الإنجاز، الإتقان النهائي بعد العلاج، والدروس التي ما زالت تحتاج مراجعة.</p>

    <div className="grid">{students.map(s=>{
      const own=lessons.filter(l=>l.student===s.slug);
      const done=own.filter(l=>snapshot.completed.includes(l.id));
      const percent=own.length?Math.round(done.length/own.length*100):0;
      const avg=done.length?Math.round(done.reduce((sum,l)=>sum+lessonMastery(l.id,l.questions.length),0)/done.length):0;
      const review=done.filter(l=>snapshot.reports[l.id]?.status==='review_needed');
      const subjects=[...new Set(own.map(l=>l.subject))];
      return <div className="card" key={s.slug}>
        <div className="subjectStatTop"><h2 style={{margin:0}}>{s.name}</h2>{review.length>0&&<span className="reviewBadge">{review.length} يحتاج مراجعة</span>}</div>
        <div className="stats" style={{marginTop:14}}>
          <div className="stat"><strong>{s.grade}</strong><div className="muted">الصف</div></div>
          <div className="stat"><strong>{done.length}</strong><div className="muted">مكتمل</div></div>
          <div className="stat"><strong>{avg}%</strong><div className="muted">متوسط الإتقان</div></div>
        </div>
        <div style={{marginTop:14}} className="progress"><span style={{width:`${percent}%`}}/></div>
        <div className="muted" style={{marginTop:8}}>{percent}% من المحتوى المتاح · {own.length} درسًا واختبارًا</div>

        {review.length>0&&<div className="reviewBox"><strong>📌 مراجعات مقترحة</strong>{review.slice(0,4).map(l=><div key={l.id} className="reviewItem"><span>{l.title}</span><strong>{lessonMastery(l.id,l.questions.length)}%</strong></div>)}</div>}

        <div style={{display:'grid',gap:10,marginTop:18}}>{subjects.map(subject=>{
          const subjectLessons=own.filter(l=>l.subject===subject);
          const subjectDone=subjectLessons.filter(l=>snapshot.completed.includes(l.id));
          const subjectAvg=subjectDone.length?Math.round(subjectDone.reduce((sum,l)=>sum+lessonMastery(l.id,l.questions.length),0)/subjectDone.length):0;
          const subjectPercent=subjectLessons.length?Math.round(subjectDone.length/subjectLessons.length*100):0;
          const subjectReview=subjectDone.filter(l=>snapshot.reports[l.id]?.status==='review_needed').length;
          const icon=subject==='الرياضيات'?'📘':subject==='العلوم والحياة'?'🔬':subject==='اللغة العربية'?'📕':'🔤';
          return <div className="subjectStat" key={subject}>
            <div className="subjectStatTop"><strong>{icon} {subject}</strong><span>{subjectDone.length}/{subjectLessons.length}</span></div>
            <div className="progress"><span style={{width:`${subjectPercent}%`}}/></div>
            <div className="muted" style={{fontSize:12,marginTop:6}}>الإنجاز {subjectPercent}% · متوسط الإتقان {subjectAvg}%{subjectReview?` · ${subjectReview} مراجعة`:''}</div>
          </div>
        })}</div>
      </div>
    })}</div>
  </div></main>
}
