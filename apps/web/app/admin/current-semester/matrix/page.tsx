'use client';

import {useEffect,useMemo,useState} from 'react';

const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000';

type Row={
  unit:{id:number;unit_number:number;title:string};
  lesson:{id:number;lesson_number:number;lesson_code:string;title:string;status:string};
  stage:string;
  progress:number;
  next_action?:string|null;
  blockers:string[];
  source_links:{candidate:number;verified:number};
  skills_count:number;
  generation_readiness:{queue_ready:boolean;execution_ready:boolean;blockers:string[]};
  latest_skill_job?:{id:number;status:string}|null;
  latest_generation_job?:{id:number;status:string}|null;
  latest_candidate?:{id:number;status:string;version_label:string}|null;
  latest_staged_version?:{id:number;status:string;release_readiness:string;academic_recommendation?:string|null}|null;
  latest_release_transaction?:{id:number;status:string;content_version_id?:number|null}|null;
};
type Matrix={semester:number;book_code:string;package_code:string;database_backend:string;lesson_count:number;released_count:number;completion_percent:number;lessons:Row[]};

const stageLabel:Record<string,string>={
  SOURCE_LINKING:'ربط المصدر',SOURCE_REVIEW:'مراجعة المصدر',SKILL_MAPPING:'استخراج المهارات',
  GENERATION_BLOCKED:'التوليد محجوب',GENERATION_READY:'جاهز للتوليد',GENERATION:'التوليد',
  CANDIDATE_BLOCKED:'Candidate محجوب',CANDIDATE_QA:'Candidate QA',STAGED_AWAITING_ACADEMIC_QA:'Staging / Academic QA',
  ACADEMIC_QA_BLOCKED:'Academic QA محجوب',FINAL_GATE_BLOCKED:'Final Gate محجوبة',RELEASE_READY:'جاهز لمعاملة الإصدار',RELEASED:'منشور',
};
const stageBg:Record<string,string>={RELEASED:'#e9f8ef',RELEASE_READY:'#edf9f1',ACADEMIC_QA_BLOCKED:'#fff0f0',FINAL_GATE_BLOCKED:'#fff4e5',GENERATION_BLOCKED:'#fff1f1',CANDIDATE_BLOCKED:'#fff1f1'};

function actionHref(row:Row){
  const id=row.lesson.id;
  switch(row.next_action){
    case 'REVIEW_SOURCE_LINKS': return `/admin/source-link-review?lesson_id=${id}`;
    case 'OPEN_SKILL_MAPPING': return `/admin/skill-mapping?lesson_id=${id}`;
    case 'REVIEW_GENERATION_READINESS': return `/admin/generation-readiness?lesson_id=${id}`;
    case 'QUEUE_GENERATION':
    case 'OPEN_LESSON_GENERATION': return `/admin/lesson-generation?lesson_id=${id}`;
    case 'OPEN_CANDIDATE_QA':
    case 'REVIEW_CANDIDATE': return '/admin/quality';
    case 'RUN_ACADEMIC_QA':
    case 'REVIEW_ACADEMIC_QA':
    case 'REVIEW_FINAL_GATE':
    case 'OPEN_RELEASE_CONSOLE': return '/admin/release';
    case 'AUTO_LINK_LESSONS': return '/admin/current-semester';
    default: return null;
  }
}

