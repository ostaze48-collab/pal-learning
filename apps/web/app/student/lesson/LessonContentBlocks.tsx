'use client';

import {useMemo,useState} from 'react';
import {Notice,Pill,PrimaryButton} from '../_components/StudentUI';
import TextbookFigure from './TextbookFigure';

export type LessonBlockData={id:number;block_type:string;content:any;order_no:number};

const buttonStyle={padding:'9px 12px',borderRadius:10,border:'1px solid #d7dde6',background:'#fff',fontWeight:800,cursor:'pointer'} as const;

export function lessonBlockText(block:LessonBlockData){
  const c=block.content||{};
  if(block.block_type==='SUMMARY')return [c.title,...(c.items||[])].filter(Boolean).join('. ');
  if(block.block_type==='TIMELINE')return [c.title,...(c.items||[]).flatMap((x:any)=>[x.name,x.text])].filter(Boolean).join('. ');
  if(block.block_type==='MATCHING')return [c.title,c.prompt,...(c.pairs||[]).flat()].filter(Boolean).join('. ');
  if(block.block_type==='MICROSCOPE_ZOOM')return [c.title,c.prompt,...(c.levels||[]).flatMap((x:any)=>[x.label,x.caption])].filter(Boolean).join('. ');
  if(block.block_type==='CLASSIFY')return [c.title,c.prompt,...(c.categories||[]).flatMap((x:any)=>[x.label,x.description]),...(c.items||[]).map((x:any)=>x.label)].filter(Boolean).join('. ');
  if(block.block_type==='COMPARE_GRID')return [c.title,c.prompt,...(c.columns||[]).map((x:any)=>x.label),...(c.rows||[]).flatMap((x:any)=>[x.label,...Object.values(x.values||{})])].filter(Boolean).join('. ');
  if(block.block_type==='IMAGE')return [c.title,c.observe_question,c.explanation,c.caption,...(c.hotspots||[]).flatMap((x:any)=>[x.label,x.description])].filter(Boolean).join('. ');
  return [c.label,c.title,c.body].filter(Boolean).join('. ');
}

function Timeline({items}:{items:Array<{year:string;name:string;text:string}>}){
  return <div style={{display:'grid',gap:10}}>{items.map((item,i)=><div key={i} style={{display:'grid',gridTemplateColumns:'72px 1fr',gap:10}}><div style={{display:'grid',placeItems:'center',borderRadius:14,background:'#eef8f1',color:'#176b3a',fontWeight:900,padding:8,textAlign:'center'}}>{item.year}</div><div style={{padding:12,border:'1px solid #e7ebf1',borderRadius:14,background:'#fff'}}><strong>{item.name}</strong><div style={{marginTop:4,lineHeight:1.8,color:'#475467'}}>{item.text}</div></div></div>)}</div>;
}

