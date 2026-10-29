'use client';
import {useState} from 'react';
import type {Lesson} from '../../../../../lib/data';
import SubjectUnitJourney from '../../SubjectUnitJourney';

type UnitEntry={name:string;lessons:Lesson[]};

export default function WorldJourneyMap({units}:{units:UnitEntry[]}){
 const [open,setOpen]=useState(false);
 return <section className={`worldPath worldMapGate ${open?'open':''}`}>
   <button className="worldMapToggle" type="button" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>
     <span>{open?'✕':'🗺️'}</span>
     <strong>{open?'أخفي الخريطة':'شوفي خريطة العالم'}</strong>
     <b>{open?'↑':'↓'}</b>
   </button>
   <div className="worldMapContent">
     <div className="worldPathHead"><h2>هيا نكمل</h2><span>المحطة الحالية هي الأوضح</span></div>
     <SubjectUnitJourney units={units}/>
   </div>
 </section>;
}
