import type {Lesson} from './data';
import type {TeachingMode} from './teachingProfile';
import {chooseVisualStrategy} from './visualTeaching';

export type TeacherSupportLevel='rebuild'|'guided'|'independent'|'stretch';
export type TeacherPace='slow'|'steady'|'fast';
export type TeacherSessionPlan={
  level:TeacherSupportLevel;
  pace:TeacherPace;
  entryMode:TeachingMode;
  chunkLimit:number;
  explanationDepth:'foundation'|'grade_level'|'extended';
  activityIntensity:'guided'|'balanced'|'challenge';
  visualStrategy:string;
  visualLabel:string;
  focus:string;
  sessionSequence:string[];
  transitionRule:string;
  reteachRule:string;
  teacherTalkRule:string;
  reason:string;
};

export type TeacherBrainInput={
  diagnosticCorrect?:boolean;
  subjectMastery?:number|null;
  weakestScore?:number|null;
  conceptSuccess?:number|null;
  preferredMode?:TeachingMode;
  lastUnderstanding?:'understood'|'partial'|'misconception'|string|null;
};

function finite(value:unknown){return Number.isFinite(Number(value))?Number(value):null}

export function buildTeacherSessionPlan(lesson:Lesson,input:TeacherBrainInput={}):TeacherSessionPlan{
  const mastery=finite(input.subjectMastery);
  const weakest=finite(input.weakestScore);
  const concept=finite(input.conceptSuccess);
  const diagnosticWrong=input.diagnosticCorrect===false;
  const misconception=input.lastUnderstanding==='misconception';
  const partial=input.lastUnderstanding==='partial';
  const severe=diagnosticWrong||misconception||(weakest!==null&&weakest<50)||(concept!==null&&concept<45)||(mastery!==null&&mastery<50);
  const support=severe||partial||(weakest!==null&&weakest<80)||(concept!==null&&concept<75)||(mastery!==null&&mastery<75);
  const strong=!support&&(mastery===null||mastery>=85)&&(concept===null||concept>=80);
  const veryStrong=strong&&(mastery===null||mastery>=92)&&(concept===null||concept>=90);
  const level:TeacherSupportLevel=severe?'rebuild':support?'guided':veryStrong?'stretch':'independent';
  const pace:TeacherPace=level==='rebuild'?'slow':level==='guided'?'steady':level==='stretch'?'fast':'steady';
  const preferred=input.preferredMode&&input.preferredMode!=='check'?input.preferredMode:undefined;
  let entryMode:TeachingMode=preferred||'overview';
  if(level==='rebuild')entryMode=preferred==='step_by_step'?'step_by_step':'simplify';
  else if(level==='guided')entryMode=preferred||'step_by_step';
  else if(level==='stretch'&&(!preferred||preferred==='simplify'||preferred==='step_by_step'))entryMode='deep';
  const visual=chooseVisualStrategy(lesson);
  const subject=lesson.subject;
  let focus='فهم الفكرة ثم تطبيقها باستقلال';
  let sequence=['استرجاع قصير','شرح مركز','تجربة أو تمثيل','تفسير الطالبة','تطبيق مستقل'];
  if(subject==='الرياضيات'){
    focus=level==='rebuild'?'بناء معنى العملية أو العلاقة قبل الرموز':'استخدام العلاقة الرياضية في مثال جديد لا يشبه المثال المحلول تمامًا';
    sequence=level==='rebuild'?['معنى محسوس أو سياق','تمثيل بصري','ربط بالرمز','مثال محلول مع سبب كل خطوة','مختبر قصير','تفسير الطالبة','مسألة جديدة']:['استرجاع','مثال قصير','مختبر/نموذج','تفسير','مسألة نقل تعلم'];
  }else if(subject==='العلوم والحياة'){
    focus='التمييز بين الملاحظة والدليل والتفسير وربط السبب بالنتيجة';
    sequence=['ظاهرة أو موقف','توقع','محاكاة/دليل','ملاحظة','تفسير الطالبة','تطبيق أو مثال مضاد'];
  }else if(subject==='اللغة العربية'){
    focus='فهم المعنى والسياق أولًا ثم اكتشاف النمط أو القاعدة وإنتاج مثال جديد';
    sequence=['سياق مفهوم','مفردة/معنى عند الحاجة','ملاحظة النمط','تسمية القاعدة','بناء/تصنيف','إنتاج الطالبة'];
  }else if(subject==='English'){
    focus='Comprehensible input ثم ملاحظة النمط واستخدامه في إنتاج قصير';
    sequence=['Meaning first','Model sentence','Notice the pattern','Interactive practice','Short production','Feedback'];
  }
  const chunkLimit=level==='rebuild'?1:level==='guided'?2:level==='stretch'?3:2;
  const explanationDepth=level==='rebuild'?'foundation':level==='stretch'?'extended':'grade_level';
  const activityIntensity=level==='rebuild'?'guided':level==='stretch'?'challenge':'balanced';
  const transitionRule=level==='rebuild'?'لا تنتقل إلى فكرة جديدة حتى تظهر الطالبة فهمًا في مثال أو تفسير قصير.':level==='stretch'?'إذا نجحت الطالبة بسرعة، انتقل إلى مثال نقل تعلم أو سؤال لماذا بدل تكرار التدريب نفسه.':'انتقل بعد دليل فهم واحد على الأقل، لا بعد القراءة فقط.';
  const reteachRule='إذا لم تصل الفكرة، لا تكرر نفس النص: صغّر المثال، غيّر التمثيل، ثم اختبر الفهم بسؤال جديد مختلف.';
  const teacherTalkRule=level==='rebuild'?'فكرة واحدة في كل مرة، ثم فعل من الطالبة. تجنب الفقرات الطويلة.':level==='stretch'?'اختصر الشرح المباشر وامنح مساحة أكبر للاكتشاف والتفسير والتحدي.':'قسّم الشرح إلى وحدات قصيرة، وبين كل وحدتين محاولة أو سؤال.';
  const reason=level==='rebuild'?'هناك إشارة أن الأساس غير ثابت؛ نعيد بناء النقطة الضرورية فقط ثم نعود لدرس الصف الحالي.':level==='guided'?'الفهم موجود جزئيًا؛ نستخدم دعمًا تدريجيًا ثم نسحبه مع النجاح.':level==='stretch'?'الأداء قوي؛ نقلل الشرح ونزيد الاستنتاج والتحدي ونقل التعلم.':'الأساس مناسب؛ نمزج شرحًا مركزًا مع تطبيق مستقل.';
  return {level,pace,entryMode,chunkLimit,explanationDepth,activityIntensity,visualStrategy:visual.strategy,visualLabel:visual.label,focus,sessionSequence:sequence,transitionRule,reteachRule,teacherTalkRule,reason};
}

