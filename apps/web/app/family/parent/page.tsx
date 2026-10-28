'use client';

import {useEffect,useState} from 'react';

const items=[
  {student:'سلمى',key:'family-learning:salma:prime-numbers',lesson:'العدد الأولي',accent:'#7a4db3'},
  {student:'سلمى',key:'family-learning:salma:prime-factorization',lesson:'التحليل إلى العوامل الأولية',accent:'#7a4db3'},
  {student:'سما',key:'family-learning:sama:integers',lesson:'الأعداد الصحيحة',accent:'#176b3a'},
];

type Progress={score:number;completed:boolean;updatedAt:string};

export default function ParentPage(){
  const [progress,setProgress]=useState<Record<string,Progress>>({});
  useEffect(()=>{
    const found:Record<string,Progress>={};
    for(const item of items){
      try{const raw=localStorage.getItem(item.key);if(raw)found[item.key]=JSON.parse(raw);}catch{}
    }
    setProgress(found);
  },[]);

  return <main style={{minHeight:'100vh',background:'#f7f8fb',color:'#14213d'}}><div style={{maxWidth:860,margin:'0 auto',padding:'20px 14px 50px'}}>
    <header style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',marginBottom:20}}><a href="/" style={{textDecoration:'none',color:'#14213d',fontWeight:900}}>← الرئيسية</a><div style={{fontSize:12,color:'#667085'}}>لوحة متابعة عائلية</div></header>
    <section style={{background:'#14213d',color:'#fff',borderRadius:23,padding:20,marginBottom:15}}><div style={{fontSize:12,opacity:.7,fontWeight:900}}>لوحة الأب</div><h1 style={{fontSize:'clamp(29px,7vw,43px)',margin:'6px 0'}}>متابعة سلمى وسما</h1><p style={{margin:0,opacity:.78,lineHeight:1.8}}>هذه النسخة تحفظ النتائج على الجهاز المستخدم. سنربطها لاحقًا بقاعدة البيانات لتظهر النتائج على جميع الأجهزة.</p></section>

    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:12}}>{['سلمى','سما'].map((name)=>{
      const studentItems=items.filter((i)=>i.student===name);const done=studentItems.filter((i)=>progress[i.key]?.completed);const avg=done.length?Math.round(done.reduce((n,i)=>n+(progress[i.key]?.score||0),0)/done.length):0;
      return <section key={name} style={{background:'#fff',border:'1px solid #e5e9ef',borderRadius:20,padding:17}}><div style={{fontSize:12,color:'#667085',fontWeight:900}}>{name==='سلمى'?'الصف الخامس':'الصف السابع'} · الفصل الأول</div><h2 style={{fontSize:27,margin:'6px 0 12px'}}>{name}</h2><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}><div style={{background:'#f7f8fb',borderRadius:13,padding:11}}><strong style={{fontSize:23}}>{done.length}</strong><div style={{fontSize:11,color:'#667085'}}>دروس مكتملة</div></div><div style={{background:'#f7f8fb',borderRadius:13,padding:11}}><strong style={{fontSize:23}}>{avg}%</strong><div style={{fontSize:11,color:'#667085'}}>متوسط الإتقان</div></div></div><div style={{display:'grid',gap:7}}>{studentItems.map((item)=>{const p=progress[item.key];return <div key={item.key} style={{padding:10,borderRadius:12,border:'1px solid #edf0f4',display:'flex',justifyContent:'space-between',gap:8,alignItems:'center'}}><div><strong style={{fontSize:13}}>{item.lesson}</strong><div style={{fontSize:11,color:'#667085',marginTop:2}}>{p?.completed?'مكتمل':'لم يبدأ بعد'}</div></div><strong style={{color:item.accent}}>{p?.completed?`${p.score}%`:'—'}</strong></div>})}</div></section>
    })}</div>
  </div></main>;
}
