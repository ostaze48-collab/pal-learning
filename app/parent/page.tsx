'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {lessons,students} from '../../lib/data';
import {recoverySkills} from '../../lib/recoverySkills';
import TutorStatus from './TutorStatus';

type Report={mastery:number;status:'mastered'|'review_needed';wrongQuestionIds?:string[]};
type Snapshot={completed:string[];scores:Record<string,number>;reports:Record<string,Report>;times:Record<string,number>;recovery:Record<string,number>};

async function hashPin(pin:string){const bytes=new TextEncoder().encode(pin);const digest=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('')}

export default function Parent(){
  const [snapshot,setSnapshot]=useState<Snapshot>({completed:[],scores:{},reports:{},times:{},recovery:{}});
  const [pinHash,setPinHash]=useState<string|null|undefined>(undefined);const [unlocked,setUnlocked]=useState(false);const [pin,setPin]=useState('');const [pinError,setPinError]=useState('');const [backupMessage,setBackupMessage]=useState('');

  useEffect(()=>{setPinHash(localStorage.getItem('parent:pinHash'));refreshSnapshot()},[]);

  function refreshSnapshot(){
    const completed=lessons.filter(l=>localStorage.getItem(`lesson:${l.id}`)==='done').map(l=>l.id);const scores:Record<string,number>={};const reports:Record<string,Report>={};const times:Record<string,number>={};const recovery:Record<string,number>={};
    lessons.forEach(l=>{const rawScore=localStorage.getItem(`lesson:${l.id}:score`);if(rawScore!==null)scores[l.id]=Number(rawScore);const rawReport=localStorage.getItem(`lesson:${l.id}:report`);if(rawReport){try{reports[l.id]=JSON.parse(rawReport)}catch{}}const rawTime=localStorage.getItem(`lesson:${l.id}:timeSeconds`);if(rawTime!==null)times[l.id]=Number(rawTime)});
    students.forEach(s=>recoverySkills.forEach(skill=>{const raw=localStorage.getItem(`recovery:${s.slug}:${skill.id}`);if(raw!==null)recovery[`${s.slug}:${skill.id}`]=Number(raw)}));
    setSnapshot({completed,scores,reports,times,recovery});
  }

  async function submitPin(){setPinError('');if(!/^\d{4}$/.test(pin)){setPinError('أدخل 4 أرقام فقط.');return}const hashed=await hashPin(pin);if(pinHash===null){localStorage.setItem('parent:pinHash',hashed);setPinHash(hashed);setUnlocked(true);setPin('');return}if(hashed===pinHash){setUnlocked(true);setPin('')}else setPinError('الرمز غير صحيح.')}

  function exportProgress(){const data:Record<string,string>={};for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key&&(key.startsWith('lesson:')||key.startsWith('recovery:'))){const value=localStorage.getItem(key);if(value!==null)data[key]=value}}const payload={app:'salma-sama-learning',version:2,createdAt:new Date().toISOString(),data};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`salma-sama-progress-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);setBackupMessage('تم إنشاء نسخة تشمل تقدم الدروس وخريطة الفجوات.')}
  async function importProgress(file:File){setBackupMessage('');try{const payload=JSON.parse(await file.text());if(payload?.app!=='salma-sama-learning'||typeof payload?.data!=='object')throw new Error('invalid');Object.entries(payload.data).forEach(([key,value])=>{if((key.startsWith('lesson:')||key.startsWith('recovery:'))&&typeof value==='string')localStorage.setItem(key,value)});refreshSnapshot();setBackupMessage('تمت استعادة التقدم وخريطة الفجوات بنجاح.')}catch{setBackupMessage('تعذر قراءة ملف النسخة الاحتياطية.')}}

  if(pinHash===undefined)return <main className="shell"><div className="wrap"><div className="card">جاري تحميل لوحة الأب…</div></div></main>;
  if(!unlocked)return <main className="shell"><div className="wrap"><div className="top"><Link className="btn secondary" href="/">← الرئيسية</Link><div className="brand">لوحة الأب 🔒</div></div><div className="pinCard"><div className="pinIcon">🔐</div><h1>{pinHash===null?'إنشاء رمز لوحة الأب':'أدخل رمز لوحة الأب'}</h1><p className="muted">{pinHash===null?'اختر PIN من 4 أرقام. سيُحفظ على هذا الجهاز فقط.':'نتائج سلمى وسما محمية برمز PIN على هذا الجهاز.'}</p><input className="pinInput" inputMode="numeric" pattern="[0-9]*" maxLength={4} value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,'').slice(0,4))} onKeyDown={e=>{if(e.key==='Enter')submitPin()}} placeholder="••••" aria-label="PIN"/>{pinError&&<div className="pinError">{pinError}</div>}<button className="btn" onClick={submitPin}>{pinHash===null?'حفظ وفتح اللوحة':'فتح اللوحة'}</button></div></div></main>;

  const lessonMastery=(id:string,total:number)=>snapshot.reports[id]?.mastery ?? (snapshot.scores[id]!==undefined?Math.round(snapshot.scores[id]/total*100):0);
  const minutesFor=(ids:string[])=>Math.round(ids.reduce((sum,id)=>sum+(snapshot.times[id]||0),0)/60);

  return <main className="shell"><div className="wrap">
    <div className="top"><Link className="btn secondary" href="/">← الرئيسية</Link><div style={{display:'flex',gap:8,alignItems:'center'}}><button className="btn secondary" onClick={()=>setUnlocked(false)}>🔒 قفل</button><div className="brand">لوحة الأب</div></div></div>
    <h1>متابعة التعلم</h1><p className="muted">تعرض اللوحة إنجاز الصف الحالي، الإتقان، الوقت، والمراجعات، إضافة إلى فجوات الصفوف السابقة في جميع المواد.</p>
    <TutorStatus/>
    <section className="backupBar"><div><strong>💾 النسخة الاحتياطية</strong><div className="muted" style={{fontSize:13}}>احفظ تقدم الدروس وخريطة الفجوات، أو استعدها على جهاز آخر.</div></div><div className="backupActions"><button className="btn secondary" onClick={exportProgress}>تنزيل نسخة</button><label className="btn secondary">استعادة نسخة<input type="file" accept="application/json,.json" hidden onChange={e=>{const f=e.target.files?.[0];if(f)importProgress(f);e.currentTarget.value=''}}/></label></div>{backupMessage&&<div className="backupMessage">{backupMessage}</div>}</section>

    <div className="grid">{students.map(s=>{
      const own=lessons.filter(l=>l.student===s.slug);const done=own.filter(l=>snapshot.completed.includes(l.id));const percent=own.length?Math.round(done.length/own.length*100):0;const avg=done.length?Math.round(done.reduce((sum,l)=>sum+lessonMastery(l.id,l.questions.length),0)/done.length):0;const review=done.filter(l=>snapshot.reports[l.id]?.status==='review_needed');const subjects=[...new Set(own.map(l=>l.subject))];const totalMinutes=minutesFor(own.map(l=>l.id));
      const gaps=recoverySkills.map(skill=>({skill,score:snapshot.recovery[`${s.slug}:${skill.id}`]})).filter(x=>x.score!==undefined&&x.score<80).sort((a,b)=>a.score-b.score);
      const screenedCount=recoverySkills.filter(skill=>snapshot.recovery[`${s.slug}:${skill.id}`]!==undefined).length;
      return <div className="card" key={s.slug}><div className="subjectStatTop"><h2 style={{margin:0}}>{s.name}</h2><div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{review.length>0&&<span className="reviewBadge">{review.length} يحتاج مراجعة</span>}{gaps.length>0&&<span className="reviewBadge">🧩 {gaps.length} فجوات</span>}</div></div><div className="stats" style={{marginTop:14}}><div className="stat"><strong>{s.grade}</strong><div className="muted">الصف</div></div><div className="stat"><strong>{done.length}</strong><div className="muted">مكتمل</div></div><div className="stat"><strong>{avg}%</strong><div className="muted">الإتقان</div></div><div className="stat"><strong>{totalMinutes}</strong><div className="muted">دقيقة تعلم</div></div></div><div style={{marginTop:14}} className="progress"><span style={{width:`${percent}%`}}/></div><div className="muted" style={{marginTop:8}}>{percent}% من المحتوى المتاح · {own.length} درسًا واختبارًا</div>
      {gaps.length>0&&<div className="reviewBox"><strong>🧩 فجوات تعليمية ذات أولوية</strong>{gaps.slice(0,6).map(({skill,score})=><div key={skill.id} className="reviewItem"><span><b>{skill.subject}</b> · {skill.title}</span><strong>{score}%</strong></div>)}<div className="muted" style={{fontSize:12,marginTop:10}}>تم فحص {screenedCount} من {recoverySkills.length} مهارة أساسية حتى الآن. نعالج الأضعف أولًا مع استمرار الصف الحالي.</div></div>}
      {review.length>0&&<div className="reviewBox"><strong>📌 مراجعات الصف الحالي</strong>{review.slice(0,4).map(l=><div key={l.id} className="reviewItem"><span>{l.title}</span><strong>{lessonMastery(l.id,l.questions.length)}%</strong></div>)}</div>}
      <div style={{display:'grid',gap:10,marginTop:18}}>{subjects.map(subject=>{const subjectLessons=own.filter(l=>l.subject===subject);const subjectDone=subjectLessons.filter(l=>snapshot.completed.includes(l.id));const subjectAvg=subjectDone.length?Math.round(subjectDone.reduce((sum,l)=>sum+lessonMastery(l.id,l.questions.length),0)/subjectDone.length):0;const subjectPercent=subjectLessons.length?Math.round(subjectDone.length/subjectLessons.length*100):0;const subjectReview=subjectDone.filter(l=>snapshot.reports[l.id]?.status==='review_needed').length;const subjectMinutes=minutesFor(subjectLessons.map(l=>l.id));const subjectGaps=gaps.filter(x=>x.skill.subject===subject).length;const icon=subject==='الرياضيات'?'📘':subject==='العلوم والحياة'?'🔬':subject==='اللغة العربية'?'📕':'🔤';return <div className="subjectStat" key={subject}><div className="subjectStatTop"><strong>{icon} {subject}</strong><span>{subjectDone.length}/{subjectLessons.length}</span></div><div className="progress"><span style={{width:`${subjectPercent}%`}}/></div><div className="muted" style={{fontSize:12,marginTop:6}}>الإنجاز {subjectPercent}% · الإتقان {subjectAvg}% · {subjectMinutes} دقيقة{subjectReview?` · ${subjectReview} مراجعة`:''}{subjectGaps?` · ${subjectGaps} فجوة سابقة`:''}</div></div>})}</div></div>
    })}</div>
  </div></main>;
}
