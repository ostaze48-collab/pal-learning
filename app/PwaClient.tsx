'use client';
import {useEffect,useState} from 'react';

export default function PwaClient(){
  const [online,setOnline]=useState(true);
  useEffect(()=>{
    setOnline(navigator.onLine);
    const on=()=>setOnline(true);const off=()=>setOnline(false);
    window.addEventListener('online',on);window.addEventListener('offline',off);
    if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
    return()=>{window.removeEventListener('online',on);window.removeEventListener('offline',off)};
  },[]);
  if(online)return null;
  return <div className="offlineBanner">📴 أنتِ الآن دون إنترنت — سنستخدم الدروس المحفوظة على هذا الجهاز.</div>;
}
