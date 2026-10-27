'use client';

import {useEffect,useMemo,useState} from 'react';
import {ActionButton,ActionLink,AdminShell,ButtonRow,Card,MetricCard,Notice,SectionHeader,StatusPill} from '../_components/AdminUI';

const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000';

type Lesson={id:number;lesson_code:string;title:string};
type Current={units:Array<{lessons:Lesson[]}>};
type Hotspot={id:string;x:number;y:number;label:string;description?:string|null};
type Asset={id:number;lesson_id:number;source_file_id:number;source_page:number;source_label:string;asset_kind:string;src?:string|null;low_data_src?:string|null;storage_key?:string;rights_status:'REVIEW_REQUIRED'|'CLEARED'|'REDRAW_REQUIRED';status:string;alt_text?:string|null;caption?:string|null;hotspots:Hotspot[];width:number;height:number};
type AssetPayload={lesson_id:number;assets:Asset[]};

type Draft={rights_status:Asset['rights_status'];alt_text:string;caption:string;hotspots:Hotspot[]};

function tone(status:Asset['rights_status']):'good'|'warn'|'bad'{return status==='CLEARED'?'good':status==='REDRAW_REQUIRED'?'bad':'warn';}
function headers(json=false){return {Authorization:`Bearer ${localStorage.getItem('pal_admin_token')||''}`,...(json?{'Content-Type':'application/json'}:{})};}