function VirtualMicroscope({content,lowData}:{content:any;lowData:boolean}){
  const levels:Array<{label:string;caption:string;magnification:string}>=content.levels||[];
  const [level,setLevel]=useState(0);const [lightOn,setLightOn]=useState(false);const [focus,setFocus]=useState(30);
  const current=levels[level]||{label:'',caption:'',magnification:''};
  const isMicroscope=level===2;const focused=!isMicroscope||focus>=82;const cells=isMicroscope?(lowData?18:30):level===1?(lowData?6:9):1;const blur=isMicroscope?Math.max(0,(82-focus)/12):0;const success=isMicroscope&&lightOn&&focused;
  return <div style={{padding:14,borderRadius:18,border:'1px solid #d7e4dc',background:'linear-gradient(135deg,#f8fcf9,#f7f9ff)'}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}><div><div style={{fontSize:11,color:'#667085',fontWeight:900}}>مختبر افتراضي</div><h3 style={{margin:'4px 0 5px',fontSize:20}}>{content.title||'جرّب بنفسك'}</h3><p style={{margin:0,color:'#526071',lineHeight:1.8}}>{content.prompt}</p></div><Pill tone={success?'good':'info'}>{success?'تم الضبط ✓':current.magnification}</Pill></div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:7,marginTop:14}}>{levels.map((row,i)=><button key={row.label} onClick={()=>setLevel(i)} style={{padding:'10px 6px',borderRadius:12,border:i===level?'2px solid #176b3a':'1px solid #d7dde6',background:i===level?'#eef9f1':'#fff',fontWeight:800,fontSize:12}}>{i===0?'👁️ ':i===1?'🔍 ':'🔬 '}{row.label}</button>)}</div>
    {isMicroscope&&<div style={{display:'grid',gap:10,marginTop:12,padding:12,borderRadius:14,background:'#fff',border:'1px solid #e5e9ef'}}><div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'center'}}><div><strong>1. شغّل مصدر الضوء</strong><div style={{fontSize:12,color:'#667085'}}>بدون الضوء لن تظهر العينة بوضوح.</div></div><button onClick={()=>setLightOn(v=>!v)} style={{...buttonStyle,background:lightOn?'#176b3a':'#f2f4f7',color:lightOn?'#fff':'#344054'}}>{lightOn?'مضاء':'تشغيل'}</button></div><div><div style={{display:'flex',justifyContent:'space-between',fontSize:13,fontWeight:800}}><span>2. اضبط التركيز</span><span>{focus}%</span></div><input aria-label="ضبط التركيز" type="range" min="0" max="100" value={focus} onChange={e=>setFocus(Number(e.target.value))} style={{width:'100%',marginTop:8}}/></div></div>}
    <div style={{marginTop:12,minHeight:210,borderRadius:16,border:'1px solid #dbc9aa',background:lightOn||!isMicroscope?'#b98555':'#3d342f',padding:level===0?22:12,display:'grid',gridTemplateColumns:level===0?'1fr':`repeat(${level===1?3:6},1fr)`,gap:level===2?3:7,filter:`blur(${blur}px)`,opacity:isMicroscope&&!lightOn?.35:1,transition:lowData?'none':'all .2s'}}>{Array.from({length:cells}).map((_,i)=><div key={i} style={{minHeight:level===0?158:level===1?52:27,borderRadius:level===0?13:5,border:level===0?'0':'2px solid rgba(78,48,25,.55)',background:level===0?'linear-gradient(135deg,#c8935e,#9e683d)':i%3===0?'rgba(242,213,170,.72)':'rgba(221,180,128,.72)'}}>{level===0&&<div style={{display:'grid',height:'100%',placeItems:'center',color:'#fff7ec',fontWeight:900,fontSize:20}}>العينة</div>}</div>)}</div>
    <div style={{marginTop:11,padding:11,borderRadius:12,background:'#fff',border:'1px solid #e6eaf0',lineHeight:1.8}}><strong>{current.label}:</strong> {current.caption}</div>{success&&<div style={{marginTop:9}}><Notice tone="good"><strong>أحسنت!</strong> أصبحت العينة واضحة.</Notice></div>}
  </div>;
}

function DragMatching({content}:{content:any}){
  const pairs:Array<[string,string]>=content.pairs||[];const targets=useMemo(()=>pairs.map(p=>p[1]).reverse(),[content]);
  const [assignments,setAssignments]=useState<Record<string,string>>({});const [active,setActive]=useState('');const [checked,setChecked]=useState(false);
  const sourceFor=(target:string)=>pairs.find(p=>p[1]===target)?.[0]||'';const correct=targets.filter(t=>assignments[t]===sourceFor(t)).length;
  function assign(target:string,source:string){if(!source||checked)return;setAssignments(x=>({...x,[target]:source}));setActive('');}
  return <div><div style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}><div><h3 style={{margin:'0 0 5px'}}>{content.title||'مطابقة'}</h3><p style={{margin:0,color:'#667085'}}>{content.prompt||'اسحب العنصر إلى المكان المناسب، أو اضغط عليه ثم اضغط على الهدف.'}</p></div><Pill tone={checked&&correct===pairs.length?'good':'info'}>{checked?`${correct}/${pairs.length}`:'اسحب وطابق'}</Pill></div>
    <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,1.4fr)',gap:10,marginTop:13}}><div style={{display:'grid',gap:8,alignContent:'start'}}>{pairs.map(([source])=><button key={source} draggable={!checked} onDragStart={e=>e.dataTransfer.setData('text/plain',source)} onClick={()=>!checked&&setActive(source)} style={{padding:10,borderRadius:11,border:active===source?'2px solid #176b3a':'1px solid #d7dde6',background:active===source?'#eef9f1':'#fff',fontWeight:900}}>{source}</button>)}</div><div style={{display:'grid',gap:8}}>{targets.map(target=><button key={target} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();assign(target,e.dataTransfer.getData('text/plain'));}} onClick={()=>assign(target,active)} style={{minHeight:58,padding:10,borderRadius:11,border:'1px dashed #aeb8c5',background:'#fff',textAlign:'right'}}><div style={{fontSize:12,color:'#667085'}}>{target}</div><strong style={{display:'block',marginTop:5,color:checked?(assignments[target]===sourceFor(target)?'#176b3a':'#a33'):'#14213d'}}>{assignments[target]||'ضع العنصر هنا'}</strong></button>)}</div></div>
    <div style={{display:'flex',gap:8,marginTop:12}}><PrimaryButton disabled={Object.keys(assignments).length<pairs.length||checked} onClick={()=>setChecked(true)}>تحقق من المطابقة</PrimaryButton><button onClick={()=>{setAssignments({});setChecked(false);setActive('');}} style={buttonStyle}>إعادة المحاولة</button></div>{checked&&<div style={{marginTop:10}}><Notice tone={correct===pairs.length?'good':'warn'}>{correct===pairs.length?'ممتاز! أكملت المطابقة بصورة صحيحة.':'راجع الإجابات ثم أعد المحاولة.'}</Notice></div>}</div>;
}

