'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {lessons} from '../../../lib/data';
import styles from './UXDashboard.module.css';

type Filter='all'|'salma'|'sama';
type Row={lessonId:string;title:string;student:string;subject:string;phaseViews:number;helps:number;readAlouds:number;quizErrors:number;evidenceErrors:number;visualInteractions:number;visualScenes:number;unusedVisuals:number;time:number;completed:boolean;lastPhase:string;bottleneckPhase:string;primaryIssue:string;friction:number};

function readJson(key:string){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):null}catch{return null}}
function phaseLabel(phase:string){return phase==='discover'?'الاكتشاف':phase==='build'?'بناء الفكرة':phase==='practice'?'التجربة':phase==='quiz'?'التحدي':phase==='gap'?'الجسر القصير':phase==='remediate'?'الطريقة الثانية':phase==='retest'?'المحاولة الجديدة':phase||'—'}

export default function UXDashboard(){
 const [rows,setRows]=useState<Row[]>([]);const [filter,setFilter]=useState<Filter>('all');
 useEffect(()=>{
  function scan(){
   const next:Row[]=[];
   for(const lesson of lessons){
    const events=readJson(`lessonUx:${lesson.id}`);if(!Array.isArray(events)||!events.length)continue;
    const report=readJson(`lesson:${lesson.id}:report`);
    const phaseEvents=events.filter((e:any)=>e?.event==='phase_view'&&typeof e?.phase==='string');
    const phaseViews=phaseEvents.length;
    const phaseCounts=new Map<string,number>();for(const e of phaseEvents)phaseCounts.set(e.phase,(phaseCounts.get(e.phase)||0)+1);
    const bottleneck=[...phaseCounts.entries()].sort((a,b)=>b[1]-a[1])[0];
    const bottleneckPhase=bottleneck&&bottleneck[1]>1?phaseLabel(bottleneck[0]):'—';
    const helps=events.filter((e:any)=>e?.event==='smart_help'||e?.event==='practice_hint').length;
    const readAlouds=events.filter((e:any)=>e?.event==='scene_read_aloud').length;
    const quizErrors=events.filter((e:any)=>e?.event==='quiz_answer'&&e?.correct===false).length;
    const evidenceErrors=events.filter((e:any)=>(e?.event==='objective_evidence'||e?.event==='transfer_evidence')&&e?.correct===false).length;
    const sceneKey=(e:any)=>`${e?.objectiveId??'?'}:${e?.teachingSceneNumber??e?.scene??'?'}`;
    const visualSceneKeys=new Set(events.filter((e:any)=>e?.event==='teaching_scene_view'&&e?.hasVisual===true).map(sceneKey));
    const visualInteractionKeys=new Set(events.filter((e:any)=>e?.event==='teaching_visual_interaction').map(sceneKey));
    const visualScenes=visualSceneKeys.size;const visualInteractions=visualInteractionKeys.size;
    const unusedVisuals=[...visualSceneKeys].filter(key=>!visualInteractionKeys.has(key)).length;
    const lastPhase=[...events].reverse().find((e:any)=>typeof e?.phase==='string')?.phase||'—';
    const time=Number(report?.timeSeconds||localStorage.getItem(`lesson:${lesson.id}:timeSeconds`)||0);
    const completed=Boolean(report)||localStorage.getItem(`lesson:${lesson.id}`)==='done';
    const repeated=[...phaseCounts.values()].reduce((sum,count)=>sum+Math.max(0,count-1),0);
    const friction=helps*2+quizErrors+evidenceErrors*2+Math.min(3,repeated)+(completed?0:3)+Math.min(3,unusedVisuals);
    const primaryIssue=!completed?`توقف قبل الإكمال عند ${phaseLabel(lastPhase)}`:evidenceErrors>=2?'تعثر في الفهم أو التطبيق':helps>=2?'احتاج مساندة أكثر من مرة':unusedVisuals>=2?'نماذج ظهرت ولم تُستخدم':repeated>=2?'تكرار أو رجوع بين المراحل':'لا يوجد نمط احتكاك واضح';
    next.push({lessonId:lesson.id,title:lesson.title,student:lesson.student,subject:lesson.subject,phaseViews,helps,readAlouds,quizErrors,evidenceErrors,visualInteractions,visualScenes,unusedVisuals,time,completed,lastPhase,bottleneckPhase,primaryIssue,friction});
   }
   next.sort((a,b)=>b.friction-a.friction||b.time-a.time);setRows(next);
  }
  scan();const timer=window.setInterval(scan,1500);return()=>window.clearInterval(timer);
 },[]);
 const visible=useMemo(()=>filter==='all'?rows:rows.filter(x=>x.student===filter),[rows,filter]);
 const incomplete=visible.filter(x=>!x.completed).length;const high=visible.filter(x=>x.friction>=6).length;const helps=visible.reduce((s,x)=>s+x.helps,0);const readAlouds=visible.reduce((s,x)=>s+x.readAlouds,0);const unusedVisuals=visible.reduce((s,x)=>s+x.unusedVisuals,0);const avgTime=visible.length?Math.round(visible.reduce((s,x)=>s+x.time,0)/visible.length/60):0;
 function status(row:Row){if(row.friction>=6)return {label:'احتكاك مرتفع',cls:styles.high};if(row.friction>=3)return {label:'راقبيه',cls:styles.medium};return {label:'سلس',cls:styles.good}}
 return <main className={styles.page}><div className={styles.wrap}>
  <header className={styles.head}><div><span className={styles.tag}>Child Testing Mode · داخلي</span><h1>أين تتعثر تجربة سما وسلمى؟</h1><p>نقرأ سلوك الاستخدام على هذا الجهاز: استخدام النماذج التفاعلية، طلب المساعدة، الأخطاء، وعدم إكمال الرحلة. الهدف تحسين الواجهة والشرح، لا تقييم الطفلة.</p></div><Link href="/admin/quality" className={styles.tag}>جودة المحتوى ←</Link></header>
  <section className={styles.summary}><div className={styles.metric}><strong>{visible.length}</strong><span>دروس لها بيانات استخدام</span></div><div className={styles.metric}><strong>{high}</strong><span>احتكاك مرتفع</span></div><div className={styles.metric}><strong>{unusedVisuals}</strong><span>مشاهد ظهرت ولم تُستخدم</span></div><div className={styles.metric}><strong>{helps}</strong><span>طلبات مساعدة</span></div><div className={styles.metric}><strong>{readAlouds}</strong><span>استخدام القراءة الصوتية</span></div><div className={styles.metric}><strong>{avgTime}</strong><span>دقائق وسطية تقريبًا</span></div></section>
  <section className={styles.panel}><div className={styles.toolbar}><div className={styles.filters}><button className={`${styles.filter} ${filter==='all'?styles.active:''}`} onClick={()=>setFilter('all')}>الكل</button><button className={`${styles.filter} ${filter==='salma'?styles.active:''}`} onClick={()=>setFilter('salma')}>سلمى · صف 5</button><button className={`${styles.filter} ${filter==='sama'?styles.active:''}`} onClick={()=>setFilter('sama')}>سما · صف 7</button></div><span className={styles.note}>غير مكتمل: {incomplete} · الأعلى احتكاكًا يظهر أولًا</span></div>
   <div className={styles.hint}>نفرّق الآن بين تعثر الفهم، الحاجة للمساعدة، الرجوع بين المراحل، والمشهد البصري الذي ظهر ولم يُستخدم. القراءة الصوتية إشارة وصول/تصميم وليست علامة ضعف.</div>
  </section>
  <section className={styles.panel}>{visible.length?<div className={styles.rows}>{visible.map(row=>{const s=status(row);return <div className={styles.row} key={row.lessonId}><div className={styles.lesson}><Link href={`/lesson/${row.lessonId}`}><strong>{row.title}</strong></Link><small>{row.student==='salma'?'سلمى':'سما'} · {row.subject} · {row.primaryIssue}</small><small>أكثر مرحلة تكررت: {row.bottleneckPhase} · تفاعل بصري {row.visualInteractions}/{row.visualScenes} · غير مستخدم {row.unusedVisuals} · استماع {row.readAlouds}</small></div><div className={styles.number}><strong>{row.helps}</strong><small>مساعدة</small></div><div className={styles.number}><strong>{row.quizErrors}</strong><small>خطأ اختبار</small></div><div className={styles.number}><strong>{row.evidenceErrors}</strong><small>دليل تعثر</small></div><div className={styles.number}><strong>{row.time?Math.max(1,Math.round(row.time/60)):'—'}</strong><small>دقيقة</small></div><div><span className={`${styles.status} ${s.cls}`}>{s.label}</span></div></div>})}</div>:<div className={styles.empty}>لا توجد بيانات تجربة على هذا الجهاز بعد. افتحي درسًا وجربي الرحلة ثم عودي هنا.</div>}</section>
 </div></main>;
}