function AssetEditor({asset,onSaved}:{asset:Asset;onSaved:(asset:Asset)=>void}){
  const [draft,setDraft]=useState<Draft>({rights_status:asset.rights_status,alt_text:asset.alt_text||'',caption:asset.caption||'',hotspots:asset.hotspots||[]});
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [saved,setSaved]=useState('');

  function addHotspot(event:React.MouseEvent<HTMLDivElement>){
    if(!asset.src)return;
    const rect=event.currentTarget.getBoundingClientRect();
    const x=Math.max(0,Math.min(100,((event.clientX-rect.left)/rect.width)*100));
    const y=Math.max(0,Math.min(100,((event.clientY-rect.top)/rect.height)*100));
    const id=`hotspot-${Date.now()}-${draft.hotspots.length+1}`;
    setDraft(value=>({...value,hotspots:[...value.hotspots,{id,x:Number(x.toFixed(2)),y:Number(y.toFixed(2)),label:`نقطة ${value.hotspots.length+1}`,description:''}]}));
  }

  function updateHotspot(id:string,patch:Partial<Hotspot>){setDraft(value=>({...value,hotspots:value.hotspots.map(item=>item.id===id?{...item,...patch}:item)}));}
  function removeHotspot(id:string){setDraft(value=>({...value,hotspots:value.hotspots.filter(item=>item.id!==id)}));}

  async function save(){
    setBusy(true);setError('');setSaved('');
    try{
      const r=await fetch(`${API}/importer/visual-assets/${asset.id}`,{method:'PATCH',headers:headers(true),body:JSON.stringify(draft)});
      const body=await r.json();
      if(!r.ok)throw new Error(typeof body.detail==='string'?body.detail:body.detail?.message||'تعذر حفظ مراجعة الصورة');
      onSaved(body);setSaved('تم حفظ مراجعة الأصل البصري.');
    }catch(e){setError(e instanceof Error?e.message:'تعذر حفظ مراجعة الصورة');}
    finally{setBusy(false);}
  }

  return <Card style={{overflow:'hidden'}}>
    <SectionHeader title={`صفحة ${asset.source_page}`} description={`${asset.source_label} · Source #${asset.source_file_id}`} aside={<StatusPill tone={tone(draft.rights_status)}>{draft.rights_status}</StatusPill>}/>
    {asset.src?<>
      <div onClick={addHotspot} title="اضغط على الصورة لإضافة Hotspot" style={{position:'relative',cursor:'crosshair',borderRadius:12,overflow:'hidden',border:'1px solid #d9e1ea',background:'#f5f7fa'}}>
        <img src={asset.src} alt={draft.alt_text||`صفحة ${asset.source_page}`} style={{display:'block',width:'100%',height:'auto'}}/>
        {draft.hotspots.map((spot,index)=><div key={spot.id} style={{position:'absolute',left:`${spot.x}%`,top:`${spot.y}%`,transform:'translate(-50%,-50%)',width:30,height:30,borderRadius:99,display:'grid',placeItems:'center',background:'#14213d',border:'3px solid #fff',color:'#fff',fontSize:12,fontWeight:900,pointerEvents:'none',boxShadow:'0 4px 12px rgba(0,0,0,.25)'}}>{index+1}</div>)}
      </div>
      <div style={{fontSize:12,color:'#667085',marginTop:6}}>اضغط على أي موضع في الصورة لإضافة نقطة تفاعلية. الإحداثيات تُحفظ كنسبة مئوية لتعمل على الهاتف والكمبيوتر.</div>
    </>:<Notice tone="warn">لا يوجد Public URL للصورة بعد. يمكن تخزينها ومراجعة بياناتها، لكن لا يمكن اعتمادها `CLEARED` للطالب حتى يصبح لها رابط تسليم عام.</Notice>}

    <div style={{display:'grid',gap:10,marginTop:13}}>
      <label style={{display:'grid',gap:5,fontSize:13,fontWeight:800}}>وصف بديل للصورة (مطلوب قبل CLEARED)
        <textarea value={draft.alt_text} onChange={e=>setDraft(v=>({...v,alt_text:e.target.value}))} rows={2} style={{padding:10,border:'1px solid #cfd6df',borderRadius:10,font: 'inherit',resize:'vertical'}}/>
      </label>
      <label style={{display:'grid',gap:5,fontSize:13,fontWeight:800}}>تعليق تعليمي مختصر
        <textarea value={draft.caption} onChange={e=>setDraft(v=>({...v,caption:e.target.value}))} rows={2} style={{padding:10,border:'1px solid #cfd6df',borderRadius:10,font:'inherit',resize:'vertical'}}/>
      </label>
      <label style={{display:'grid',gap:5,fontSize:13,fontWeight:800}}>قرار الحقوق
        <select value={draft.rights_status} onChange={e=>setDraft(v=>({...v,rights_status:e.target.value as Asset['rights_status']}))} style={{minHeight:44,padding:'0 10px',border:'1px solid #cfd6df',borderRadius:10,background:'#fff'}}>
          <option value="REVIEW_REQUIRED">REVIEW_REQUIRED — لا تظهر للطالب</option>
          <option value="CLEARED">CLEARED — مسموح استخدامها</option>
          <option value="REDRAW_REQUIRED">REDRAW_REQUIRED — أعد رسمها بدل نشر الأصل</option>
        </select>
      </label>
    </div>

    <div style={{marginTop:14}}><SectionHeader title="Hotspots" description="الأسماء والشرح هنا تصبح جزءًا من الـvisual asset المعتمد؛ الـAI لا يملك تغيير مواقعها."/></div>
    {draft.hotspots.length===0?<Notice>لا توجد Hotspots. اضغط على الصورة لإضافة أول نقطة.</Notice>:<div style={{display:'grid',gap:8}}>{draft.hotspots.map((spot,index)=><div key={spot.id} style={{display:'grid',gridTemplateColumns:'44px minmax(0,1fr) minmax(0,1.4fr) auto',gap:7,alignItems:'center',padding:8,border:'1px solid #e6ebf2',borderRadius:10}}>
      <strong style={{textAlign:'center'}}>{index+1}</strong>
      <input value={spot.label} onChange={e=>updateHotspot(spot.id,{label:e.target.value})} placeholder="اسم الجزء" style={{minWidth:0,padding:8,border:'1px solid #d6dce5',borderRadius:8}}/>
      <input value={spot.description||''} onChange={e=>updateHotspot(spot.id,{description:e.target.value})} placeholder="شرح قصير" style={{minWidth:0,padding:8,border:'1px solid #d6dce5',borderRadius:8}}/>
      <button onClick={()=>removeHotspot(spot.id)} aria-label="حذف النقطة" style={{border:'1px solid #efc0c0',background:'#fff',color:'#b42318',borderRadius:8,minWidth:36,minHeight:36}}>×</button>
    </div>)}</div>}

    <div style={{display:'flex',gap:7,flexWrap:'wrap',marginTop:12,fontSize:12,color:'#667085'}}><span>{asset.asset_kind}</span><span>· {asset.width}×{asset.height}</span><span>· {asset.status}</span><span>· {draft.hotspots.length} hotspots</span></div>
    {saved&&<div style={{marginTop:10}}><Notice tone="good">{saved}</Notice></div>}
    {error&&<div style={{marginTop:10}}><Notice tone="bad">{error}</Notice></div>}
    <div style={{marginTop:12}}><ButtonRow><ActionButton onClick={()=>void save()} disabled={busy}>{busy?'جارٍ الحفظ…':'حفظ المراجعة'}</ActionButton></ButtonRow></div>
  </Card>;
}