type Category={id:string;label:string;description?:string};
type ClassifyItem={id:string;label:string;category_id:string;detail?:string};

function ClassifyActivity({content}:{content:any}){
  const categories:Category[]=content.categories||[];const items:ClassifyItem[]=content.items||[];
  const [assignments,setAssignments]=useState<Record<string,string>>({});const [activeItem,setActiveItem]=useState('');const [checked,setChecked]=useState(false);
  const assignedCount=Object.keys(assignments).length;const correctCount=items.filter(item=>assignments[item.id]===item.category_id).length;
  function assign(itemId:string,categoryId:string){if(!itemId||checked)return;setAssignments(x=>({...x,[itemId]:categoryId}));setActiveItem('');}
  function reset(){setAssignments({});setActiveItem('');setChecked(false);}
  return <div style={{padding:14,borderRadius:16,border:'1px solid #d9e3ec',background:'#fbfcfe'}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}><div><div style={{fontSize:11,color:'#667085',fontWeight:900}}>نشاط تصنيف</div><h3 style={{margin:'4px 0 5px',fontSize:19}}>{content.title||'صنّف العناصر'}</h3><p style={{margin:0,color:'#667085',lineHeight:1.75}}>{content.prompt||'اختر عنصرًا ثم ضعْه في الفئة المناسبة، أو اسحبه مباشرة.'}</p></div><Pill tone={checked&&correctCount===items.length?'good':'info'}>{checked?`${correctCount}/${items.length}`:`${assignedCount}/${items.length}`}</Pill></div>
    <div style={{display:'flex',gap:7,flexWrap:'wrap',marginTop:13}}>{items.map(item=><button key={item.id} draggable={!checked} onDragStart={e=>e.dataTransfer.setData('text/plain',item.id)} onClick={()=>!checked&&setActiveItem(item.id)} style={{padding:'9px 11px',borderRadius:999,border:activeItem===item.id?'2px solid #176b3a':'1px solid #d7dde6',background:activeItem===item.id?'#eef9f1':'#fff',fontWeight:800,opacity:assignments[item.id]?0.62:1}}>{item.label}</button>)}</div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:9,marginTop:13}}>{categories.map(category=>{
      const placed=items.filter(item=>assignments[item.id]===category.id);
      return <button key={category.id} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();assign(e.dataTransfer.getData('text/plain'),category.id);}} onClick={()=>assign(activeItem,category.id)} style={{minHeight:130,padding:12,borderRadius:14,border:'1px dashed #aeb8c5',background:'#fff',textAlign:'right'}}><strong style={{display:'block',fontSize:16}}>{category.label}</strong>{category.description&&<span style={{display:'block',fontSize:11,color:'#667085',marginTop:3,lineHeight:1.5}}>{category.description}</span>}<div style={{display:'flex',gap:5,flexWrap:'wrap',marginTop:10}}>{placed.length?placed.map(item=><span key={item.id} style={{padding:'5px 7px',borderRadius:8,background:checked?(item.category_id===category.id?'#eaf8ee':'#fff0ee'):'#eef4ff',color:checked&&item.category_id!==category.id?'#a33':'#344054',fontSize:12,fontWeight:800}}>{item.label}</span>):<span style={{fontSize:12,color:'#98a2b3'}}>ضع العناصر هنا</span>}</div></button>})}</div>
    <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}><PrimaryButton disabled={assignedCount<items.length||checked} onClick={()=>setChecked(true)}>تحقق من التصنيف</PrimaryButton><button onClick={reset} style={buttonStyle}>إعادة المحاولة</button></div>
    {checked&&<div style={{marginTop:10}}><Notice tone={correctCount===items.length?'good':'warn'}>{correctCount===items.length?(content.success_message||'ممتاز! صنّفت جميع العناصر بصورة صحيحة.'):(content.retry_message||'راجع العناصر المعلّمة، ثم أعد التصنيف.')}</Notice></div>}
  </div>;
}

