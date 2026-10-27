'use client';
import {useEffect,useState} from 'react';
import {apiJson} from '../../../lib/api';
import {BottomNav,Metric,Notice,Pill,PrimaryLink,ProgressBar,StudentCard,StudentShell} from '../_components/StudentUI';

type Skill={skill_id:number;skill_code:string;name_ar:string;domain:string;mastery_threshold:number;mastery_score:number;confidence:number;status:string;evidence_count:number};
type Progress={experimental:boolean;lesson_id:number;progress_percent:number;mastered_skills:number;skills:Skill[]};

const labels:Record<string,string>={NOT_ASSESSED:'لم يُقيّم بعد',NEEDS_SUPPORT:'يحتاج دعمًا',EMERGING:'في البداية',DEVELOPING:'قيد التطور',MASTERED:'متقن',STABLE:'إتقان مستقر',REFRESH_NEEDED:'يحتاج مراجعة'};
const tone=(status:string):'neutral'|'good'|'warn'|'bad'=>status==='MASTERED'||status==='STABLE'?'good':status==='NEEDS_SUPPORT'||status==='REFRESH_NEEDED'?'bad':status==='DEVELOPING'||status==='EMERGING'?'warn':'neutral';

export default function ProgressPage(){
  const [data,setData]=useState<Progress|null>(null);const [error,setError]=useState('');
  useEffect(()=>{apiJson<Progress>('/demo/progress',{},true).then(setData).catch(e=>setError(e.message||'تعذر تحميل التقدم'))},[]);
  return <StudentShell title="تقدمي" subtitle="نقيس تقدمك حسب كل مهارة داخل الدرس، وليس بدرجة واحدة فقط." backHref="/student">
    {error&&<div style={{marginBottom:14}}><Notice tone="bad">{error}</Notice></div>}
    {!data&&!error&&<Notice>جارٍ تحميل Mastery…</Notice>}
    {data&&<>
      <StudentCard style={{marginBottom:14,background:'linear-gradient(135deg,#f1fbf4,#f6f9ff)'}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center'}}><div><div style={{fontSize:12,color:'#667085',fontWeight:900}}>إتقان الدرس</div><div style={{fontSize:38,fontWeight:900,marginTop:2}}>{data.progress_percent}%</div></div><div style={{fontSize:42}}>📈</div></div>
        <ProgressBar value={data.progress_percent}/>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,marginTop:12}}><Metric label="مهارات متقنة" value={`${data.mastered_skills}/${data.skills.length}`}/><Metric label="إجمالي المهارات" value={data.skills.length}/></div>
      </StudentCard>

      <div style={{display:'grid',gap:11}}>{data.skills.map(skill=>{
        const pct=Math.round((skill.mastery_score||0)*100);const conf=Math.round((skill.confidence||0)*100);
        return <StudentCard key={skill.skill_id}>
          <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'flex-start'}}><div style={{flex:1}}><strong style={{fontSize:17,lineHeight:1.5}}>{skill.name_ar}</strong><div style={{fontSize:11,color:'#667085',marginTop:4,overflowWrap:'anywhere'}}>{skill.skill_code}</div></div><Pill tone={tone(skill.status)}>{labels[skill.status]||skill.status}</Pill></div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:12,margin:'12px 0 5px'}}><span>Mastery</span><strong>{pct}%</strong></div><ProgressBar value={pct}/>
          <div style={{display:'flex',gap:7,flexWrap:'wrap',marginTop:10}}><Pill tone="info">ثقة {conf}%</Pill><Pill>أدلة {skill.evidence_count}</Pill><Pill>الهدف {Math.round(skill.mastery_threshold*100)}%</Pill></div>
        </StudentCard>})}</div>

      {data.skills.every(x=>x.evidence_count===0)&&<div style={{marginTop:14}}><Notice tone="warn">لم تُسجل إجابات بعد. افتح الدرس وأجب عن الأسئلة لتبدأ درجات Mastery بالتحرك.</Notice></div>}
      <StudentCard style={{marginTop:14}}><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><PrimaryLink href="/student/result">نتيجة الدرس</PrimaryLink><PrimaryLink href="/student/lesson" secondary>العودة إلى الدرس</PrimaryLink><PrimaryLink href="/student/recovery" secondary>مراجعة ذكية</PrimaryLink></div></StudentCard>
      <BottomNav active="progress"/>
    </>}
  </StudentShell>;
}