export default function VisualAssetsPage(){
  const [lessons,setLessons]=useState<Lesson[]>([]);const [lessonId,setLessonId]=useState<number|null>(null);const [assets,setAssets]=useState<Asset[]>([]);const [error,setError]=useState('');const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);

  async function load(preferred?:number){
    setError('');
    try{
      const currentResponse=await fetch(`${API}/admin/current-semester`,{headers:headers()});const current:Current=await currentResponse.json();if(!currentResponse.ok)throw new Error((current as any).detail||'تعذر تحميل الدروس');
      const all=current.units.flatMap(unit=>unit.lessons||[]);setLessons(all);
      const fromUrl=Number(new URLSearchParams(window.location.search).get('lesson_id')||0);const target=preferred||fromUrl||all[0]?.id;if(!target)throw new Error('لا توجد دروس متاحة');setLessonId(target);
      const r=await fetch(`${API}/importer/lessons/${target}/visual-assets`,{headers:headers()});const body:AssetPayload&{detail?:any}=await r.json();if(!r.ok)throw new Error(typeof body.detail==='string'?body.detail:body.detail?.message||'تعذر تحميل الصور');setAssets(body.assets||[]);
    }catch(e){setError(e instanceof Error?e.message:'تعذر تحميل الأصول البصرية');}
  }
  useEffect(()=>{void load();},[]);

  const counts=useMemo(()=>({cleared:assets.filter(x=>x.rights_status==='CLEARED').length,review:assets.filter(x=>x.rights_status==='REVIEW_REQUIRED').length,redraw:assets.filter(x=>x.rights_status==='REDRAW_REQUIRED').length}),[assets]);

  async function chooseLesson(id:number){const url=new URL(window.location.href);url.searchParams.set('lesson_id',String(id));window.history.replaceState({},'',url);setAssets([]);setMessage('');await load(id);}
  async function extract(){if(!lessonId)return;setBusy(true);setError('');setMessage('');try{const r=await fetch(`${API}/importer/lessons/${lessonId}/visual-assets/extract`,{method:'POST',headers:headers()});const b=await r.json();if(!r.ok)throw new Error(typeof b.detail==='string'?b.detail:b.detail?.message||'فشل استخراج صور الكتاب');setMessage(`تم فحص ${b.eligible_page_count||0} صفحة موثقة: ${b.created||0} جديدة، ${b.unchanged||0} دون تغيير، ${b.replaced||0} أعيد استخراجها.`);await load(lessonId);}catch(e){setError(e instanceof Error?e.message:'فشل استخراج صور الكتاب');}finally{setBusy(false);}}
  function replaceAsset(updated:Asset){setAssets(rows=>rows.map(row=>row.id===updated.id?updated:row));}

  return <AdminShell eyebrow="الإدارة ← المحتوى البصري" title="صور الكتاب والتفاعل البصري" description="استخرج فقط الصفحات المرتبطة بمصادر الدرس الموثقة، راجع الحقوق، ثم أضف Hotspots ووصفًا تعليميًا. لا تدخل أي صورة إلى الـAI أو الطالب قبل CLEARED.">
    <Card style={{marginBottom:14}}><SectionHeader title="الدرس" description="اختر الدرس ثم استخرج صفحاته المرتبطة بمصدر TEACHING_SOURCE المعتمد." aside={<ActionButton disabled={busy||!lessonId} onClick={()=>void extract()}>{busy?'جارٍ الاستخراج…':'استخراج صور الصفحات الموثقة'}</ActionButton>}/><select value={lessonId||''} onChange={e=>void chooseLesson(Number(e.target.value))} style={{width:'100%',minHeight:46,border:'1px solid #cfd6df',borderRadius:11,padding:'0 12px',background:'#fff',fontSize:15}}>{lessons.map(item=><option key={item.id} value={item.id}>{item.lesson_code} · {item.title}</option>)}</select></Card>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:10,marginBottom:14}}><MetricCard label="CLEARED" value={counts.cleared} tone={counts.cleared?'good':'neutral'} detail="مسموح دخولها للدرس"/><MetricCard label="تنتظر الحقوق" value={counts.review} tone={counts.review?'warn':'good'} detail="لن تظهر للطالب"/><MetricCard label="إعادة رسم" value={counts.redraw} tone={counts.redraw?'bad':'neutral'} detail="يُمنع نشر الأصل"/></div>
    {message&&<div style={{marginBottom:12}}><Notice tone="good">{message}</Notice></div>}{error&&<div style={{marginBottom:12}}><Notice tone="bad">{error}</Notice></div>}
    {!error&&assets.length===0&&<Notice tone="warn">لا توجد أصول بصرية لهذا الدرس بعد. يجب أولًا اعتماد Source Chunks للدرس، ثم اضغط «استخراج صور الصفحات الموثقة».</Notice>}
    {assets.length>0&&<div style={{display:'grid',gap:14}}>{assets.map(asset=><AssetEditor key={asset.id} asset={asset} onSaved={replaceAsset}/>)}</div>}
    <Card style={{marginTop:14,position:'sticky',bottom:10,zIndex:2}}><SectionHeader title="المسار" description="بعد اعتماد الصور CLEARED ستدخل تلقائيًا في Generation Packet v7 فقط إذا كانت صفحاتها ضمن source_context الفعلي."/><ButtonRow><ActionLink href={lessonId?`/admin/lesson-generation?lesson_id=${lessonId}`:'/admin/lesson-generation'}>Lesson Generation</ActionLink><ActionLink href={lessonId?`/admin/source-link-review?lesson_id=${lessonId}`:'/admin/source-link-review'} tone="secondary">Source Review</ActionLink><ActionLink href="/admin/current-semester" tone="secondary">الفصل الحالي</ActionLink></ButtonRow></Card>
  </AdminShell>;
}
