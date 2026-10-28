import type {Lesson} from './data';
import {chooseVisualStrategy} from './visualTeaching';

export type ExperienceKind='slides'|'puzzle'|'game'|'experiment'|'story'|'challenge'|'sort';
export type CognitiveTask='build_model'|'discover_pattern'|'classify'|'sequence'|'cause_effect'|'apply_rule'|'retrieve';
export type ExperiencePlan={
  primary:ExperienceKind;
  secondary:ExperienceKind;
  label:string;
  icon:string;
  reason:string;
  intensity:'guided'|'balanced'|'challenge';
  visualLabel:string;
  task:CognitiveTask;
};

function lessonText(lesson:Lesson){return [lesson.title,lesson.summary,...lesson.learningPoints,lesson.example].join(' ').toLowerCase()}
export function chooseCognitiveTask(lesson:Lesson):CognitiveTask{
  const visual=chooseVisualStrategy(lesson);const text=lessonText(lesson);
  if(['fraction_model','geometry','number_line','factor_tree','concept_map'].includes(visual.strategy))return 'build_model';
  if(visual.strategy==='cause_effect'||/(سبب|نتيجة|تأثير|قوة|ضغط|طاقة|تحول|cause|effect)/i.test(text))return 'cause_effect';
  if(visual.strategy==='compare'||/(صنف|تصنيف|نوع|ميّز|قارن|classif|compare)/i.test(text))return 'classify';
  if(visual.strategy==='sequence'||/(خطوات|رتب|أولًا|ثم|sequence|order)/i.test(text))return 'sequence';
  if(visual.strategy==='sentence_pattern'||visual.strategy==='timeline'||/(قاعدة|فعل|ضمير|زمن|tense|grammar|sentence|pronoun)/i.test(text))return 'apply_rule';
  if(/(نمط|علاقة|اكتشف|pattern|relationship)/i.test(text))return 'discover_pattern';
  return 'retrieve';
}

export function chooseLessonExperience(lesson:Lesson,diagnosticCorrect:boolean,subjectMastery?:number|null,recentCreativeSuccess?:number|null):ExperiencePlan{
  const visual=chooseVisualStrategy(lesson);
  const task=chooseCognitiveTask(lesson);
  const text=lessonText(lesson);
  const mastery=Number.isFinite(Number(subjectMastery))?Number(subjectMastery):null;
  const creative=Number.isFinite(Number(recentCreativeSuccess))?Number(recentCreativeSuccess):null;
  const needsSupport=!diagnosticCorrect||(mastery!==null&&mastery<65)||(creative!==null&&creative<50);
  const strong=diagnosticCorrect&&(mastery===null||mastery>=80)&&(creative===null||creative>=75);
  let primary:ExperienceKind='slides';let secondary:ExperienceKind='challenge';

  if(needsSupport){
    primary=task==='cause_effect'?'experiment':task==='classify'||task==='sequence'?'sort':'slides';
    secondary=task==='apply_rule'?'sort':'game';
  }else if(task==='build_model'){
    primary=strong?'puzzle':'game';secondary='challenge';
  }else if(task==='cause_effect'){
    primary='experiment';secondary=strong?'challenge':'puzzle';
  }else if(task==='classify'||task==='sequence'){
    primary='sort';secondary=strong?'challenge':'game';
  }else if(task==='apply_rule'){
    primary=(lesson.subject==='English'||lesson.subject==='اللغة العربية')?'sort':'game';secondary=strong?'challenge':'story';
  }else if(task==='discover_pattern'){
    primary='puzzle';secondary='challenge';
  }else if(lesson.subject==='English'||lesson.subject==='اللغة العربية'){
    primary=text.includes('قراءة')||text.includes('reading')?'story':'game';secondary='challenge';
  }else{
    primary=strong?'challenge':'game';secondary='slides';
  }

  const labels:Record<ExperienceKind,[string,string]>={slides:['عرض مصور قصير','🖼️'],puzzle:['لغز الفكرة','🧩'],game:['لعبة تعلم','🎮'],experiment:['تجربة وتوقع','🧪'],story:['قصة أو موقف','📚'],challenge:['تحدي ذكي','🏁'],sort:['رتّبي وصنّفي','🧲']};
  const [label,icon]=labels[primary];
  const taskReason:Record<CognitiveTask,string>={build_model:'هذا المفهوم يحتاج بناء نموذج وتحريكه، لا حفظ تعريف فقط.',discover_pattern:'أفضل طريق هنا هو اكتشاف النمط قبل إعطاء القاعدة.',classify:'المهمة الأساسية هي التمييز والتصنيف بين حالات متشابهة.',sequence:'الفهم يعتمد على ترتيب الخطوات وبناء التسلسل.',cause_effect:'الفكرة علمية سببية؛ نبدأ بتوقع ثم دليل ثم تفسير.',apply_rule:'المطلوب استخدام القاعدة في مثال، لا ترديدها فقط.',retrieve:'نثبت الفكرة باسترجاع نشط وتطبيق قصير.'};
  const levelReason=needsSupport?' سنبدأ بطريقة موجهة تخفف الحمل وتبني الفكرة خطوة خطوة.':strong?' أداؤك الأخير قوي، لذلك نرفع مستوى الاكتشاف والتحدي.':' سنمزج شرحًا قصيرًا مع نشاط يثبت الفكرة.';
  return {primary,secondary,label,icon,reason:taskReason[task]+levelReason,intensity:needsSupport?'guided':strong?'challenge':'balanced',visualLabel:visual.label,task};
}
