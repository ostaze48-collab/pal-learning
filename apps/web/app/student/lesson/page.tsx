'use client';
import {useState} from 'react';
const API=process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const sections=[
 ['1','لماذا نحتاج إلى الهيكل؟','يساعد الجهاز الهيكلي الجسم على الدعامة والحماية والحركة.'],
 ['2','وظائف الجهاز الهيكلي','الدعامة، حماية الأعضاء، والمساعدة على الحركة.'],
 ['3','أشكال العظام','العظام طويلة أو مسطحة أو قصيرة وفق الشكل والوظيفة.'],
 ['4','الهيكل المحوري والطرفي','المحوري في مركز الجسم، والطرفي يشمل الأطراف ومناطق اتصالها.'],
 ['5','المفاصل','المفصل منطقة اتصال عظمتين أو أكثر وتختلف المفاصل في حركتها.'],
 ['6','صحة العظام','الغذاء المتوازن والنشاط البدني والعناية بالجسم تدعم صحة العظام.'],
];
export default function LessonPage(){
 const [selected,setSelected]=useState<number|null>(null); const [feedback,setFeedback]=useState('');
 async function submit(){
   if(selected===null)return; setFeedback('جارٍ حفظ المحاولة…');
   try{const r=await fetch(`${API}/learning/questions/1/attempt`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${localStorage.getItem('pal_student_token')||''}`},body:JSON.stringify({answer:selected,response_time_ms:9000})});const b=await r.json();if(!r.ok)throw new Error(b.detail||'تعذر الحفظ');setFeedback((b.correct?'إجابة صحيحة. ':'تحتاج مراجعة. ')+(b.explanation||''));}catch(e){setFeedback('التجربة المحلية تعمل عند تشغيل API وبيانات seed.');}
 }
 return <main style={{maxWidth:860,margin:'28px auto',padding:18}}><div style={{fontSize:14,opacity:.7}}>الصف الخامس ← العلوم والحياة ← الوحدة الرابعة</div><h1>الدرس الأول: الجهاز الهيكلي</h1><p style={{opacity:.75}}>45 دقيقة · V0.3</p><div style={{display:'grid',gap:14}}>{sections.map(([n,t,b])=><article key={n} style={{background:'white',padding:20,borderRadius:18,border:'1px solid #e8edf5'}}><div style={{display:'flex',gap:12,alignItems:'center'}}><span style={{display:'grid',placeItems:'center',width:34,height:34,borderRadius:99,background:'#1f6feb',color:'white',fontWeight:700}}>{n}</span><h2 style={{margin:0,fontSize:20}}>{t}</h2></div><p style={{lineHeight:1.9}}>{b}</p></article>)}</div><section style={{marginTop:18,background:'white',padding:20,borderRadius:18,border:'1px solid #e8edf5'}}><h2>تحقق سريع</h2><p>ما الجزء الذي يعطي جسم الإنسان دعامة أساسية؟</p>{['الجلد','العظام','الشعر','الدم'].map((x,i)=><button key={x} onClick={()=>setSelected(i)} style={{margin:5,padding:'10px 14px',borderRadius:10,border:selected===i?'2px solid #1f6feb':'1px solid #ccd5e3',background:'white'}}>{x}</button>)}<div><button onClick={submit} style={{marginTop:10,padding:'10px 14px',border:0,borderRadius:10,background:'#14213d',color:'white'}}>تحقق واحفظ التقدم</button></div>{feedback&&<p>{feedback}</p>}</section></main>
}
