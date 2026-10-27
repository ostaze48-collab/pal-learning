'use client';

import {FormEvent,useState} from 'react';
import {apiJson} from '../../../lib/api';
import {Notice,PrimaryLink,StudentCard,StudentShell} from '../_components/StudentUI';

const categories=[
  ['WRONG_INFORMATION','معلومة تبدو خاطئة'],
  ['WRONG_ANSWER','إجابة سؤال تبدو خاطئة'],
  ['UNCLEAR_EXPLANATION','الشرح غير واضح'],
  ['TOO_DIFFICULT','المحتوى صعب جدًا'],
  ['LANGUAGE_ERROR','خطأ لغوي أو صياغة'],
  ['TECHNICAL_ISSUE','مشكلة تقنية'],
  ['OTHER','ملاحظة أخرى'],
] as const;

export default function FeedbackPage(){
  const [busy,setBusy]=useState(false);
  const [success,setSuccess]=useState('');
  const [error,setError]=useState('');

  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setError('');setSuccess('');
    const form=new FormData(e.currentTarget);
    try{
      const result=await apiJson<{message:string}>('/demo/feedback',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          category:String(form.get('category')||'OTHER'),
          message:String(form.get('message')||''),
          context:String(form.get('context')||'student-feedback-page'),
        }),
      },true);
      setSuccess(result.message);e.currentTarget.reset();
    }catch(err:any){setError(err.message||'تعذر إرسال الملاحظة');}
    finally{setBusy(false);}
  }

  return <StudentShell title="أبلغنا عن مشكلة" subtitle="ملاحظتك تساعدنا على تحسين النسخة التجريبية قبل التوسع." backHref="/student/lesson">
    <StudentCard>
      <form onSubmit={submit} style={{display:'grid',gap:13}}>
        <label style={{fontWeight:900}}>نوع الملاحظة
          <select name="category" defaultValue="UNCLEAR_EXPLANATION" style={{display:'block',width:'100%',marginTop:7,padding:'12px 13px',border:'1px solid #ccd5df',borderRadius:11,background:'#fff',fontSize:15}}>
            {categories.map(([value,label])=><option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label style={{fontWeight:900}}>اشرح ما لاحظته
          <textarea name="message" required minLength={3} maxLength={1200} rows={6} placeholder="مثال: السؤال الثالث غير واضح لي لأن…" style={{display:'block',width:'100%',boxSizing:'border-box',marginTop:7,padding:'12px 13px',border:'1px solid #ccd5df',borderRadius:11,fontSize:15,lineHeight:1.7,resize:'vertical'}}/>
        </label>
        <input type="hidden" name="context" value="lesson:PS.G05.SCI.S1.U01.L01"/>
        <button disabled={busy} style={{minHeight:48,border:0,borderRadius:12,background:busy?'#9fbbaa':'#176b3a',color:'#fff',fontWeight:900,fontSize:16}}>{busy?'جارٍ الإرسال…':'إرسال الملاحظة'}</button>
      </form>
      {success&&<div style={{marginTop:12}}><Notice tone="good">{success}</Notice></div>}
      {error&&<div style={{marginTop:12}}><Notice tone="bad">{error}</Notice></div>}
    </StudentCard>
    <div style={{marginTop:14}}><Notice tone="info">لا تكتب بيانات شخصية في الملاحظة. اسم حساب الطالب معروف للنظام تلقائيًا ولا تحتاج لإعادته.</Notice></div>
    <StudentCard style={{marginTop:14}}><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><PrimaryLink href="/student/lesson">العودة إلى الدرس</PrimaryLink><PrimaryLink href="/student" secondary>الرئيسية</PrimaryLink></div></StudentCard>
  </StudentShell>;
}
