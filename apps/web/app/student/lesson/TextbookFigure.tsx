'use client';

import {useState} from 'react';
import {Notice,Pill} from '../_components/StudentUI';

type Hotspot={
  id:string;
  x:number;
  y:number;
  label:string;
  description?:string;
};

type FigureContent={
  title?:string;
  prompt?:string;
  src?:string;
  low_data_src?:string;
  alt_text?:string;
  caption?:string;
  source_label?:string;
  source_page?:number;
  asset_kind?:'TEXTBOOK_FIGURE'|'TEXTBOOK_PAGE_CROP'|'REDRAWN_DIAGRAM'|'PLATFORM_ILLUSTRATION';
  rights_status?:'CLEARED'|'REVIEW_REQUIRED'|'REDRAW_REQUIRED';
  hotspots?:Hotspot[];
  observe_question?:string;
  explanation?:string;
};

const buttonStyle={padding:'8px 10px',borderRadius:10,border:'1px solid #d7dde6',background:'#fff',fontWeight:800,cursor:'pointer'} as const;

export default function TextbookFigure({content,lowData}:{content:FigureContent;lowData:boolean}){
  const [zoom,setZoom]=useState(1);
  const [active,setActive]=useState<string>('');
  const src=(lowData&&content.low_data_src)||content.src||'';
  const hotspots=content.hotspots||[];
  const selected=hotspots.find(item=>item.id===active);
  const canPublishOriginal=content.rights_status!=='REDRAW_REQUIRED';

  if(!src||!canPublishOriginal){
    return <div style={{padding:14,borderRadius:16,border:'1px solid #e5d7a8',background:'#fffaf0'}}>
      <Pill tone="warn">رسم قيد التجهيز</Pill>
      <h3 style={{margin:'9px 0 5px'}}>{content.title||'الشكل التعليمي'}</h3>
      <p style={{margin:0,lineHeight:1.8,color:'#667085'}}>{content.explanation||'سيتم استخدام رسم معاد إنشاؤه علميًا بدل نشر الأصل قبل اكتمال مراجعة الحقوق.'}</p>
    </div>;
  }

  return <figure style={{margin:0,padding:14,borderRadius:18,border:'1px solid #dbe3ec',background:'linear-gradient(180deg,#fff,#f8fbff)'}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'flex-start',flexWrap:'wrap'}}>
      <div>
        <div style={{fontSize:11,color:'#667085',fontWeight:900}}>من الكتاب · تعلّم بصري</div>
        <h3 style={{margin:'4px 0 5px',fontSize:20}}>{content.title||'لاحظ الشكل'}</h3>
        {content.prompt&&<p style={{margin:0,color:'#526071',lineHeight:1.8}}>{content.prompt}</p>}
      </div>
      <div style={{display:'flex',gap:6}}>
        <button onClick={()=>setZoom(value=>Math.max(1,value-.25))} style={buttonStyle} aria-label="تصغير الصورة">−</button>
        <button onClick={()=>setZoom(value=>Math.min(2.5,value+.25))} style={buttonStyle} aria-label="تكبير الصورة">＋</button>
      </div>
    </div>

    {content.observe_question&&<div style={{marginTop:12,padding:'10px 12px',borderRadius:12,background:'#fff8dc',border:'1px solid #eedc96',fontWeight:800}}>👁️ {content.observe_question}</div>}

    <div style={{position:'relative',marginTop:12,borderRadius:16,overflow:'auto',background:'#eef2f6',minHeight:220,maxHeight:520}}>
      <div style={{position:'relative',width:`${zoom*100}%`,minWidth:'100%',transition:lowData?'none':'width .18s ease'}}>
        <img src={src} alt={content.alt_text||content.title||'شكل تعليمي من الكتاب'} loading="lazy" style={{display:'block',width:'100%',height:'auto'}}/>
        {hotspots.map((spot,index)=><button key={spot.id} onClick={()=>setActive(spot.id)} aria-label={spot.label} style={{position:'absolute',left:`${spot.x}%`,top:`${spot.y}%`,transform:'translate(-50%,-50%)',width:30,height:30,borderRadius:999,border:'3px solid #fff',background:active===spot.id?'#176b3a':'#14213d',color:'#fff',fontWeight:900,boxShadow:'0 3px 12px rgba(0,0,0,.25)',cursor:'pointer'}}>{index+1}</button>)}
      </div>
    </div>

    {selected&&<div style={{marginTop:10}}><Notice tone="info"><strong>{selected.label}</strong>{selected.description&&<div style={{marginTop:4,lineHeight:1.7}}>{selected.description}</div>}</Notice></div>}
    {content.explanation&&<div style={{marginTop:11,padding:12,borderRadius:12,background:'#f4f9ff',lineHeight:1.8}}><strong>🧠 افهم:</strong> {content.explanation}</div>}
    {content.caption&&<figcaption style={{marginTop:10,color:'#475467',fontSize:13,lineHeight:1.7}}>{content.caption}</figcaption>}
    <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:8,fontSize:11,color:'#667085'}}>
      {content.source_label&&<span>{content.source_label}</span>}
      {content.source_page&&<span>· صفحة {content.source_page}</span>}
      {content.asset_kind&&<span>· {content.asset_kind}</span>}
    </div>
  </figure>;
}
