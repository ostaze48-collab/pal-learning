'use client';
import {FormEvent,useState} from 'react';
const API=process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export default function AdminLogin(){
 const [message,setMessage]=useState('');
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault(); const f=new FormData(e.currentTarget);
  const body={email:String(f.get('email')||''),password:String(f.get('password')||'')};
  const r=await fetch(`${API}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const data=await r.json();
  if(!r.ok){setMessage(data.detail||'تعذر تسجيل الدخول');return;}
  if(data.role!=='ADMIN'){setMessage('هذا الحساب ليس حساب إدارة');return;}
  localStorage.setItem('pal_admin_token',data.access_token); window.location.href='/admin';
 }
 return <main style={{maxWidth:480,margin:'70px auto',padding:20}}><h1>دخول الإدارة</h1><form onSubmit={submit} style={{display:'grid',gap:12,background:'white',padding:20,borderRadius:16,border:'1px solid #e8edf5'}}><input name="email" type="email" placeholder="البريد الإلكتروني" required style={{padding:12}}/><input name="password" type="password" placeholder="كلمة المرور" required minLength={8} style={{padding:12}}/><button style={{padding:12,border:0,borderRadius:10,background:'#14213d',color:'white'}}>دخول</button></form>{message&&<p>{message}</p>}</main>
}
