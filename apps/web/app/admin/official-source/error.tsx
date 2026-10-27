'use client';

export default function ErrorBoundary({reset}:{reset:()=>void}){
  return <div dir="rtl" style={{padding:24,fontFamily:'system-ui'}}>
    <h2>تعذر فتح مسار المصدر الرسمي</h2>
    <button onClick={reset} style={{padding:'10px 14px'}}>إعادة المحاولة</button>
  </div>;
}
