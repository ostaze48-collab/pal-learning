'use client';

import {useEffect,useState} from 'react';
import {ActionLink,AdminShell,ButtonRow,Card,MetricCard,Notice,SectionHeader,StatusPill} from '../_components/AdminUI';

const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000';

type FeedbackItem={id:number;student_id:number;student_name:string;category:string;message:string|null;context:string|null;created_at:string|null};
type Dashboard={
  experimental:boolean;
  scope:string;
  lesson:{id:number;lesson_code:string;title:string;status:string;questions:number;skills:number};
  students:{registered:number;attempted_lesson:number;completed_all_questions:number;completion_rate_percent:number};
  learning:{lesson_starts:number;question_attempts:number;correct_answers:number;correct_rate_percent:number;average_mastery_percent:number;mastered_skill_rows:number;needs_support_rows:number};
  ai_tutor:{requests:number;mode:string};
  feedback:{total:number;by_category:Record<string,number>;recent:FeedbackItem[]};
  release_policy:{student_content_status:string;uses_production_publish_state:boolean;scope_locked_to_one_lesson:boolean};
};

type DemoHealth={ready:boolean;scope:string;lesson_code:string;checks:Record<string,boolean>;counts:{sections:number;blocks:number;questions:number;skills:number};status:string|null};

const checkLabels:Record<string,string>={
  experimental_demo_enabled:'وضع Beta مفعّل',single_target_lesson_exists:'الدرس التجريبي موجود',target_lesson_is_beta:'حالة الدرس BETA',seven_learning_sections:'7 محطات تعلم',interactive_blocks_present:'البلوكات التفاعلية موجودة',five_demo_questions:'5 أسئلة تجريبية',four_demo_skills:'4 مهارات مرتبطة بالدرس',
};
const categoryLabels:Record<string,string>={WRONG_INFORMATION:'معلومة خاطئة',WRONG_ANSWER:'إجابة خاطئة',UNCLEAR_EXPLANATION:'شرح غير واضح',TOO_DIFFICULT:'صعب جدًا',LANGUAGE_ERROR:'خطأ لغوي',TECHNICAL_ISSUE:'مشكلة تقنية',OTHER:'أخرى'};

