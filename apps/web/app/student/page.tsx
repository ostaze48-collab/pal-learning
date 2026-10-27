'use client';
import {useEffect,useState} from 'react';
import {apiJson} from '../../lib/api';
import {BottomNav,Metric,Notice,Pill,PrimaryLink,ProgressBar,StudentCard,StudentShell} from './_components/StudentUI';

type Home={experimental:boolean;student:{display_name:string};course:{grade:number;subject:string;semester:number};book:{title:string;book_code:string};unit:{title:string;unit_number:number};lesson:{id:number;title:string;lesson_code:string;estimated_minutes:number};progress_percent:number;attempts:number;skills_count:number;plan:Array<{type:string;title:string;minutes:number;href:string}>};

export default function Student(){
  const [home,setHome]=useState<Home|null>(null);
  const [error,setError]=useState('');
  useEffect(()=>{
    if(!localStorage.getItem('pal_student_token')){setError('سجّل الدخول أو أنشئ حسابًا لتبدأ النسخة التجريبية.');return;}
    apiJson<Home>('/demo/home',{},true).then(setHome).catch(e=>setError(e.message||'تعذر تحميل النسخة التجريبية'));
  },[]);

  return <StudentShell title={home?`مرحبًا ${home.student.display_name} 👋`:'مرحبًا 👋'} subtitle="نسخة تجريبية كاملة للصف الخامس — العلوم والحياة — الدرس الأول فقط">
    {error&&<div style={{marginBottom:14}}><Notice tone="warn">{error}<div style={{marginTop:10,display:'flex',gap:8,flexWrap:'wrap'}}><PrimaryLink href="/student/login">دخول الطالب</PrimaryLink><PrimaryLink href="/student/register" secondary>إنشاء حساب</PrimaryLink></div></Notice></div>}
    {!home&&!error&&<Notice>جارٍ إعداد مسارك التعليمي…</Notice>}

    {home&&<>
      <StudentCard style={{marginBottom:14,background:'linear-gradient(135deg,#f1fbf4,#f6f9ff)'}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap',alignItems:'flex-start'}}>
          <div><Pill tone="good">الصف الخامس · {home.course.subject}</Pill><h2 style={{fontSize:'clamp(23px,6vw,34px)',margin:'10px 0 5px'}}>{home.lesson.title}</h2><div style={{color:'#667085'}}>الوحدة {home.unit.unit_number}: {home.unit.title} · {home.lesson.estimated_minutes} دقيقة</div></div>
          <div style={{fontSize:34}}>🔬</div>
        </div>
        <div style={{marginTop:16}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:6,fontSize:13}}><strong>تقدمك في الدرس</strong><strong>{home.progress_percent}%</strong></div><ProgressBar value={home.progress_percent}/></div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:16}}><PrimaryLink href="/student/lesson">{home.attempts?'متابعة الدرس':'ابدأ الدرس'}</PrimaryLink><PrimaryLink href="/student/progress" secondary>عرض التقدم</PrimaryLink></div>
      </StudentCard>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
        <Metric label="المهارات" value={home.skills_count}/><Metric label="المحاولات" value={home.attempts}/><Metric label="الإنجاز" value={`${home.progress_percent}%`}/>
      </div>

      <StudentCard style={{marginBottom:14}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'center',marginBottom:12}}><div><div style={{fontSize:12,color:'#667085',fontWeight:800}}>خطة اليوم</div><h2 style={{margin:'3px 0 0',fontSize:21}}>20 دقيقة تعلم مركّز</h2></div><Pill tone="info">Self-paced</Pill></div>
        <div style={{display:'grid',gap:8}}>{home.plan.map((item,index)=><a key={index} href={item.href} style={{display:'grid',gridTemplateColumns:'38px 1fr auto',gap:10,alignItems:'center',padding:11,borderRadius:13,background:'#f8fafc',border:'1px solid #eef1f5',textDecoration:'none',color:'#14213d'}}><div style={{width:34,height:34,borderRadius:99,display:'grid',placeItems:'center',background:index===0?'#176b3a':'#eef4ff',color:index===0?'#fff':'#2459a6',fontWeight:900}}>{index+1}</div><div><strong>{item.title}</strong><div style={{fontSize:12,color:'#667085',marginTop:2}}>{item.type}</div></div><strong>{item.minutes} د</strong></a>)}</div>
      </StudentCard>

      <StudentCard>
        <div style={{fontSize:12,color:'#667085',fontWeight:800}}>ما المتاح في هذه النسخة؟</div>
        <div style={{display:'grid',gap:8,marginTop:10}}>
          <div>✓ درس تفاعلي كامل عن المجهر واكتشاف الخلية</div>
          <div>✓ أسئلة تحفظ تقدمك وتحدّث Mastery حسب المهارة</div>
          <div>✓ مساعد درس تجريبي مقيد بمحتوى الدرس</div>
          <div>✓ مراجعة قصيرة مبنية على أضعف مهارة لديك</div>
        </div>
      </StudentCard>
      <BottomNav active="home"/>
    </>}
  </StudentShell>;
}
