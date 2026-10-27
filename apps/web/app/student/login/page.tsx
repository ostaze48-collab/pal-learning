'use client';
import {FormEvent,useState} from 'react';
import {Notice,PrimaryLink,StudentCard,StudentShell} from '../_components/StudentUI';
const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000';

export default function StudentLogin(){
  const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setMessage('');const f=new FormData(e.currentTarget);
    try{
      const r=await fetch(`${API}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:String(f.get('email')||''),password:String(f.get('password')||'')})});
      const data=await r.json();
      if(!r.ok)throw new Error(typeof data.detail==='string'?data.detail:'تعذر تسجيل الدخول');
      if(data.role!=='STUDENT')throw new Error('هذا الحساب ليس حساب طالب');
      localStorage.setItem('pal_student_token',data.access_token);window.location.href='/student';
    }catch(e:any){setMessage(e.message||'تعذر تسجيل الدخول');setBusy(false);}
  }
  return <StudentShell title="دخول الطالب" subtitle="ادخل إلى النسخة التجريبية للصف الخامس — العلوم والحياة" backHref="/">
    <StudentCard>
      <form onSubmit={submit} style={{display:'grid',gap:12}}>
        <label style={{fontWeight:800}}>البريد الإلكتروني<input name="email" type="email" autoComplete="email" placeholder="student@example.com" required style={{display:'block',width:'100%',boxSizing:'border-box',marginTop:6,padding:'12px 13px',border:'1px solid #ccd5df',borderRadius:11,fontSize:16}}/></label>
        <label style={{fontWeight:800}}>كلمة المرور<input name="password" type="password" autoComplete="current-password" placeholder="••••••••" required minLength={8} style={{display:'block',width:'100%',boxSizing:'border-box',marginTop:6,padding:'12px 13px',border:'1px solid #ccd5df',borderRadius:11,fontSize:16}}/></label>
        <button disabled={busy} style={{minHeight:48,border:0,borderRadius:12,background:busy?'#9fbbaa':'#176b3a',color:'#fff',fontWeight:900,fontSize:16}}>{busy?'جارٍ الدخول…':'دخول إلى المنصة'}</button>
      </form>
      {message&&<div style={{marginTop:12}}><Notice tone="bad">{message}</Notice></div>}
      <div style={{marginTop:16,paddingTop:14,borderTop:'1px solid #edf0f4'}}><span style={{color:'#667085'}}>ليس لديك حساب؟ </span><a href="/student/register" style={{fontWeight:900,color:'#176b3a'}}>أنشئ حساب طالب</a></div>
    </StudentCard>
    <div style={{marginTop:12}}><Notice tone="info">في النسخة التجريبية كل حساب طالب يدخل مباشرة إلى <strong>الصف الخامس — العلوم — الدرس الأول</strong>.</Notice></div>
  </StudentShell>;
}
