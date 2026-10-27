'use client';
import {FormEvent,useState} from 'react';
const API=process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export default function StudentRegister(){
 const [message,setMessage]=useState('');
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault(); const f=new FormData(e.currentTarget);
  const body={email:String(f.get('email')||''),password:String(f.get('password')||''),display_name:String(f.get('display_name')||''),grade_id:Number(f.get('grade_id')||5)};
  const r=await fetch(`${API}/auth/register-student`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); const data=await r.json();
  if(!r.ok){setMessage(data.detail||'تعذر إنشاء الحساب');return;}
  localStorage.setItem('pal_student_token',data.access_token); window.location.href='/student';
 }
 return <main style={{maxWidth:520,margin:'50px auto',padding:20}}><h1>إنشاء حساب طالب</h1><form onSubmit={submit} style={{display:'grid',gap:12,background:'white',padding:20,borderRadius:16,border:'1px solid #e8edf5'}}><input name="display_name" placeholder="الاسم المعروض" required style={{padding:12}}/><input name="email" type="email" placeholder="البريد الإلكتروني" required style={{padding:12}}/><input name="password" type="password" placeholder="كلمة المرور" minLength={8} required style={{padding:12}}/><select name="grade_id" defaultValue="5" style={{padding:12}}>{Array.from({length:9},(_,i)=><option key={i+1} value={i+1}>الصف {i+1}</option>)}</select><button style={{padding:12,border:0,borderRadius:10,background:'#1f6feb',color:'white'}}>إنشاء الحساب</button></form>{message&&<p>{message}</p>}</main>
}
