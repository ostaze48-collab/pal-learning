export type PredictionSpec={
  afterSection:number;
  label:string;
  question:string;
  intro:string;
  options:string[];
  correctIndex:number;
  successTitle:string;
  retryTitle:string;
  explanation:string;
};

export type ConceptMapSpec={
  title:string;
  nodes:Array<{label:string;icon?:string}>;
  narration:string;
};

export type AchievementSpec={
  title:string;
  emoji:string;
  completedText:string;
  lockedText:string;
};

export type ScienceLessonTemplate={
  subjectLabel:string;
  gradeLabel:string;
  internalName:string;
  prediction?:PredictionSpec;
  conceptMap?:ConceptMapSpec;
  achievement:AchievementSpec;
};

const DEFAULT_TEMPLATE:ScienceLessonTemplate={
  subjectLabel:'علوم',
  gradeLabel:'صف خامس',
  internalName:'Science Lesson',
  achievement:{
    title:'مستكشف العلوم',
    emoji:'🏅',
    completedText:'أكملت الدرس والتحدي بنجاح.',
    lockedText:'أكمل تحدي الدرس أولًا حتى تُفتح شارة الإنجاز.',
  },
};

const TEMPLATES:Record<string,ScienceLessonTemplate>={
  'PS.G05.SCI.S1.U01.L01':{
    subjectLabel:'علوم',
    gradeLabel:'صف خامس',
    internalName:'Golden Lesson 001',
    prediction:{
      afterSection:1,
      label:'توقّع قبل أن ترى',
      question:'ماذا يحدث إذا استخدمنا عدستين بدل عدسة واحدة؟',
      intro:'اختر توقعك أولًا. لا توجد عقوبة على الخطأ؛ الهدف أن تفكر مثل العالم قبل التجربة.',
      options:['سنرى تفاصيل أكثر','سيصبح الجسم أصغر','لن يتغير شيء'],
      correctIndex:0,
      successTitle:'توقع ممتاز ✓',
      retryTitle:'فكرة جيدة للتجربة',
      explanation:'استخدام أكثر من عدسة يمكن أن يزيد قدرة الأداة على التكبير ويُظهر تفاصيل أدق. هذه الفكرة كانت من الخطوات المهمة في تطور المجهر.',
    },
    conceptMap:{
      title:'رحلة اكتشاف الخلية في صورة واحدة',
      nodes:[
        {label:'العدسة المكبرة',icon:'🔍'},
        {label:'المجهر',icon:'🔬'},
        {label:'تكبير الأشياء الدقيقة'},
        {label:'فحص الفلين'},
        {label:'روبرت هوك'},
        {label:'الخلايا',icon:'🧫'},
      ],
      narration:'بدأت القصة بالعدسة المكبرة، ثم تطور المجهر، فأصبح العلماء قادرين على تكبير الأشياء الدقيقة. فحص روبرت هوك الفلين بالمجهر وشاهد تراكيب أطلق عليها اسم الخلايا.',
    },
    achievement:{
      title:'مستكشف الخلية',
      emoji:'🏅',
      completedText:'أكملت درس المجهر واكتشاف الخلية. لقد تتبعت رحلة التكبير من العين والعدسة إلى المجهر واكتشاف الخلايا.',
      lockedText:'أكمل تحدي الدرس أولًا حتى تُمنح شارة مستكشف الخلية.',
    },
  },
};

export function getScienceLessonTemplate(lessonCode?:string|null):ScienceLessonTemplate{
  if(!lessonCode)return DEFAULT_TEMPLATE;
  return TEMPLATES[lessonCode]||DEFAULT_TEMPLATE;
}
