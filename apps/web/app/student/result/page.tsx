'use client';

import {useEffect,useState} from 'react';
import {apiJson} from '../../../lib/api';
import {BottomNav,Metric,Notice,Pill,PrimaryLink,ProgressBar,StudentCard,StudentShell} from '../_components/StudentUI';

type SkillSummary={skill_id:number;skill_code:string;name_ar:string;mastery_score:number;confidence:number;status:string;evidence_count:number};
type Result={
  experimental:boolean;
  lesson:{id:number;lesson_code:string;title:string};
  completion:{completed:boolean;answered_questions:number;total_questions:number;correct_latest_answers:number;score_percent:number};
  mastery:{average_percent:number;assessed_skills:number;total_skills:number;strongest:SkillSummary|null;weakest:SkillSummary|null};
  next_action:{type:string;title:string;message:string;href:string};
  notice:string;
};

export default function ResultPage(){
  const [data,setData]=useState<Result|null>(null);
  const [error,setError]=useState('');

  useEffect(()=>{apiJson<Result>('/demo/result',{},true).then(setData).catch(e=>setError(e.message||'تعذر تحميل النتيجة'))},[]);

  return <StudentShell title="نتيجة الدرس" subtitle="ملخص تجريبي يجمع الأسئلة وMastery حسب المهارة." backHref="/student">
    {error&&<div style={{marginBottom:14}}><Notice tone="bad">{error}</Notice></div>}
    {!data&&!error&&<Notice>جارٍ حساب النتيجة…</Notice>}

    {data&&<>
      <StudentCard style={{marginBottom:14,background:'linear-gradient(135deg,#f2fbf5,#f4f8ff)'}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-start',flexWrap:'wrap'}}>
          <div><Pill tone={data.completion.completed?'good':'warn'}>{data.completion.completed?'اكتمل الدرس':'لم يكتمل بعد'}</Pill><h2 style={{margin:'10px 0 4px',fontSize:26}}>{data.lesson.title}</h2><div style={{color:'#667085'}}>علوم الصف الخامس · الفصل الأول</div></div>
          <div style={{fontSize:44}}>🏁</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,marginTop:16}}>
          <Metric label="نتيجة الأسئلة" value={`${data.completion.score_percent}%`}/>
          <Metric label="متوسط Mastery" value={`${data.mastery.average_percent}%`}/>
          <Metric label="تمت الإجابة" value={`${data.completion.answered_questions}/${data.completion.total_questions}`}/>
          <Metric label="مهارات قُيّمت" value={`${data.mastery.assessed_skills}/${data.mastery.total_skills}`}/>
        </div>
        <div style={{marginTop:14}}><ProgressBar value={data.completion.completed?100:Math.round(data.completion.answered_questions/Math.max(1,data.completion.total_questions)*100)}/></div>
      </StudentCard>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:12,marginBottom:14}}>
        <StudentCard>
          <div style={{fontSize:12,color:'#667085',fontWeight:900}}>أقوى مهارة</div>
          {data.mastery.strongest?<><h3 style={{margin:'7px 0 6px',lineHeight:1.6}}>{data.mastery.strongest.name_ar}</h3><Pill tone="good">{Math.round(data.mastery.strongest.mastery_score*100)}% Mastery</Pill></>:<p style={{color:'#667085'}}>لا توجد أدلة كافية بعد.</p>}
        </StudentCard>
        <StudentCard>
          <div style={{fontSize:12,color:'#667085',fontWeight:900}}>المهارة التي تحتاج تركيزًا أكبر</div>
          {data.mastery.weakest?<><h3 style={{margin:'7px 0 6px',lineHeight:1.6}}>{data.mastery.weakest.name_ar}</h3><Pill tone={data.mastery.weakest.mastery_score>=.7?'good':'warn'}>{Math.round(data.mastery.weakest.mastery_score*100)}% Mastery</Pill></>:<p style={{color:'#667085'}}>أجب عن الأسئلة أولًا حتى نحددها.</p>}
        </StudentCard>
      </div>

      <StudentCard style={{marginBottom:14,borderColor:data.next_action.type==='REVIEW'?'#f0d89b':'#cfe4d6',background:data.next_action.type==='REVIEW'?'#fffaf0':'#f6fcf8'}}>
        <div style={{fontSize:12,color:'#667085',fontWeight:900}}>الخطوة التالية</div>
        <h2 style={{margin:'6px 0',fontSize:21}}>{data.next_action.title}</h2>
        <p style={{margin:'0 0 12px',color:'#526071',lineHeight:1.75}}>{data.next_action.message}</p>
        <PrimaryLink href={data.next_action.href}>{data.next_action.type==='REVIEW'?'ابدأ المراجعة':'متابعة'}</PrimaryLink>
      </StudentCard>

      <Notice tone="info">{data.notice}</Notice>
      <StudentCard style={{marginTop:14}}><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><PrimaryLink href="/student/lesson">إعادة الدرس</PrimaryLink><PrimaryLink href="/student/progress" secondary>تفاصيل المهارات</PrimaryLink><PrimaryLink href="/student" secondary>الرئيسية</PrimaryLink></div></StudentCard>
      <BottomNav active="progress"/>
    </>}
  </StudentShell>;
}
