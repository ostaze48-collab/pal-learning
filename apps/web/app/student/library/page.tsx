'use client';

import {useEffect,useState} from 'react';
import {apiJson} from '../../../lib/api';
import {BottomNav,Notice,Pill,PrimaryLink,StudentCard,StudentShell} from '../_components/StudentUI';

type Book={id:number;book_code:string;title:string;semester:number;edition:string|null};
type Unit={id:number;unit_number:number;title:string};
type Lesson={id:number;lesson_code:string;lesson_number:number;title:string;status:string;estimated_minutes:number};

export default function StudentLibrary(){
  const [books,setBooks]=useState<Book[]>([]);
  const [units,setUnits]=useState<Unit[]>([]);
  const [lessons,setLessons]=useState<Lesson[]>([]);
  const [bookId,setBookId]=useState<number|null>(null);
  const [unitId,setUnitId]=useState<number|null>(null);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(true);
  const [loadingUnits,setLoadingUnits]=useState(false);
  const [loadingLessons,setLoadingLessons]=useState(false);

  useEffect(()=>{
    if(!localStorage.getItem('pal_student_token')){setError('يجب تسجيل الدخول كطالب لعرض الدروس المنشورة.');setLoading(false);return;}
    apiJson<Book[]>('/curriculum/books',{},true).then(rows=>{
      const ordered=[...rows].sort((a,b)=>(a.semester-b.semester)||a.title.localeCompare(b.title,'ar'));
      setBooks(ordered);
      if(ordered.length)setBookId(ordered[0].id);
    }).catch(e=>setError(e.message||'تعذر تحميل الكتب')).finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{
    if(bookId===null){setUnits([]);setUnitId(null);return;}
    setLoadingUnits(true);setUnits([]);setLessons([]);setUnitId(null);
    apiJson<Unit[]>(`/curriculum/books/${bookId}/units`,{},true).then(rows=>{
      setUnits(rows);
      if(rows.length)setUnitId(rows[0].id);
    }).catch(e=>setError(e.message||'تعذر تحميل الوحدات')).finally(()=>setLoadingUnits(false));
  },[bookId]);

  useEffect(()=>{
    if(unitId===null){setLessons([]);return;}
    setLoadingLessons(true);setLessons([]);
    apiJson<Lesson[]>(`/curriculum/units/${unitId}/lessons`,{},true).then(setLessons).catch(e=>setError(e.message||'تعذر تحميل الدروس')).finally(()=>setLoadingLessons(false));
  },[unitId]);

  const selectedBook=books.find(x=>x.id===bookId)||null;
  const selectedUnit=units.find(x=>x.id===unitId)||null;

  return <StudentShell title="المكتبة التعليمية" subtitle="الدروس المنشورة والمعتمدة المتاحة لحساب الطالب" backHref="/student">
    {error&&<div style={{marginBottom:14}}><Notice tone="warn">{error}{error.includes('تسجيل الدخول')&&<div style={{marginTop:10}}><PrimaryLink href="/student/login">دخول الطالب</PrimaryLink></div>}</Notice></div>}
    {loading&&<Notice>جارٍ تحميل الكتب المتاحة…</Notice>}

    {!loading&&books.length===0&&!error&&<Notice tone="info">لا توجد كتب متاحة حاليًا في المكتبة المنشورة. سيظهر المحتوى هنا تلقائيًا عند نشر أول حزمة تعليمية.</Notice>}

    {books.length>0&&<>
      <StudentCard style={{marginBottom:14,background:'linear-gradient(135deg,#f5fbf7,#f5f8ff)'}}>
        <div style={{display:'grid',gap:12}}>
          <div><div style={{fontSize:12,color:'#667085',fontWeight:900,marginBottom:6}}>1 · اختر الكتاب</div><select value={bookId??''} onChange={e=>setBookId(Number(e.target.value))} style={{width:'100%',padding:'12px 13px',borderRadius:12,border:'1px solid #ccd5df',background:'#fff',fontSize:15,fontWeight:800}}>{books.map(book=><option key={book.id} value={book.id}>{book.title} · الفصل {book.semester}</option>)}</select></div>
          <div><div style={{fontSize:12,color:'#667085',fontWeight:900,marginBottom:6}}>2 · اختر الوحدة</div><select value={unitId??''} disabled={loadingUnits||units.length===0} onChange={e=>setUnitId(Number(e.target.value))} style={{width:'100%',padding:'12px 13px',borderRadius:12,border:'1px solid #ccd5df',background:'#fff',fontSize:15,fontWeight:800}}>{loadingUnits&&<option>جارٍ التحميل…</option>}{!loadingUnits&&units.length===0&&<option>لا توجد وحدات</option>}{units.map(unit=><option key={unit.id} value={unit.id}>الوحدة {unit.unit_number}: {unit.title}</option>)}</select></div>
        </div>
      </StudentCard>

      <StudentCard style={{marginBottom:14}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'center',flexWrap:'wrap'}}><div><div style={{fontSize:12,color:'#667085',fontWeight:900}}>المسار الحالي</div><h2 style={{margin:'4px 0 0',fontSize:21}}>{selectedUnit?`الوحدة ${selectedUnit.unit_number}: ${selectedUnit.title}`:'اختر وحدة'}</h2><div style={{fontSize:12,color:'#667085',marginTop:4}}>{selectedBook?.title}</div></div><Pill tone="info">{lessons.length} درس منشور</Pill></div>
      </StudentCard>

      {loadingLessons&&<Notice>جارٍ تحميل الدروس المنشورة…</Notice>}
      {!loadingLessons&&unitId!==null&&lessons.length===0&&<Notice tone="info">لا توجد دروس منشورة في هذه الوحدة بعد. المسودات والمحتوى غير المعتمد لا تظهر للطالب.</Notice>}

      {!loadingLessons&&lessons.length>0&&<div style={{display:'grid',gap:12,paddingBottom:90}}>{lessons.map((lesson,index)=><StudentCard key={lesson.id}>
        <div style={{display:'grid',gridTemplateColumns:'48px minmax(0,1fr)',gap:12,alignItems:'start'}}>
          <div style={{width:46,height:46,borderRadius:14,display:'grid',placeItems:'center',background:index===0?'#176b3a':'#eef4ff',color:index===0?'#fff':'#2459a6',fontWeight:900,fontSize:18}}>{lesson.lesson_number}</div>
          <div><div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'flex-start',flexWrap:'wrap'}}><div><h3 style={{margin:0,fontSize:19,lineHeight:1.6}}>{lesson.title}</h3><div style={{fontSize:12,color:'#667085',marginTop:4}}>{lesson.estimated_minutes||20} دقيقة · {lesson.lesson_code}</div></div><Pill tone="good">منشور</Pill></div><div style={{marginTop:12,display:'flex',gap:8,flexWrap:'wrap'}}><PrimaryLink href={`/student/lesson?lessonId=${lesson.id}`}>فتح الدرس</PrimaryLink><PrimaryLink href="/student/progress" secondary>تقدمي</PrimaryLink></div></div>
        </div>
      </StudentCard>)}</div>}
      <BottomNav active="home"/>
    </>}
  </StudentShell>;
}