export default function BetaDashboard(){
  const [data,setData]=useState<Dashboard|null>(null);const [health,setHealth]=useState<DemoHealth|null>(null);const [error,setError]=useState('');
  useEffect(()=>{
    const token=localStorage.getItem('pal_admin_token')||'';const headers={Authorization:`Bearer ${token}`};
    Promise.all([
      fetch(`${API}/demo/admin/dashboard`,{headers}).then(async r=>{const b=await r.json();if(!r.ok)throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'تعذر تحميل مؤشرات Beta');return b;}),
      fetch(`${API}/demo/health`).then(async r=>{const b=await r.json();if(!r.ok)throw new Error('تعذر تحميل Demo Health');return b;}),
    ]).then(([d,h])=>{setData(d);setHealth(h)}).catch(e=>setError(e.message||'تعذر تحميل لوحة Beta'));
  },[]);

  return <AdminShell eyebrow="Experimental Beta" title="لوحة تشغيل النسخة التجريبية" description="هذه اللوحة تقيس تجربة طالب الصف الخامس في درس «المجهر واكتشاف الخلية» فقط. لا تختلط بياناتها بمسار النشر الإنتاجي.">
    <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'center',flexWrap:'wrap',marginBottom:14}}><ButtonRow><ActionLink href="/admin" tone="secondary">← لوحة الإدارة</ActionLink><ActionLink href="/student">فتح تجربة الطالب</ActionLink></ButtonRow><StatusPill tone={health?.ready?'good':'warn'}>{health?.ready?'BETA READY':'BETA CHECKING'}</StatusPill></div>
    {error&&<div style={{marginBottom:14}}><Notice tone="bad">{error} · <a href="/admin/login">تسجيل دخول الإدارة</a></Notice></div>}
    {!data&&!error&&<Notice>جارٍ تحميل مؤشرات النسخة التجريبية…</Notice>}

    {data&&<>
      <Card style={{marginBottom:14,background:'linear-gradient(135deg,#f2fbf5,#f4f8ff)',borderColor:'#cde3d4'}}><SectionHeader title={data.lesson.title} description="الصف الخامس · العلوم والحياة · الفصل الأول · الدرس الأول" aside={<StatusPill tone="good">{data.lesson.status}</StatusPill>}/><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><StatusPill tone="info">{data.lesson.questions} أسئلة</StatusPill><StatusPill tone="info">{data.lesson.skills} مهارات</StatusPill><StatusPill tone="neutral">Single Lesson Scope</StatusPill></div><div style={{marginTop:12}}><Notice tone="info">هذه النسخة تستخدم حالة <strong>BETA</strong> مستقلة ولا تغيّر حالة النشر الإنتاجية.</Notice></div></Card>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10,marginBottom:14}}>
        <MetricCard label="طلاب مسجلون" value={data.students.registered}/><MetricCard label="بدأوا الإجابة" value={data.students.attempted_lesson}/><MetricCard label="أكملوا الأسئلة" value={data.students.completed_all_questions} tone={data.students.completed_all_questions?'good':'neutral'}/><MetricCard label="Completion" value={`${data.students.completion_rate_percent}%`}/><MetricCard label="محاولات الأسئلة" value={data.learning.question_attempts}/><MetricCard label="الإجابات الصحيحة" value={`${data.learning.correct_rate_percent}%`} tone={data.learning.correct_rate_percent>=70?'good':'warn'}/><MetricCard label="متوسط Mastery" value={`${data.learning.average_mastery_percent}%`} tone={data.learning.average_mastery_percent>=70?'good':'warn'}/><MetricCard label="طلبات المساعد" value={data.ai_tutor.requests}/><MetricCard label="بلاغات Beta" value={data.feedback.total} tone={data.feedback.total?'warn':'neutral'}/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:12,marginBottom:14}}>
        <Card><SectionHeader title="التعلم" description="مؤشرات من الدرس التجريبي فقط."/><div style={{display:'grid',gap:9}}><div style={{display:'flex',justifyContent:'space-between'}}><span>بدء الدرس</span><strong>{data.learning.lesson_starts}</strong></div><div style={{display:'flex',justifyContent:'space-between'}}><span>Skill rows متقنة</span><strong>{data.learning.mastered_skill_rows}</strong></div><div style={{display:'flex',justifyContent:'space-between'}}><span>Skill rows تحتاج دعمًا</span><strong>{data.learning.needs_support_rows}</strong></div><div style={{display:'flex',justifyContent:'space-between'}}><span>وضع المساعد</span><strong>{data.ai_tutor.mode}</strong></div></div></Card>
        <Card><SectionHeader title="سلامة نطاق الـBeta" description="نحن نختبر منصة كاملة بمحتوى واحد فقط."/><div style={{display:'grid',gap:8}}><div>✓ Scope مقفول على درس واحد</div><div>✓ لا يستخدم PUBLISHED للإتاحة التجريبية</div><div>✓ تقدم الطالب محفوظ حسب Skill</div><div>✓ Tutor مقيد بموضوع الدرس</div><div>✓ Recovery يعتمد على أضعف مهارة مقاسة</div><div>✓ Session State تستعيد المحاولات بعد Refresh</div></div></Card>
      </div>

      <Card style={{marginBottom:14}}>
        <SectionHeader title="ملاحظات الطلاب" description="أحدث البلاغات من النسخة التجريبية." aside={<StatusPill tone={data.feedback.total?'warn':'good'}>{data.feedback.total} بلاغ</StatusPill>}/>
        {data.feedback.total===0?<Notice tone="good">لا توجد بلاغات حتى الآن.</Notice>:<>
          <div style={{display:'flex',gap:7,flexWrap:'wrap',marginBottom:12}}>{Object.entries(data.feedback.by_category).map(([key,count])=><StatusPill key={key} tone="neutral">{categoryLabels[key]||key}: {count}</StatusPill>)}</div>
          <div style={{display:'grid',gap:9}}>{data.feedback.recent.map(item=><div key={item.id} style={{padding:12,border:'1px solid #e7ebf1',borderRadius:12,background:'#fafbfc'}}><div style={{display:'flex',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}><strong>{item.student_name}</strong><StatusPill tone="warn">{categoryLabels[item.category]||item.category}</StatusPill></div><div style={{marginTop:7,lineHeight:1.7}}>{item.message}</div>{item.context&&<div style={{fontSize:11,color:'#667085',marginTop:5}}>{item.context}</div>}</div>)}</div>
        </>}
      </Card>
    </>}

    {health&&<Card><SectionHeader title="Demo Health" description="فحص تلقائي لعناصر الدرس الأساسية." aside={<StatusPill tone={health.ready?'good':'bad'}>{health.ready?'READY':'NOT READY'}</StatusPill>}/><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:8}}>{Object.entries(health.checks).map(([key,ok])=><div key={key} style={{padding:'10px 11px',borderRadius:11,border:'1px solid #e7ebf1',background:ok?'#f4fbf6':'#fff5f5',display:'flex',gap:8}}><strong style={{color:ok?'#067647':'#b42318'}}>{ok?'✓':'×'}</strong><span>{checkLabels[key]||key}</span></div>)}</div><div style={{marginTop:12,color:'#667085',fontSize:13}}>Sections: {health.counts.sections} · Blocks: {health.counts.blocks} · Questions: {health.counts.questions} · Skills: {health.counts.skills}</div></Card>}
  </AdminShell>;
}
