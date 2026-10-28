export type ExplicitEvidenceSpec={
 objectiveId:number;
 kind:'recognize'|'apply'|'explain'|'construct'|'compare'|'correct_error';
 interaction:'choice'|'short_text'|'match'|'order';
 prompt:string;
 questionId?:string;
 quality:'direct';
 pairs?:Array<{item:string;target:string}>;
 targets?:string[];
 orderItems?:string[];
};

const specs:Record<string,ExplicitEvidenceSpec[]>={
 'g5-science-cell-types':[
  {
   objectiveId:1,kind:'recognize',interaction:'choice',quality:'direct',questionId:'q1',
   prompt:'اختاري الوحدة الأساسية التي تُبنى منها أجسام الكائنات الحية.'
  },
  {
   objectiveId:2,kind:'compare',interaction:'match',quality:'direct',
   prompt:'صنّفي هذه الأجزاء: هل تظهر في الخلية النباتية فقط أم في النباتية والحيوانية؟',
   targets:['في الخلية النباتية فقط','في النباتية والحيوانية'],
   pairs:[
    {item:'البلاستيدات الخضراء',target:'في الخلية النباتية فقط'},
    {item:'الجدار الخلوي',target:'في الخلية النباتية فقط'},
    {item:'النواة',target:'في النباتية والحيوانية'},
    {item:'الغشاء الخلوي',target:'في النباتية والحيوانية'}
   ]
  },
  {
   objectiveId:3,kind:'apply',interaction:'match',quality:'direct',
   prompt:'اربطي كل جزء بوظيفته الأساسية.',
   targets:['يحيط بالخلية','يتحكم في كثير من أنشطة الخلية','توجد فيه مكونات الخلية'],
   pairs:[
    {item:'الغشاء الخلوي',target:'يحيط بالخلية'},
    {item:'النواة',target:'يتحكم في كثير من أنشطة الخلية'},
    {item:'السيتوبلازم',target:'توجد فيه مكونات الخلية'}
   ]
  },
  {
   objectiveId:4,kind:'explain',interaction:'short_text',quality:'direct',questionId:'q4',
   prompt:'رأيتِ خلية فيها جدار خلوي وبلاستيدات خضراء وفجوة عصارية كبيرة. ما نوعها؟ اكتبي السبب باختصار.'
  }
 ]
};

export function getExplicitEvidenceSpecs(lessonId:string){return specs[lessonId]||null}
