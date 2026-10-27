'use client';

import {useEffect,useMemo,useState,type MouseEvent} from 'react';
import {ActionButton,ActionLink,AdminShell,ButtonRow,Card,Notice,SectionHeader,StatusPill} from '../_components/AdminUI';

const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000';

type Lesson={id:number;lesson_code:string;title:string};
type Current={units:Array<{lessons:Lesson[]}>;detail?:unknown};
type Asset={id:number;lesson_id:number;source_page:number;source_label:string;asset_kind:string;src?:string|null;region_key?:string;parent_asset_id?:number|null;rights_status:string;width:number;height:number};
type AssetPayload={assets:Asset[];detail?:unknown};
type Point={x:number;y:number};
type Box={x:number;y:number;width:number;height:number};

function headers(json=false):Record<string,string>{const h:Record<string,string>={Authorization:`Bearer ${localStorage.getItem('pal_admin_token')||''}`};if(json)h['Content-Type']='application/json';return h;}
function message(detail:unknown,fallback:string){if(typeof detail==='string')return detail;if(detail&&typeof detail==='object'&&'message' in detail&&typeof (detail as {message?:unknown}).message==='string')return (detail as {message:string}).message;return fallback;}
function point(event:MouseEvent<HTMLDivElement>):Point{const r=event.currentTarget.getBoundingClientRect();return{x:Math.max(0,Math.min(100,((event.clientX-r.left)/r.width)*100)),y:Math.max(0,Math.min(100,((event.clientY-r.top)/r.height)*100))};}
function boxFrom(a:Point|null,b:Point|null):Box|null{if(!a||!b)return null;const x=Math.min(a.x,b.x);const y=Math.min(a.y,b.y);return{x:Number(x.toFixed(2)),y:Number(y.toFixed(2)),width:Number(Math.abs(a.x-b.x).toFixed(2)),height:Number(Math.abs(a.y-b.y).toFixed(2))};}

