'use client';
import {useEffect,useState} from 'react';
import {apiJson} from '../../../lib/api';
import {BottomNav,Notice,Pill,PrimaryLink,StudentCard,StudentShell} from '../_components/StudentUI';

type Recovery={status:string;title:string;estimated_minutes?:number;message:string;skill?:{skill_code:string;name_ar:string;mastery_score:number;status:string};blocks:Array<{type:string;body:string}>};

export default function RecoveryPage(){
  const [data,setData]=useState<Recovery|null>(null);const [error,setError]=useState('');
  useEffect(()=>{apiJson<Recovery>('/demo/recovery',{},true).then(setData).catch(e=>setError(e.message||'تعذر إعداد المراجعة'))},[]);
  return <StudentShell title="مراجعة ذكية" subtitle="مراجعة قصيرة مبنية على أضعف مهارة ظهرت في إجاباتك داخل الدرس الأول." backHref="/student">
    {error&&<Notice tone="bad">{error}</Notice>}
    {!data&&!error&&<Notice>جارٍ تحليل إجاباتك…</Notice>}
    {data&&<>
      <StudentCard style={{background:data.status==='REVIEW_RECOMMENDED'?'#fffaf0':'#f4f9ff',borderColor:data.status==='REVIEW_RECOMMENDED'?'#f0d89b':'#d8e8fb',marginBottom:14}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'flex-start',flexWrap:'wrap'}}><div><Pill tone={data.status==='REVIEW_RECOMMENDED'?'warn':'info'}>{data.status}</Pill><h2 style={{fontSize:24,margin:'10px 0 6px'}}>{data.title}</h2><p style={{margin:0,lineHeight:1.7,color:'#526071'}}>{data.message}</p></div>{data.estimated_minutes&&<div style={{fontSize:28,fontWeight:900}}>{data.estimated_minutes} د</div>}</div>
      </StudentCard>

      {data.skill&&<StudentCard style={{marginBottom:14}}><div style={{fontSize:12,color:'#667085',fontWeight:900}}>المهارة المستهدفة</div><h3 style={{margin:'6px 0'}}>{data.skill.name_ar}</h3><div style={{display:'flex',gap:7,flexWrap:'wrap'}}><Pill tone="warn">Mastery {Math.round((data.skill.mastery_score||0)*100)}%</Pill><Pill>{data.skill.status}</Pill></div></StudentCard>}

      {!!data.blocks.length&&<div style={{display:'grid',gap:11}}>{data.blocks.map((block,i)=><StudentCard key={i}><Pill tone={block.type==='EXPLAIN'?'info':'good'}>{block.type==='EXPLAIN'?'شرح سريع':'تحقق بنفسك'}</Pill><p style={{lineHeight:1.85,fontSize:16,margin:'10px 0 0'}}>{block.body}</p></StudentCard>)}</div>}

      <StudentCard style={{marginTop:14}}><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><PrimaryLink href="/student/lesson">ارجع إلى الدرس وحاول مجددًا</PrimaryLink><PrimaryLink href="/student/progress" secondary>عرض تقدمي</PrimaryLink></div></StudentCard>
      <BottomNav active="review"/>
    </>}
  </StudentShell>;
}
