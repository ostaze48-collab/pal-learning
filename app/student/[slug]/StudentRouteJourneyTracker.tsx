'use client';
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
import {recordChildJourneyEvent} from '../../../lib/childJourneyTelemetry';

export default function StudentRouteJourneyTracker({student}:{student:string}){
 const pathname=usePathname();
 useEffect(()=>{
  if(pathname===`/student/${student}`){recordChildJourneyEvent(student,'today_view');return}
  const prefix=`/student/${student}/subject/`;
  if(pathname.startsWith(prefix)){const subjectKey=pathname.slice(prefix.length).split('/')[0];if(subjectKey)recordChildJourneyEvent(student,'world_view',{subjectKey})}
 },[pathname,student]);
 return null;
}
