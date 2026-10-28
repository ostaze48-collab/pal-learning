import type {Lesson} from './data';
import {chooseVisualStrategy} from './visualTeaching';

export type ExperienceKind='slides'|'puzzle'|'game'|'experiment'|'story'|'challenge'|'sort';
export type ExperiencePlan={
  primary:ExperienceKind;
  secondary:ExperienceKind;
  label:string;
  icon:string;
  reason:string;
  intensity:'guided'|'balanced'|'challenge';
  visualLabel:string;
};

function lessonText(lesson:Lesson){return [lesson.title,lesson.summary,...lesson.learningPoints,lesson.example].join(' ').toLowerCase()}

export function chooseLessonExperience(lesson:Lesson,diagnosticCorrect:boolean,subjectMastery?:number|null):ExperiencePlan{
  const visual=chooseVisualStrategy(lesson);
  const text=lessonText(lesson);
  const mastery=Number.isFinite(Number(subjectMastery))?Number(subjectMastery):null;
  const needsSupport=!diagnosticCorrect||(mastery!==null&&mastery<65);
  const strong=diagnosticCorrect&&(mastery===null||mastery>=80);
  let primary:ExperienceKind='slides';
  let secondary:ExperienceKind='challenge';

  if(lesson.subject==='العلوم والحياة'){
    primary=needsSupport?'slides':'experiment';
    secondary=text.includes('مقارنة')||text.includes('نوع')?'sort':'puzzle';
  }else if(lesson.subject==='الرياضيات'){
    primary=needsSupport?'slides':strong?'puzzle':'game';
    secondary=visual.strategy==='sequence'?'game':'challenge';
  }else if(lesson.subject==='English'||lesson.subject==='اللغة العربية'){
    primary=needsSupport?'slides':text.includes('قراءة')||text.includes('reading')?'story':'sort';
    secondary=strong?'challenge':'game';
  }

  const labels:Record<ExperienceKind,[string,string]>={
    slides:['عرض مصور قصير','🖼️'],puzzle:['لغز الفكرة','🧩'],game:['لعبة تعلم','🎮'],experiment:['تجربة وتوقع','🧪'],story:['قصة أو موقف','📚'],challenge:['تحدي ذكي','🏁'],sort:['رتّبي وصنّفي','🧲']
  };
  const [label,icon]=labels[primary];
  return {primary,secondary,label,icon,reason:needsSupport?'سنبدأ بطريقة موجهة تخفف الحمل وتبني الفكرة خطوة خطوة.':strong?'الأساس جيد؛ الأفضل أن نبني الفهم بالمحاولة وحل مشكلة بدل شرح أطول.':'سنمزج شرحًا قصيرًا مع نشاط يثبت الفكرة.',intensity:needsSupport?'guided':strong?'challenge':'balanced',visualLabel:visual.label};
}