export default function SemesterMatrixPage(){
  const [data,setData]=useState<Matrix|null>(null);
  const [error,setError]=useState('');
  function headers(){return {Authorization:`Bearer ${localStorage.getItem('pal_admin_token')||''}`};}
  async function load(){
    setError('');
    try{
      const r=await fetch(`${API}/admin/current-semester/matrix`,{headers:headers(),cache:'no-store'});
      const b=await r.json();
      if(!r.ok) throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'تعذر تحميل مصفوفة الفصل');
      setData(b);
    }catch(e){setError(e instanceof Error?e.message:'تعذر تحميل مصفوفة الفصل');}
  }
  useEffect(()=>{void load();},[]);
  const units=useMemo(()=>{
    const map=new Map<number,{title:string;rows:Row[]}>();
    for(const row of data?.lessons||[]){
      if(!map.has(row.unit.unit_number)) map.set(row.unit.unit_number,{title:row.unit.title,rows:[]});
      map.get(row.unit.unit_number)!.rows.push(row);
    }
    return Array.from(map.entries());
  },[data]);

  return <main style={{maxWidth:1180,margin:'30px auto',padding:20}}>
    <div style={{fontSize:14,opacity:.65}}>الإدارة ← الفصل الحالي ← مصفوفة الإنتاج</div>
    <h1>مصفوفة إنتاج الفصل الأول</h1>
    <p>علوم الصف الخامس · كل درس يتحرك عبر المصدر → المهارات → التوليد → QA → Staging → Release Transaction.</p>
    {error&&<div style={{padding:12,borderRadius:10,background:'#ffecec',marginBottom:12}}>{error}</div>}
    {!data&&!error&&<p>جارٍ تحميل حالة الدروس…</p>}
    {data&&<>
      <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:12,marginBottom:18}}>
        <div style={{background:'white',border:'1px solid #e6ebf2',borderRadius:14,padding:16}}><div style={{fontSize:12,opacity:.6}}>الدروس</div><strong style={{fontSize:28}}>{data.lesson_count}</strong></div>
        <div style={{background:'white',border:'1px solid #e6ebf2',borderRadius:14,padding:16}}><div style={{fontSize:12,opacity:.6}}>تم الإصدار</div><strong style={{fontSize:28}}>{data.released_count}/{data.lesson_count}</strong></div>
        <div style={{background:'white',border:'1px solid #e6ebf2',borderRadius:14,padding:16}}><div style={{fontSize:12,opacity:.6}}>اكتمال الفصل</div><strong style={{fontSize:28}}>{data.completion_percent}%</strong></div>
        <div style={{background:'white',border:'1px solid #e6ebf2',borderRadius:14,padding:16}}><div style={{fontSize:12,opacity:.6}}>قاعدة البيانات</div><strong>{data.database_backend}</strong><div style={{fontSize:12,marginTop:5,opacity:.7}}>{['postgres','postgresql'].includes(data.database_backend)?'إصدار الإنتاج ممكن بعد نجاح البوابات':'Release Transaction تبقى محجوبة على SQLite'}</div></div>
      </section>

      {units.map(([number,unit])=><section key={number} style={{marginBottom:18,background:'white',border:'1px solid #e6ebf2',borderRadius:14,padding:16}}>
        <h2 style={{marginTop:0}}>الوحدة {number}: {unit.title}</h2>
        <div style={{display:'grid',gap:10}}>{unit.rows.map(row=>{
          const href=actionHref(row);
          const bg=stageBg[row.stage]||'#f8fafc';
          return <div key={row.lesson.id} style={{border:'1px solid #edf0f5',borderRadius:12,padding:14,background:bg}}>
            <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
              <div><strong>{row.lesson.lesson_number}. {row.lesson.title}</strong><div style={{fontSize:12,opacity:.65}}>{row.lesson.lesson_code}</div></div>
              <div style={{fontWeight:800}}>{stageLabel[row.stage]||row.stage} · {row.progress}%</div>
            </div>
            <div style={{height:7,background:'#e8edf2',borderRadius:99,overflow:'hidden',margin:'10px 0'}}><div style={{width:`${Math.max(0,Math.min(100,row.progress))}%`,height:'100%',background:'#176b3a'}}/></div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:8,fontSize:13}}>
              <div>المصدر: {row.source_links.verified} موثّق / {row.source_links.candidate} مرشح</div>
              <div>المهارات: {row.skills_count}</div>
              <div>Generation: {row.latest_generation_job?.status||'—'}</div>
              <div>Candidate: {row.latest_candidate?.status||'—'}</div>
              <div>Staging: {row.latest_staged_version?.status||'—'}</div>
              <div>Release: {row.latest_release_transaction?.status||'—'}</div>
            </div>
            {row.blockers.length>0&&<div style={{marginTop:9,fontSize:12,color:'#8b1e1e'}}>الحواجز: {row.blockers.join(' · ')}</div>}
            <div style={{display:'flex',gap:10,alignItems:'center',marginTop:10,flexWrap:'wrap'}}>
              <span style={{fontSize:12,opacity:.65}}>التالي: {row.next_action||'لا شيء — مكتمل'}</span>
              {href&&<a href={href} style={{padding:'7px 11px',borderRadius:8,background:'#176b3a',color:'white',textDecoration:'none',fontSize:13,fontWeight:800}}>فتح الخطوة التالية</a>}
            </div>
          </div>;
        })}</div>
      </section>)}
      <div style={{display:'flex',gap:12,flexWrap:'wrap'}}><a href="/admin/current-semester">الفصل الحالي</a><a href="/admin">لوحة الإدارة</a></div>
    </>}
  </main>;
}
