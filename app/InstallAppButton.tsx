'use client';
import {useEffect,useState} from 'react';

type InstallEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>};

export default function InstallAppButton(){
  const [event,setEvent]=useState<InstallEvent|null>(null);
  useEffect(()=>{
    const handler=(e:Event)=>{e.preventDefault();setEvent(e as InstallEvent)};
    window.addEventListener('beforeinstallprompt',handler);
    return()=>window.removeEventListener('beforeinstallprompt',handler);
  },[]);
  if(!event)return null;
  return <button className="btn secondary" onClick={async()=>{await event.prompt();const choice=await event.userChoice;if(choice.outcome==='accepted')setEvent(null)}}>📲 تثبيت التطبيق</button>;
}
