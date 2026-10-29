'use client';
import {useEffect,useMemo,useState} from 'react';
import {readChildJourneyEvents,type ChildJourneyEvent} from '../../../lib/childJourneyTelemetry';
import styles from './UXDashboard.module.css';

type Session={id:string;student:string;events:ChildJourneyEvent[]};

function buildSessions(){
 const all=[...readChildJourneyEvents('salma'),...readChildJourneyEvents('sama')];const map=new Map<string,Session>();
 for(const event of all){const key=`${event.student}:${event.sessionId}`;const row=map.get(key)||{id:event.sessionId,student:event.student,events:[]};row.events.push(event);map.set(key,row)}
 return [...map.values()];
}

export default function JourneyEntryPanel(){
 const [sessions,setSessions]=useState<Session[]>([]);
 useEffect(()=>{function scan(){setSessions(buildSessions())}scan();const timer=window.setInterval(scan,2000);return()=>window.clearInterval(timer)},[]);
 const stats=useMemo(()=>{
  const has=(s:Session,event:string)=>s.events.some(x=>x.event===event);
  const total=sessions.length;const today=sessions.filter(s=>has(s,'today_view')).length;const world=sessions.filter(s=>has(s,'world_view')).length;const lesson=sessions.filter(s=>has(s,'lesson_view')).length;const complete=sessions.filter(s=>has(s,'lesson_complete')).length;
  const viaWorld=sessions.filter(s=>has(s,'world_view')&&has(s,'lesson_view')).length;const direct=sessions.filter(s=>has(s,'today_view')&&has(s,'lesson_view')&&!has(s,'world_view')).length;
  const byStudent=(student:string)=>{const list=sessions.filter(s=>s.student===student);return {sessions:list.length,lesson:list.filter(s=>has(s,'lesson_view')).length,complete:list.filter(s=>has(s,'lesson_complete')).length}};
  return {total,today,world,lesson,complete,viaWorld,direct,salma:byStudent('salma'),sama:byStudent('sama')};
 },[sessions]);
 const pct=(value:number,base:number)=>base?Math.round(value/base*100):0;
 return <div style={{background:'#f5f8f7',padding:'0 14px 26px'}}><div style={{maxWidth:1120,margin:'0 auto'}}><section className={styles.panel}>
  <div className={styles.toolbar}><div><strong>الدخول إلى التعلم</strong><div className={styles.note}>جلسة الاستخدام = حتى 30 دقيقة من النشاط المتواصل على هذا الجهاز.</div></div><span className={styles.note}>{stats.total<3?'نحتاج جلسات أكثر قبل الحكم على المسار':`دخل الدرس ${pct(stats.lesson,stats.total)}% من الجلسات المسجلة`}</span></div>
  <div className={styles.summary}><div className={styles.metric}><strong>{stats.total}</strong><span>جلسات مسجلة</span></div><div className={styles.metric}><strong>{stats.today}</strong><span>وصلت إلى اليوم</span></div><div className={styles.metric}><strong>{stats.world}</strong><span>فتحت عالم مادة</span></div><div className={styles.metric}><strong>{stats.lesson}</strong><span>دخلت درسًا</span></div><div className={styles.metric}><strong>{stats.complete}</strong><span>أكملت درسًا</span></div></div>
  <div className={styles.hint}>المسار المباشر من “مهمتك الآن” إلى الدرس: <strong>{stats.direct}</strong> جلسة · المرور عبر عالم مادة ثم الدرس: <strong>{stats.viaWorld}</strong> جلسة. سلمى: {stats.salma.lesson}/{stats.salma.sessions} دخلت درسًا، سما: {stats.sama.lesson}/{stats.sama.sessions}. لا نعتبر الفروق الصغيرة مشكلة قبل تراكم عدة جلسات.</div>
 </section></div></div>;
}