export default function VisualCropsPage(){
  const [lessons,setLessons]=useState<Lesson[]>([]);const [lessonId,setLessonId]=useState<number|null>(null);const [assets,setAssets]=useState<Asset[]>([]);const [parentId,setParentId]=useState<number|null>(null);
  const [start,setStart]=useState<Point|null>(null);const [end,setEnd]=useState<Point|null>(null);const [dragging,setDragging]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [notice,setNotice]=useState('');
  const parents=useMemo(()=>assets.filter(a=>a.asset_kind==='TEXTBOOK_PAGE_CROP'&&a.src),[assets]);
  const parent=parents.find(a=>a.id===parentId)||parents[0]||null;const crop=boxFrom(start,end);const valid=Boolean(crop&&crop.width>=5&&crop.height>=5&&crop.x+crop.width<=100&&crop.y+crop.height<=100);

  async function load(target?:number){
    setError('');
    try{
      const currentResponse=await fetch(`${API}/admin/current-semester`,{headers:headers()});const current:Current=await currentResponse.json();if(!currentResponse.ok)throw new Error(message(current.detail,'تعذر تحميل الدروس'));
      const all=current.units.flatMap(u=>u.lessons||[]);setLessons(all);const fromUrl=Number(new URLSearchParams(window.location.search).get('lesson_id')||0);const selected=target||fromUrl||all[0]?.id;if(!selected)throw new Error('لا توجد دروس متاحة');setLessonId(selected);
      const response=await fetch(`${API}/importer/lessons/${selected}/visual-assets`,{headers:headers()});const body:AssetPayload=await response.json();if(!response.ok)throw new Error(message(body.detail,'تعذر تحميل صور الكتاب'));setAssets(body.assets||[]);const first=(body.assets||[]).find(a=>a.asset_kind==='TEXTBOOK_PAGE_CROP'&&a.src);setParentId(first?.id||null);setStart(null);setEnd(null);
    }catch(e){setError(e instanceof Error?e.message:'تعذر تحميل صفحة القص');}
  }
  useEffect(()=>{void load();},[]);

  async function chooseLesson(id:number){const url=new URL(window.location.href);url.searchParams.set('lesson_id',String(id));window.history.replaceState({},'',url);setNotice('');await load(id);}
  function begin(event:MouseEvent<HTMLDivElement>){const p=point(event);setStart(p);setEnd(p);setDragging(true);setNotice('');}
  function move(event:MouseEvent<HTMLDivElement>){if(dragging)setEnd(point(event));}
  function finish(event:MouseEvent<HTMLDivElement>){if(dragging)setEnd(point(event));setDragging(false);}

  async function createCrop(){
    if(!parent||!crop||!valid)return;setBusy(true);setError('');setNotice('');
    try{const response=await fetch(`${API}/importer/visual-assets/${parent.id}/figure-crops`,{method:'POST',headers:headers(true),body:JSON.stringify(crop)});const body=await response.json();if(!response.ok)throw new Error(message(body.detail,'تعذر إنشاء الشكل المقصوص'));setNotice(`تم إنشاء Figure Crop #${body.asset?.id}. حالته REVIEW_REQUIRED حتى تراجع الحقوق والوصف.`);setStart(null);setEnd(null);await load(lessonId||undefined);}
    catch(e){setError(e instanceof Error?e.message:'تعذر إنشاء الشكل المقصوص');}finally{setBusy(false);}
  }

  return <AdminShell eyebrow="الإدارة ← المحتوى البصري ← القص" title="قص الشكل العلمي من صفحة الكتاب" description="استخدم صفحة الكتاب كمصدر إداري فقط، وحدد بالرسم المنطقة التي تريد أن تظهر للطالب. سيُنشأ TEXTBOOK_FIGURE مستقل مع نسخة Low‑Data وحالة REVIEW_REQUIRED.">
    <Card style={{marginBottom:14}}><SectionHeader title="1 · اختر الدرس والصفحة" description="لا تظهر هنا إلا صفحات الكتاب المستخرجة من Source Chunks موثقة."/>
      <div style={{display:'grid',gap:9}}><select value={lessonId||''} onChange={e=>void chooseLesson(Number(e.target.value))} style={{minHeight:46,border:'1px solid #cfd6df',borderRadius:10,padding:'0 10px',background:'#fff'}}>{lessons.map(l=><option key={l.id} value={l.id}>{l.lesson_code} · {l.title}</option>)}</select>
      <select value={parent?.id||''} onChange={e=>{setParentId(Number(e.target.value));setStart(null);setEnd(null);}} style={{minHeight:46,border:'1px solid #cfd6df',borderRadius:10,padding:'0 10px',background:'#fff'}}>{parents.map(a=><option key={a.id} value={a.id}>صفحة {a.source_page} · {a.source_label}</option>)}</select></div>
    </Card>

    {error&&<div style={{marginBottom:12}}><Notice tone="bad">{error}</Notice></div>}{notice&&<div style={{marginBottom:12}}><Notice tone="good">{notice}</Notice></div>}
    {!parent&&!error&&<Notice tone="warn">لا توجد صفحة كتاب قابلة للقص. ارجع إلى «صور الكتاب» واستخرج الصفحات الموثقة أولًا.</Notice>}

    {parent&&<Card style={{marginBottom:14}}><SectionHeader title="2 · اسحب مستطيلًا حول الشكل" description="ابدأ من زاوية الشكل واسحب حتى الزاوية المقابلة. الحد الأدنى 5% من عرض وارتفاع الصفحة." aside={<StatusPill tone="info">Page {parent.source_page}</StatusPill>}/>
      <div onMouseDown={begin} onMouseMove={move} onMouseUp={finish} onMouseLeave={e=>{if(dragging)finish(e);}} style={{position:'relative',userSelect:'none',cursor:'crosshair',border:'1px solid #d5dde7',borderRadius:12,overflow:'hidden',background:'#f5f7fa'}}>
        <img src={parent.src||''} alt={`صفحة ${parent.source_page} من الكتاب`} draggable={false} style={{display:'block',width:'100%',height:'auto',pointerEvents:'none'}}/>
        {crop&&<div style={{position:'absolute',left:`${crop.x}%`,top:`${crop.y}%`,width:`${crop.width}%`,height:`${crop.height}%`,border:'3px solid #176b3a',background:'rgba(23,107,58,.12)',boxSizing:'border-box',pointerEvents:'none'}}/>}
      </div>
      {crop?<div style={{marginTop:10,display:'flex',gap:7,flexWrap:'wrap'}}><StatusPill tone={valid?'good':'warn'}>x {crop.x}% · y {crop.y}%</StatusPill><StatusPill tone={valid?'good':'warn'}>{crop.width}% × {crop.height}%</StatusPill>{!valid&&<span style={{fontSize:12,color:'#b54708'}}>وسّع المستطيل حتى 5% على الأقل.</span>}</div>:<div style={{fontSize:12,color:'#667085',marginTop:8}}>لم تحدد منطقة بعد.</div>}
      <div style={{marginTop:12}}><ButtonRow><ActionButton disabled={!valid||busy} onClick={()=>void createCrop()}>{busy?'جارٍ إنشاء الشكل…':'3 · إنشاء Figure Crop'}</ActionButton><ActionButton tone="secondary" onClick={()=>{setStart(null);setEnd(null);}}>إعادة التحديد</ActionButton></ButtonRow></div>
    </Card>}

    <Card><SectionHeader title="بعد القص" description="الـCrop الجديد لا يظهر للطالب مباشرة. راجعه أولًا، أضف Alt Text/Caption/Hotspots، ثم CLEARED إذا كانت حقوق الاستخدام تسمح."/><ButtonRow><ActionLink href={lessonId?`/admin/visual-assets?lesson_id=${lessonId}`:'/admin/visual-assets'}>مراجعة الأصول البصرية</ActionLink><ActionLink href="/admin/current-semester" tone="secondary">الفصل الحالي</ActionLink></ButtonRow></Card>
  </AdminShell>;
}
