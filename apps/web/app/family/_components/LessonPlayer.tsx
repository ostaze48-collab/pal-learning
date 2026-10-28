'use client';

import {useEffect,useMemo,useState} from 'react';
import type {FamilyLesson,StudentProfile} from '../../../lib/familyLearning';

type Props={lesson:FamilyLesson;student:StudentProfile};

type SavedProgress={score:number;completed:boolean;updatedAt:string};

export default function LessonPlayer({lesson,student}:Props){
  const [stage,setStage]=useState<'learn'|'quiz'|'result'>('learn');
  const [step,setStep]=useState(0);
  const [question,setQuestion]=useState(0);
  const [answers,setAnswers]=useState<Record<number,number>>({});
  const [feedback,setFeedback]=useState('');
  const [saved,setSaved]=useState<SavedProgress|null>(null);
  const storageKey=`family-learning:${student.slug}:${lesson.slug}`;

  useEffect(()=>{
    try{
      const raw=localStorage.getItem(storageKey);
      if(raw)setSaved(JSON.parse(raw));
    }catch{}
  },[storageKey]);

  const correctCount=useMemo(()=>lesson.questions.reduce((n,q,i)=>n+(answers[i]===q.answer?1:0),0),[answers,lesson.questions]);
  const score=Math.round((correctCount/lesson.questions.length)*100);

  function choose(choice:number){
    if(answers[question]!==undefined)return;
    const q=lesson.questions[question];
    setAnswers((prev)=>({...prev,[question]:choice}));
    setFeedback(choice===q.answer?`✅ صحيح — ${q.explanation}`:`💡 ليست الإجابة الصحيحة. ${q.explanation}`);
  }

  function nextQuestion(){
    setFeedback('');
    if(question<lesson.questions.length-1){setQuestion((q)=>q+1);return;}
    const finalCorrect=lesson.questions.reduce((n,q,i)=>n+((answers[i]??(i===question?answers[question]:-1))===q.answer?1:0),0);
    const finalScore=Math.round((finalCorrect/lesson.questions.length)*100);
    const progress:SavedProgress={score:finalScore,completed:true,updatedAt:new Date().toISOString()};
    try{localStorage.setItem(storageKey,JSON.stringify(progress));}catch{}
    setSaved(progress);
    setStage('result');
  }

  function restart(){
    setStage('learn');setStep(0);setQuestion(0);setAnswers({});setFeedback('');
  }

  const currentStep=lesson.steps[step];
  const currentQuestion=lesson.questions[question];

  return <main style={{minHeight:'100vh',background:'#f7f8fb',color:'#14213d'}}>
    <div style={{maxWidth:760,margin:'0 auto',padding:'18px 14px 50px'}}>
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,marginBottom:14}}>
        <a href={`/family/${student.slug}`} style={{textDecoration:'none',fontWeight:900,color:'#14213d'}}>← {student.name}</a>
        <div style={{fontSize:12,color:'#667085'}}>{lesson.subject} · {lesson.estimatedMinutes} دقيقة</div>
      </header>

      <section style={{background:`linear-gradient(135deg,${student.soft},#fff)`,border:'1px solid #e6eaf0',borderRadius:22,padding:18,marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:900,color:student.accent}}>{student.gradeLabel} · الفصل الأول</div>
        <h1 style={{fontSize:'clamp(27px,7vw,40px)',margin:'7px 0 5px'}}>{lesson.title}</h1>
        <div style={{color:'#667085',lineHeight:1.7}}>{lesson.subtitle}</div>
        {saved?.completed&&<div style={{display:'inline-block',marginTop:10,padding:'6px 10px',borderRadius:999,background:'#eef9f1',color:'#176b3a',fontSize:12,fontWeight:900}}>آخر نتيجة محفوظة: {saved.score}%</div>}
      </section>

      {stage==='learn'&&<>
        <section style={{background:'#fff',border:'1px solid #e6eaf0',borderRadius:20,padding:18}}>
          <div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'center',marginBottom:14}}><strong>التعلم</strong><span style={{fontSize:12,color:'#667085'}}>{step+1} / {lesson.steps.length}</span></div>
          <div style={{height:8,borderRadius:99,background:'#edf0f4',overflow:'hidden',marginBottom:18}}><div style={{height:'100%',width:`${((step+1)/lesson.steps.length)*100}%`,background:student.accent,borderRadius:99}}/></div>
          <h2 style={{margin:'0 0 10px',fontSize:24}}>{currentStep.title}</h2>
          <p style={{fontSize:17,lineHeight:1.9,color:'#384657',margin:'0 0 14px'}}>{currentStep.body}</p>
          {currentStep.example&&<div style={{padding:14,borderRadius:15,background:student.soft,border:`1px solid ${student.accent}22`,fontWeight:850,lineHeight:1.8}}>{currentStep.example}</div>}
          <div style={{display:'flex',justifyContent:'space-between',gap:8,marginTop:20}}>
            <button onClick={()=>setStep((s)=>Math.max(0,s-1))} disabled={step===0} style={buttonStyle('#fff','#14213d',step===0)}>السابق</button>
            {step<lesson.steps.length-1?<button onClick={()=>setStep((s)=>s+1)} style={buttonStyle(student.accent,'#fff',false)}>التالي</button>:<button onClick={()=>setStage('quiz')} style={buttonStyle(student.accent,'#fff',false)}>ابدئي الاختبار</button>}
          </div>
        </section>

        <section style={{marginTop:12,background:'#fff',border:'1px solid #e6eaf0',borderRadius:18,padding:16}}><div style={{fontSize:12,color:'#667085',fontWeight:900,marginBottom:8}}>مهارات هذا الدرس</div><div style={{display:'flex',gap:7,flexWrap:'wrap'}}>{lesson.skills.map((skill)=><span key={skill} style={{padding:'6px 9px',borderRadius:999,background:'#f3f5f8',fontSize:12,fontWeight:800}}>{skill}</span>)}</div></section>
      </>}

      {stage==='quiz'&&<section style={{background:'#fff',border:'1px solid #e6eaf0',borderRadius:20,padding:18}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}><strong>اختبار الإتقان</strong><span style={{fontSize:12,color:'#667085'}}>{question+1} / {lesson.questions.length}</span></div>
        <div style={{height:8,borderRadius:99,background:'#edf0f4',overflow:'hidden',marginBottom:20}}><div style={{height:'100%',width:`${((question+1)/lesson.questions.length)*100}%`,background:student.accent}}/></div>
        <h2 style={{fontSize:23,lineHeight:1.7,margin:'0 0 14px'}}>{currentQuestion.prompt}</h2>
        <div style={{display:'grid',gap:9}}>{currentQuestion.choices.map((choice,i)=>{
          const answered=answers[question]!==undefined;
          const selected=answers[question]===i;
          const correct=answered&&i===currentQuestion.answer;
          const bg=correct?'#eef9f1':selected?'#fff1f1':'#fafbfc';
          const border=correct?'#65b77c':selected?'#e29393':'#e3e7ed';
          return <button key={choice} onClick={()=>choose(i)} disabled={answered} style={{textAlign:'right',padding:'13px 14px',borderRadius:14,border:`1px solid ${border}`,background:bg,color:'#14213d',fontSize:16,fontWeight:800,cursor:answered?'default':'pointer'}}>{choice}</button>;
        })}</div>
        {feedback&&<div style={{marginTop:14,padding:13,borderRadius:13,background:'#f6f8fb',lineHeight:1.7}}>{feedback}</div>}
        {answers[question]!==undefined&&<div style={{marginTop:15,display:'flex',justifyContent:'flex-end'}}><button onClick={nextQuestion} style={buttonStyle(student.accent,'#fff',false)}>{question===lesson.questions.length-1?'عرض النتيجة':'السؤال التالي'}</button></div>}
      </section>}

      {stage==='result'&&<section style={{background:'#fff',border:'1px solid #e6eaf0',borderRadius:22,padding:22,textAlign:'center'}}>
        <div style={{fontSize:48}}>{score>=85?'🌟':score>=70?'👏':'🌱'}</div>
        <h2 style={{fontSize:29,margin:'8px 0'}}>أحسنتِ يا {student.name}</h2>
        <div style={{fontSize:44,fontWeight:950,color:student.accent}}>{score}%</div>
        <p style={{color:'#667085',lineHeight:1.8}}>{score>=85?'أتقنتِ الدرس بشكل ممتاز.':score>=70?'أداء جيد، وسنضيف مراجعة قصيرة لاحقًا.':'نحتاج مراجعة قصيرة للمفهوم ثم محاولة جديدة.'}</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:9,margin:'18px 0'}}><div style={{padding:13,borderRadius:14,background:'#f7f8fb'}}><strong style={{fontSize:23}}>{correctCount}</strong><div style={{fontSize:12,color:'#667085'}}>إجابات صحيحة</div></div><div style={{padding:13,borderRadius:14,background:'#f7f8fb'}}><strong style={{fontSize:23}}>{lesson.questions.length}</strong><div style={{fontSize:12,color:'#667085'}}>إجمالي الأسئلة</div></div></div>
        <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap'}}><button onClick={restart} style={buttonStyle('#fff','#14213d',false)}>إعادة الدرس</button><a href={`/family/${student.slug}`} style={{...buttonStyle(student.accent,'#fff',false),textDecoration:'none',display:'inline-flex',alignItems:'center'}}>العودة للخطة</a></div>
      </section>}
    </div>
  </main>;
}

function buttonStyle(background:string,color:string,disabled:boolean):React.CSSProperties{
  return {border:'1px solid #dfe4ea',background,color,padding:'11px 15px',borderRadius:12,fontWeight:900,fontSize:14,cursor:disabled?'not-allowed':'pointer',opacity:disabled?.55:1};
}
