'use client';

import {useEffect,useState} from 'react';
import {ActionLink,AdminShell,ButtonRow,Card,MetricCard,Notice,SectionHeader,StatusPill} from '../_components/AdminUI';

const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000';

type Dashboard={
  lesson:{lesson_code:string;title:string;status:string;questions:number;skills:number};
  students:{registered:number;attempted_lesson:number;completed_all_questions:number;completion_rate_percent:number};
  learning:{lesson_starts:number;question_attempts:number;correct_answers:number;correct_rate_percent:number;average_mastery_percent:number;mastered_skill_rows:number;needs_support_rows:number};
  ai_tutor:{requests:number;mode:string};
  release_policy:{scope_locked_to_one_lesson:boolean;uses_production_publish_state:boolean};
};

export default function Analytics(){
  const [data,setData]=useState<Dashboard|null>(null);
  const [error,setError]=useState('');
  useEffect(()=>{
    const token=localStorage.getItem('pal_admin_token')||'';
    fetch(`${API}/demo/admin/dashboard`,{headers:{Authorization:`Bearer ${token}`}})
      .then(async r=>{const b=await r.json();if(!r.ok)throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'تعذر تحميل التحليلات');return b;})
      .then(setData)
      .catch(e=>setError(e.message||'تعذر تحميل التحليلات'));
  },[]);

  return <AdminShell eyebrow="Pilot Learning Intelligence" title="تحليلات الدرس التجريبي" description="بيانات حقيقية من استخدام الطلاب لدرس «المجهر واكتشاف الخلية». لا توجد هنا أرقام ثابتة أو بيانات من مواد أخرى.">
    <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'center',flexWrap:'wrap',marginBottom:14}}>
      <ButtonRow><ActionLink href="/admin" tone="secondary">← لوحة الإدارة</ActionLink><ActionLink href="/admin/beta">Beta Operations</ActionLink></ButtonRow>
      <StatusPill tone="info">Single Lesson Analytics</StatusPill>
    </div>

    {error&&<Notice tone="bad">{error} · <a href="/admin/login">تسجيل دخول الإدارة</a></Notice>}
    {!data&&!error&&<Notice>جارٍ تحميل بيانات التعلم…</Notice>}

    {data&&<>
      <Card style={{marginBottom:14,background:'linear-gradient(135deg,#f3fbf5,#f5f8ff)'}}>
        <SectionHeader title={data.lesson.title} description={`${data.lesson.lesson_code} · ${data.lesson.questions} أسئلة · ${data.lesson.skills} مهارات`} aside={<StatusPill tone="good">{data.lesson.status}</StatusPill>}/>
        <Notice tone="info">كل المؤشرات أدناه تخص النسخة التجريبية ذات الدرس الواحد فقط.</Notice>
      </Card>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))',gap:10,marginBottom:14}}>
        <MetricCard label="طلاب مسجلون" value={data.students.registered}/>
        <MetricCard label="بدأوا التقييم" value={data.students.attempted_lesson}/>
        <MetricCard label="أكملوا 5 أسئلة" value={data.students.completed_all_questions} tone={data.students.completed_all_questions?'good':'neutral'}/>
        <MetricCard label="Completion" value={`${data.students.completion_rate_percent}%`} tone={data.students.completion_rate_percent>=70?'good':'warn'}/>
        <MetricCard label="Lesson Starts" value={data.learning.lesson_starts}/>
        <MetricCard label="Question Attempts" value={data.learning.question_attempts}/>
        <MetricCard label="Correct Rate" value={`${data.learning.correct_rate_percent}%`} tone={data.learning.correct_rate_percent>=70?'good':'warn'}/>
        <MetricCard label="Average Mastery" value={`${data.learning.average_mastery_percent}%`} tone={data.learning.average_mastery_percent>=70?'good':'warn'}/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:12}}>
        <Card>
          <SectionHeader title="حالة المهارات" description="تتغير بعد كل إجابة محفوظة."/>
          <div style={{display:'grid',gap:10}}>
            <div style={{display:'flex',justifyContent:'space-between'}}><span>مهارات متقنة</span><strong>{data.learning.mastered_skill_rows}</strong></div>
            <div style={{display:'flex',justifyContent:'space-between'}}><span>مهارات تحتاج دعمًا</span><strong>{data.learning.needs_support_rows}</strong></div>
            <div style={{display:'flex',justifyContent:'space-between'}}><span>إجابات صحيحة</span><strong>{data.learning.correct_answers}</strong></div>
          </div>
        </Card>

        <Card>
          <SectionHeader title="مساعد الدرس" description="قياس الاستخدام داخل نطاق الدرس فقط."/>
          <div style={{display:'grid',gap:10}}>
            <div style={{display:'flex',justifyContent:'space-between'}}><span>طلبات المساعدة</span><strong>{data.ai_tutor.requests}</strong></div>
            <div style={{display:'flex',justifyContent:'space-between',gap:10}}><span>الوضع</span><strong style={{fontSize:12}}>{data.ai_tutor.mode}</strong></div>
          </div>
        </Card>
      </div>

      <Card style={{marginTop:14}}>
        <SectionHeader title="سلامة التجربة"/>
        <div style={{display:'grid',gap:7}}>
          <div>{data.release_policy.scope_locked_to_one_lesson?'✓':'×'} الطالب محصور في درس واحد.</div>
          <div>{!data.release_policy.uses_production_publish_state?'✓':'×'} محتوى Beta منفصل عن النشر الإنتاجي.</div>
        </div>
      </Card>
    </>}
  </AdminShell>;
}
