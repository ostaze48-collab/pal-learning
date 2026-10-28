export type GapSkill={
  id:string;
  title:string;
  why:string;
  explanation:string;
  examples:string[];
  check:{question:string;options:string[];correct:number;explanation:string}[];
};

export const gapSkills:Record<string,GapSkill>={
  multiplication_facts:{
    id:'multiplication_facts',title:'جدول الضرب',
    why:'هذه المهارة مطلوبة لإيجاد العوامل والتحليل والقسمة بسرعة.',
    explanation:'الضرب هو جمع متكرر. بدل حفظ النتيجة وحدها، اربطي كل حقيقة ضرب بمجموعات متساوية. مثال: 4 × 6 يعني 4 مجموعات، في كل مجموعة 6، والمجموع 24.',
    examples:['3 × 4 = 12','5 × 6 = 30','7 × 8 = 56'],
    check:[
      {question:'ما ناتج 6 × 7؟',options:['36','42','48','56'],correct:1,explanation:'6 مجموعات من 7 تساوي 42.'},
      {question:'ما ناتج 8 × 4؟',options:['24','28','32','36'],correct:2,explanation:'8 × 4 = 32.'},
      {question:'أي عملية ضرب تساوي 45؟',options:['5 × 9','6 × 8','7 × 5','4 × 10'],correct:0,explanation:'5 × 9 = 45.'}
    ]
  },
  division_facts:{
    id:'division_facts',title:'العلاقة بين الضرب والقسمة',
    why:'القسمة تصبح أسهل عندما نستخدم حقيقة الضرب العكسية.',
    explanation:'إذا عرفتِ أن 6 × 7 = 42، فأنتِ تعرفين أيضًا أن 42 ÷ 6 = 7 و42 ÷ 7 = 6.',
    examples:['24 ÷ 6 = 4 لأن 6 × 4 = 24','35 ÷ 5 = 7 لأن 5 × 7 = 35'],
    check:[
      {question:'إذا كان 8 × 6 = 48، فما 48 ÷ 6؟',options:['6','7','8','9'],correct:2,explanation:'العملية العكسية لـ 8 × 6 = 48 هي 48 ÷ 6 = 8.'},
      {question:'ما ناتج 54 ÷ 9؟',options:['5','6','7','8'],correct:1,explanation:'9 × 6 = 54.'}
    ]
  },
  factors:{
    id:'factors',title:'العوامل والقابلية للقسمة',
    why:'العدد الأولي والتحليل إلى عوامل أولية وع.م.أ تعتمد كلها على فهم العوامل.',
    explanation:'العامل هو عدد يقسم عددًا آخر دون باقٍ. نبحث عن أزواج الضرب التي تعطي العدد.',
    examples:['عوامل 12: 1، 2، 3، 4، 6، 12','عوامل 15: 1، 3، 5، 15'],
    check:[
      {question:'أي عدد عامل للعدد 18؟',options:['4','5','6','7'],correct:2,explanation:'18 ÷ 6 = 3 دون باقٍ.'},
      {question:'أي زوج ضرب يعطي 24؟',options:['3 × 8','5 × 5','4 × 5','7 × 3'],correct:0,explanation:'3 × 8 = 24.'}
    ]
  },
  integer_number_line:{
    id:'integer_number_line',title:'خط الأعداد والأعداد السالبة',
    why:'مقارنة الأعداد الصحيحة والجمع والطرح تعتمد على فهم الاتجاه على خط الأعداد.',
    explanation:'على خط الأعداد تزداد القيم كلما تحركنا يمينًا، وتقل كلما تحركنا يسارًا. الصفر بين الموجب والسالب.',
    examples:['-2 أكبر من -5 لأنه يقع إلى يمينه','3 أكبر من -1'],
    check:[
      {question:'أي عدد أكبر؟',options:['-7','-3'],correct:1,explanation:'-3 يقع إلى يمين -7 على خط الأعداد.'},
      {question:'ما العدد الواقع يسار الصفر مباشرة؟',options:['1','-1','2','-2'],correct:1,explanation:'-1 يقع يسار 0 مباشرة.'}
    ]
  },
  fraction_basics:{
    id:'fraction_basics',title:'معنى الكسر والبسط والمقام',
    why:'ضرب الكسور وقسمتها يحتاج فهم معنى البسط والمقام والكسور المتكافئة.',
    explanation:'المقام يبين عدد الأجزاء المتساوية التي قُسم إليها الكل، والبسط يبين عدد الأجزاء المأخوذة.',
    examples:['3/4: أربعة أجزاء متساوية، أخذنا ثلاثة','1/2 = 2/4 كسران متكافئان'],
    check:[
      {question:'في الكسر 3/5 ما المقام؟',options:['3','5','8'],correct:1,explanation:'المقام هو العدد أسفل خط الكسر.'},
      {question:'أي كسر يكافئ 1/2؟',options:['2/4','2/3','3/5'],correct:0,explanation:'2/4 يساوي نصفًا.'}
    ]
  }
};

export const lessonPrerequisites:Record<string,string[]>={
  'g5-math-prime-numbers':['multiplication_facts','factors'],
  'g5-math-prime-factorization':['multiplication_facts','division_facts','factors'],
  'g5-math-gcf':['multiplication_facts','division_facts','factors'],
  'g5-math-lcm':['multiplication_facts','division_facts'],
  'g5-math-whole-times-fraction':['multiplication_facts','fraction_basics'],
  'g5-math-fraction-multiplication':['multiplication_facts','fraction_basics'],
  'g5-math-whole-div-fraction':['multiplication_facts','division_facts','fraction_basics'],
  'g5-math-fraction-division':['multiplication_facts','division_facts','fraction_basics'],
  'g7-math-integers':['integer_number_line'],
  'g7-math-integer-order':['integer_number_line'],
  'g7-math-absolute-value':['integer_number_line'],
  'g7-math-add-subtract-integers':['integer_number_line'],
  'g7-math-multiply-divide-integers':['multiplication_facts','division_facts','integer_number_line']
};

const gapSignals:Record<string,Record<string,string>>={
  'g5-math-prime-numbers':{q1:'factors',q2:'factors',q4:'multiplication_facts'},
  'g5-math-prime-factorization':{q1:'multiplication_facts',q2:'factors'},
  'g5-math-gcf':{q1:'factors',q2:'factors',q3:'multiplication_facts'},
  'g5-math-lcm':{q1:'multiplication_facts',q2:'multiplication_facts',q3:'multiplication_facts'},
  'g7-math-integer-order':{q1:'integer_number_line',q2:'integer_number_line'},
  'g7-math-add-subtract-integers':{q1:'integer_number_line',q2:'integer_number_line'},
  'g7-math-multiply-divide-integers':{q1:'multiplication_facts',q2:'division_facts'}
};

export function detectLikelyGap(lessonId:string,wrongQuestionIds:string[],diagnosticCorrect:boolean){
  const scores:Record<string,number>={};
  const signals=gapSignals[lessonId]||{};
  for(const q of wrongQuestionIds){const skill=signals[q];if(skill)scores[skill]=(scores[skill]||0)+1}
  if(!diagnosticCorrect){for(const skill of lessonPrerequisites[lessonId]||[])scores[skill]=(scores[skill]||0)+1}
  const ranked=Object.entries(scores).sort((a,b)=>b[1]-a[1]);
  return ranked.length?gapSkills[ranked[0][0]]:null;
}