type CompareColumn={id:string;label:string};
type CompareRow={label:string;values:Record<string,string>};

function CompareGrid({content}:{content:any}){
  const columns:CompareColumn[]=content.columns||[];const rows:CompareRow[]=content.rows||[];
  return <div style={{padding:14,borderRadius:16,border:'1px solid #dbe3ec',background:'#fff'}}><div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'flex-start',flexWrap:'wrap'}}><div><div style={{fontSize:11,color:'#667085',fontWeight:900}}>قارن</div><h3 style={{margin:'4px 0 5px'}}>{content.title||'جدول المقارنة'}</h3>{content.prompt&&<p style={{margin:0,color:'#667085',lineHeight:1.7}}>{content.prompt}</p>}</div><Pill tone="info">{columns.length} فئات</Pill></div>
    <div style={{overflowX:'auto',marginTop:12}}><table style={{width:'100%',borderCollapse:'separate',borderSpacing:0,minWidth:Math.max(420,150+columns.length*150)}}><thead><tr><th style={{padding:10,textAlign:'right',background:'#f8fafc',border:'1px solid #e4e8ee'}}>وجه المقارنة</th>{columns.map(column=><th key={column.id} style={{padding:10,textAlign:'center',background:'#eef8f1',border:'1px solid #e4e8ee'}}>{column.label}</th>)}</tr></thead><tbody>{rows.map((row,index)=><tr key={`${row.label}-${index}`}><th style={{padding:10,textAlign:'right',background:'#fafbfc',border:'1px solid #e8ebef'}}>{row.label}</th>{columns.map(column=><td key={column.id} style={{padding:10,textAlign:'center',lineHeight:1.65,border:'1px solid #e8ebef'}}>{row.values?.[column.id]??'—'}</td>)}</tr>)}</tbody></table></div>
  </div>;
}

export function LessonBlock({block,lowData}:{block:LessonBlockData;lowData:boolean}){
  const c=block.content||{};
  if(block.block_type==='INFO_CARD')return <div style={{padding:14,borderRadius:15,background:'#f4f9ff',border:'1px solid #d8e8fb'}}><div style={{display:'flex',gap:9,alignItems:'center'}}><span style={{fontSize:27}}>{c.icon||'💡'}</span><div><div style={{fontSize:11,color:'#667085',fontWeight:900}}>{c.label||'معلومة'}</div><strong style={{fontSize:18}}>{c.title||''}</strong></div></div>{c.body&&<p style={{margin:'9px 0 0',lineHeight:1.9}}>{c.body}</p>}</div>;
  if(block.block_type==='IMAGE')return <TextbookFigure content={c} lowData={lowData}/>;
  if(block.block_type==='MICROSCOPE_ZOOM')return <VirtualMicroscope content={c} lowData={lowData}/>;
  if(block.block_type==='TIMELINE')return <div><h3 style={{margin:'0 0 10px'}}>{c.title||'خط زمني'}</h3><Timeline items={c.items||[]}/></div>;
  if(block.block_type==='MATCHING')return <DragMatching content={c}/>;
  if(block.block_type==='CLASSIFY')return <ClassifyActivity content={c}/>;
  if(block.block_type==='COMPARE_GRID')return <CompareGrid content={c}/>;
  if(block.block_type==='SUMMARY')return <div style={{padding:14,borderRadius:15,background:'#f7fcf9',border:'1px solid #cfe7d7'}}><h3 style={{margin:'0 0 8px'}}>{c.title||'الخلاصة'}</h3><ul style={{margin:0,paddingInlineStart:20,lineHeight:2}}>{(c.items||[]).map((x:string,i:number)=><li key={i}>{x}</li>)}</ul></div>;
  return <div><h3 style={{margin:'0 0 7px'}}>{c.title||c.label||''}</h3>{c.body&&<p style={{margin:0,lineHeight:1.95,color:'#344054'}}>{c.body}</p>}</div>;
}
