'use client';
import {useEffect,useState} from 'react';
import {apiJson} from '../../../lib/api';

export default function Progress(){
  const [skills,setSkills]=useState<any[]>([]);const [error,setError]=useState('');
  useEffect(()=>{apiJson<any[]>('/learning/me/mastery',{},true).then(setSkills).catch(e=>setError(e.message||'تعذر تحميل التقدم'))},[]);
  const label=(s:string)=>({NOT_ASSESSED:'لم يُقيّم بعد',NEEDS_SUPPORT:'يحتاج دعمًا',EMERGING:'في البداية',DEVELOPING:'قيد التطور',MASTERED:'متقن',STABLE:'إتقان مستقر',REFRESH_NEEDED:'يحتاج مراجعة'} as Record<string,string>)[s]||s;
  return <main style={{maxWidth:860,margin:'28px auto',padding:18}}><h1>تقدمي</h1><p>النتيجة معروضة حسب المهارة، وليس كتصنيف عام لمستوى الطالب.</p>{error&&<div style={{padding:12,background:'#ffecec',borderRadius:12}}>{error}</div>}<div style={{display:'grid',gap:12}}>{skills.map(x=>{const pct=Math.round((x.mastery_score||0)*100);return <article key={x.skill_id} style={{background:'white',padding:18,borderRadius:16,border:'1px solid #e8edf5'}}><div style={{display:'flex',justifyContent:'space-between',gap:10}}><strong>{x.name_ar}</strong><span>{pct}%</span></div><div style={{height:8,background:'#edf1f7',borderRadius:99,margin:'12px 0'}}><div style={{height:'100%',width:`${pct}%`,background:'#1f6feb',borderRadius:99}}/></div><small>{label(x.status)} · أدلة: {x.evidence_count} · ثقة {Math.round((x.confidence||0)*100)}%</small></article>})}</div>{!skills.length&&!error&&<p>جارٍ تحميل مهاراتك…</p>}<a href="/student/recovery" style={{display:'inline-block',marginTop:18,padding:'11px 15px',borderRadius:12,background:'#1f6feb',color:'white',textDecoration:'none'}}>تشغيل مسار العلاج</a></main>
}
