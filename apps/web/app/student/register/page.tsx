'use client';
import {FormEvent,useEffect,useState} from 'react';
import {Notice,StudentCard,StudentShell} from '../_components/StudentUI';
const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000';

type Grade={id:number;code:string;name_ar:string};

export default function StudentRegister(){
  const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);const [gradeId,setGradeId]=useState<number|null>(null);
  useEffect(()=>{
    fetch(`${API}/curriculum/grades`).then(r=>r.json()).then((rows:Grade[])=>{const g=rows.find(x=>x.code==='G05');if(g)setGradeId(g.id);else setMessage('تعذر العثور على الصف الخامس في سجل المنهاج.');}).catch(()=>setMessage('تعذر تحميل سجل الصفوف.'));
  },[]);
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(!gradeId){setMessage('الصف الخامس غير جاهز بعد. أعد المحاولة بعد لحظات.');return;}setBusy(true);setMessage('');const f=new FormData(e.currentTarget);
    const body={email:String(f.get('email')||''),password:String(f.get('password')||''),display_name:String(f.get('display_name')||''),grade_id:gradeId};
    try{
      const r=await fetch(`${API}/auth/register-student`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();
      if(!r.ok)throw new Error(typeof data.detail==='string'?data.detail:'تعذر إنشاء الحساب');
      localStorage.setItem('pal_student_token',data.access_token);window.location.href='/student';
    }catch(e:any){setMessage(e.message||'تعذر إنشاء الحساب');setBusy(false);}
  }
  return <StudentShell title="إنشاء حساب طالب" subtitle="نسخة تجريبية — الصف الخامس — العلوم والحياة" backHref="/">
    <StudentCard>
      <form onSubmit={submit} style={{display:'grid',gap:12}}>
        <label style={{fontWeight:800}}>الاسم المعروض<input name="display_name" placeholder="مثال: أحمد" required style={{display:'block',width:'100%',boxSizing:'border-box',marginTop:6,padding:'12px 13px',border:'1px solid #ccd5df',borderRadius:11,fontSize:16}}/></label>
        <label style={{fontWeight:800}}>البريد الإلكتروني<input name="email" type="email" autoComplete="email" placeholder="name@example.com" required style={{display:'block',width:'100%',boxSizing:'border-box',marginTop:6,padding:'12px 13px',border:'1px solid #ccd5df',borderRadius:11,fontSize:16}}/></label>
        <label style={{fontWeight:800}}>كلمة المرور<input name="password" type="password" autoComplete="new-password" placeholder="8 أحرف على الأقل" minLength={8} required style={{display:'block',width:'100%',boxSizing:'border-box',marginTop:6,padding:'12px 13px',border:'1px solid #ccd5df',borderRadius:11,fontSize:16}}/></label>
        <div style={{padding:12,borderRadius:11,background:'#f8fafc',border:'1px solid #edf0f4'}}><div style={{fontSize:11,color:'#667085',fontWeight:900}}>المسار التجريبي المثبت</div><strong>الصف الخامس · العلوم والحياة · الفصل الأول</strong><div style={{fontSize:13,color:'#667085',marginTop:4}}>الدرس الأول: المجهر واكتشاف الخلية</div></div>
        <button disabled={busy||!gradeId} style={{minHeight:48,border:0,borderRadius:12,background:busy||!gradeId?'#9fbbaa':'#176b3a',color:'#fff',fontWeight:900,fontSize:16}}>{busy?'جارٍ إنشاء الحساب…':!gradeId?'جارٍ تجهيز الصف الخامس…':'إنشاء الحساب وبدء التعلم'}</button>
      </form>
      {message&&<div style={{marginTop:12}}><Notice tone="bad">{message}</Notice></div>}
      <div style={{marginTop:16,paddingTop:14,borderTop:'1px solid #edf0f4'}}><span style={{color:'#667085'}}>لديك حساب بالفعل؟ </span><a href="/student/login" style={{fontWeight:900,color:'#176b3a'}}>تسجيل الدخول</a></div>
    </StudentCard>
    <div style={{marginTop:12}}><Notice tone="info">لا نطلب في هذه النسخة إلا البيانات الضرورية لإنشاء ملف تعلم تجريبي.</Notice></div>
  </StudentShell>;
}