export function reviseTeacherSessionPlan(plan:TeacherSessionPlan,signal:{conceptCorrect?:boolean;understanding?:'understood'|'partial'|'misconception'}):TeacherSessionPlan{
  if(signal.understanding==='misconception'||signal.conceptCorrect===false){
    return {...plan,level:'rebuild',pace:'slow',entryMode:'step_by_step',chunkLimit:1,explanationDepth:'foundation',activityIntensity:'guided',transitionRule:'أوقف التقدم مؤقتًا، غيّر التمثيل، ثم اطلب دليل فهم جديد قبل الانتقال.',reason:'ظهرت إشارة مباشرة أثناء الجلسة أن الفكرة لم تثبت؛ نعيد التدريس بطريقة مختلفة.'};
  }
  if(signal.understanding==='partial')return {...plan,level:'guided',pace:'steady',entryMode:'step_by_step',chunkLimit:1,activityIntensity:'guided',reason:'الإجابة جزئية؛ نثبت نقطة واحدة فقط ثم نعيد التحقق.'};
  if(signal.understanding==='understood'||signal.conceptCorrect===true)return {...plan,pace:plan.level==='rebuild'?'steady':'fast',activityIntensity:plan.level==='stretch'?'challenge':'balanced',transitionRule:'ظهرت علامة فهم؛ انتقل إلى تطبيق جديد أو تحدٍ صغير بدل تكرار الشرح.',reason:'أظهرت الطالبة فهمًا؛ نرفع الاستقلالية تدريجيًا.'};
  return plan;
}
