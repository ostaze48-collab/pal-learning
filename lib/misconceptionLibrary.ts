import {getLesson} from './data';
import type {TeachingVisualKind} from './teachingVisuals';
import {misconceptionExtensions} from './misconceptionExtensions';

export type MisconceptionDetection={questionId?:string;wrongOptionIndexes?:number[];signal:'wrong_choice'|'objective_failure'|'explanation_pattern';keywords?:string[]};
export type MisconceptionExperience={title:string;body:string;prompt:string;visualKind?:TeachingVisualKind};
export type MisconceptionRecheck={prompt:string;options?:string[];correctIndex?:number;explanation:string};
export type MisconceptionSpec={
 id:string;
 lessonId:string;
 objectiveId:number;
 wrongIdea:string;
 detection:MisconceptionDetection[];
 prevention:MisconceptionExperience;
 correction:MisconceptionExperience;
 recheck:MisconceptionRecheck;
};

const specs:MisconceptionSpec[]=[
 {
  id:'cell-all-cells-identical',lessonId:'g5-science-cell-types',objectiveId:2,
  wrongIdea:'كل الخلايا لها التراكيب نفسها ولا يوجد فرق مهم بين الخلية النباتية والحيوانية.',
  detection:[{signal:'objective_failure'},{signal:'wrong_choice',questionId:'q2'}],
  prevention:{title:'ابحثي عن دليل الفارق',body:'ضعي خلية نباتية وحيوانية جنبًا إلى جنب. لا تبحثي عن اختلاف في اللون فقط؛ ابحثي عن تركيب يظهر في إحداهما ولا يظهر في الأخرى.',prompt:'أي تركيب سيكون دليلًا أقوى من شكل الخلية وحده؟',visualKind:'cell_compare'},
  correction:{title:'قارني بالدليل لا بالشكل',body:'وجود الجدار الخلوي والبلاستيدات الخضراء يميز الخلية النباتية، بينما النواة والغشاء والسيتوبلازم توجد في النوعين.',prompt:'إذا رأيتِ بلاستيدات خضراء، ماذا تستطيعين استنتاجه؟',visualKind:'cell_compare'},
  recheck:{prompt:'خلية فيها نواة وغشاء خلوي ولا تحتوي جدارًا خلويًا أو بلاستيدات خضراء. أي نوع هي على الأرجح؟',options:['خلية نباتية','خلية حيوانية','لا يمكن أن تكون خلية'],correctIndex:1,explanation:'غياب الجدار الخلوي والبلاستيدات مع وجود النواة والغشاء يتوافق مع الخلية الحيوانية.'}
 },
 {
  id:'cell-part-name-equals-function',lessonId:'g5-science-cell-types',objectiveId:3,
  wrongIdea:'معرفة اسم جزء الخلية تكفي لفهم وظيفته، أو يمكن تبديل وظائف الأجزاء معًا.',
  detection:[{signal:'objective_failure'},{signal:'wrong_choice',questionId:'q3'}],
  prevention:{title:'ماذا يحدث لو غاب الجزء؟',body:'بدل حفظ الاسم والوظيفة كزوج منفصل، تخيلي الخلية من دون هذا الجزء واسألي ما العمل الذي سيتعطل.',prompt:'ماذا يتغير لو لم توجد النواة؟',visualKind:'cell_parts'},
  correction:{title:'اربطي الشكل بالعمل',body:'النواة ترتبط بالتحكم في أنشطة كثيرة، والغشاء يحيط بالخلية وينظم حدودها، والسيتوبلازم وسط توجد فيه مكونات الخلية.',prompt:'أي وظيفة تحتاج جزءًا يعمل كمركز تحكم؟',visualKind:'cell_parts'},
  recheck:{prompt:'أي جزء يرتبط أكثر بالتحكم في كثير من أنشطة الخلية؟',options:['النواة','الجدار الخلوي','السيتوبلازم'],correctIndex:0,explanation:'النواة ترتبط بالتحكم في كثير من أنشطة الخلية.'}
 },
 {
  id:'separation-one-method-fits-all',lessonId:'g5-science-separation-methods',objectiveId:3,
  wrongIdea:'يمكن استخدام طريقة فصل واحدة لأي مخلوط بغض النظر عن خواص مكوناته.',
  detection:[{signal:'objective_failure'},{signal:'wrong_choice',questionId:'q1'}],
  prevention:{title:'اختاري الطريقة من الخاصية',body:'قبل اختيار أداة الفصل، اسألي: هل المادة تذوب؟ هل تنجذب للمغناطيس؟ هل أريد استرجاع مادة مذابة؟',prompt:'أي خاصية في المخلوط هي التي يجب أن تقود اختيار الطريقة؟',visualKind:'filter_lab'},
  correction:{title:'الطريقة تتبع الخاصية',body:'الترشيح يناسب صلبًا غير ذائب في سائل، والمغناطيس عندما ينجذب أحد المكونات، والتبخير يمكن أن يترك مادة صلبة كانت مذابة.',prompt:'لماذا لا يصلح الترشيح لاسترجاع الملح المذاب في الماء؟',visualKind:'evaporation_lab'},
  recheck:{prompt:'ماء مالح اختفى فيه الملح تمامًا. أي طريقة تساعد على استرجاع الملح؟',options:['الترشيح','التبخير','المغناطيس'],correctIndex:1,explanation:'الملح مذاب ويمر مع الماء عبر المرشح؛ بالتبخير يزول الماء وتبقى بلورات الملح.'}
 },
 {
  id:'materials-chosen-by-appearance',lessonId:'g5-science-materials-properties',objectiveId:2,
  wrongIdea:'نختار المادة للاستخدام بحسب شكلها أو لونها، وليس بحسب الخاصية التي يحتاجها الاستخدام.',
  detection:[{signal:'objective_failure'},{signal:'wrong_choice',questionId:'q2',wrongOptionIndexes:[1,2]}],
  prevention:{title:'ابدئي من المهمة لا من الشكل',body:'قبل اختيار المادة، اسألي ما الذي يجب أن تفعله: توصل الكهرباء أم تمنعها؟ تكون صلبة أم مرنة؟ الخاصية المطلوبة هي التي تقود الاختيار.',prompt:'غطاء السلك يجب أن يوصل الكهرباء أم يمنع مرورها إلى اليد؟',visualKind:'material_properties'},
  correction:{title:'اربطي الاستخدام بالخاصية',body:'المعدن مناسب داخل السلك لأنه موصل، بينما البلاستيك مناسب خارجه لأنه عازل. اللون والشكل لا يفسران سبب الاختيار.',prompt:'أي خاصية للبلاستيك تجعله مناسبًا لتغطية السلك؟',visualKind:'material_properties'},
  recheck:{prompt:'نريد مقبضًا لأداة ساخنة. أي خاصية أهم عند اختيار المادة؟',options:['أن تكون عازلة للحرارة','أن يكون لونها لامعًا','أن تذوب بسرعة'],correctIndex:0,explanation:'الوظيفة المطلوبة هي حماية اليد من الحرارة، لذلك نحتاج مادة عازلة للحرارة.'}
 },
 {
  id:'visible-change-means-chemical',lessonId:'g5-science-physical-chemical-changes',objectiveId:1,
  wrongIdea:'أي تغير واضح في الشكل أو الحالة يعني أن مادة جديدة تكونت وأن التغير كيميائي.',
  detection:[{signal:'objective_failure'},{signal:'wrong_choice',questionId:'q1',wrongOptionIndexes:[1]}],
  prevention:{title:'اسألي: هل ظهرت مادة جديدة؟',body:'الانصهار يغير حالة المادة فقط؛ الثلج يصبح ماءً لكنه ما زال المادة نفسها. التغير الكيميائي يحتاج دليلًا على تكوّن مادة جديدة.',prompt:'بعد ذوبان الثلج، هل أصبحت المادة شيئًا غير الماء؟',visualKind:'reaction_lab'},
  correction:{title:'الشكل وحده لا يكفي',body:'قد يكون التغير كبيرًا وواضحًا لكنه فيزيائي إذا لم تتكون مادة جديدة. الانصهار والتجمد يغيران الحالة لا هوية المادة.',prompt:'ما السؤال الذي يفرق بين التغير الفيزيائي والكيميائي؟',visualKind:'reaction_lab'},
  recheck:{prompt:'سحق قطعة طباشير إلى مسحوق دون تكوّن مادة جديدة هو تغير:',options:['فيزيائي','كيميائي'],correctIndex:0,explanation:'تغير الشكل فقط ولم تتكون مادة جديدة، لذلك التغير فيزيائي.'}
 },
 {
  id:'whole-times-fraction-changes-denominator',lessonId:'g5-math-whole-times-fraction',objectiveId:2,
  wrongIdea:'عند ضرب عدد صحيح في كسر يجب ضرب البسط والمقام في العدد الصحيح معًا.',
  detection:[{signal:'objective_failure'},{signal:'wrong_choice',questionId:'q1',wrongOptionIndexes:[3]},{signal:'wrong_choice',questionId:'q2',wrongOptionIndexes:[2]}],
  prevention:{title:'ثبتي حجم الجزء أولًا',body:'في 2 × 3/4 نحن نأخذ مجموعتين من ثلاثة أرباع. حجم الجزء ما زال ربعًا، لذلك المقام 4 لا يتغير؛ الذي يزداد هو عدد الأجزاء.',prompt:'إذا كررنا ثلاثة أرباع مرتين، هل تغير حجم الربع نفسه أم عدد الأرباع؟',visualKind:'fraction_bar'},
  correction:{title:'المقام يصف حجم الجزء',body:'العدد الصحيح يكرر عدد الأجزاء، لذلك نضربه في البسط. المقام يبقى لأنه يصف إلى كم جزء متساوٍ قُسم الواحد.',prompt:'في 4 × 1/3، كم ثلثًا أصبح لدينا؟',visualKind:'fraction_bar'},
  recheck:{prompt:'ما التمثيل الصحيح لـ 3 × 2/5؟',options:['6/5','6/15','2/15'],correctIndex:0,explanation:'نكرر 2/5 ثلاث مرات، فيصبح لدينا 6 أخماس؛ المقام 5 لا يتغير.'}
 },
 {
  id:'fraction-multiply-adds-parts',lessonId:'g5-math-fraction-times-fraction',objectiveId:1,
  wrongIdea:'عند ضرب كسرين يمكن جمع البسطين وجمع المقامين بدل الضرب.',
  detection:[{signal:'objective_failure'},{signal:'wrong_choice',questionId:'q1',wrongOptionIndexes:[1]}],
  prevention:{title:'الضرب يعني جزءًا من جزء',body:'في 1/2 × 3/5 لا نجمع الكسرين؛ نحن نأخذ نصف ثلاثة أخماس. استخدمي شريط الكسر لتري أن العملية تصغر الكمية بدل أن تجمعها.',prompt:'هل نصف 3/5 يجب أن يكون أكبر من 3/5 أم أصغر؟',visualKind:'fraction_bar'},
  correction:{title:'اضربي الأجزاء لا تجمعيها',body:'نضرب البسط في البسط والمقام في المقام لأننا نأخذ جزءًا من جزء: 1×3 على 2×5 = 3/10.',prompt:'ما الذي يجعل 4/7 غير منطقي كناتج لـ 1/2 × 3/5؟',visualKind:'fraction_bar'},
  recheck:{prompt:'ما ناتج 2/3 × 1/4؟',options:['3/7','2/12','2/7'],correctIndex:1,explanation:'نضرب البسطين 2×1=2 والمقامين 3×4=12، فيكون الناتج 2/12 ثم يمكن تبسيطه.'}
 },
 {
  id:'fraction-product-not-simplified',lessonId:'g5-math-fraction-times-fraction',objectiveId:3,
  wrongIdea:'إذا وصلنا إلى كسر صحيح حسابيًا مثل 6/12 فالمهمة انتهت حتى لو كان يمكن تبسيطه.',
  detection:[{signal:'objective_failure'},{signal:'wrong_choice',questionId:'q2',wrongOptionIndexes:[0]}],
  prevention:{title:'ابحثي عن اسم أبسط لنفس الكمية',body:'بعد الضرب، قارني البسط والمقام: هل لهما عامل مشترك؟ شريط الكسر يريك أن 6/12 و1/2 يمثلان الكمية نفسها، لكن 1/2 أبسط.',prompt:'ما العدد الذي نستطيع قسمة 6 و12 عليه معًا؟',visualKind:'fraction_bar'},
  correction:{title:'التبسيط لا يغيّر الكمية',body:'قسمة البسط والمقام على العامل نفسه تعطي اسمًا أبسط للكسر نفسه. 6/12 ÷ 6/6 = 1/2.',prompt:'كيف تعرفين أن 6/12 و1/2 متساويان؟',visualKind:'fraction_bar'},
  recheck:{prompt:'ما أبسط صورة للكسر 8/12؟',options:['4/6','2/3','8/6'],correctIndex:1,explanation:'نقسم 8 و12 على 4 فنحصل على 2/3، وهي أبسط صورة.'}
 },
 {
  id:'whole-div-fraction-does-not-invert-divisor',lessonId:'g5-math-whole-div-fraction',objectiveId:3,
  wrongIdea:'في قسمة عدد صحيح على كسر نترك الكسر الثاني كما هو أو نقلب العدد الأول بدل قلب المقسوم عليه.',
  detection:[{signal:'objective_failure'},{signal:'wrong_choice',questionId:'q2',wrongOptionIndexes:[0]},{signal:'wrong_choice',questionId:'q3',wrongOptionIndexes:[0]}],
  prevention:{title:'اسألي كم جزءًا صغيرًا يوجد؟',body:'4 ÷ 1/2 يعني: كم نصفًا يوجد في أربعة؟ كل واحد فيه نصفان، لذلك الجواب 8. الضرب في مقلوب الكسر الثاني يعبر عن هذا المعنى.',prompt:'إذا كان في كل واحد نصفان، فكم نصفًا في 4؟',visualKind:'fraction_bar'},
  correction:{title:'نقلب المقسوم عليه فقط',body:'نثبت العدد الأول، نحول القسمة إلى ضرب، ثم نقلب الكسر الذي نقسم عليه. 3 ÷ 2/5 = 3 × 5/2.',prompt:'أي كسر يمثل عدد الأخماس الموجودة في كل 2/5؟',visualKind:'fraction_bar'},
  recheck:{prompt:'ما الخطوة الصحيحة في 5 ÷ 2/3؟',options:['5 × 2/3','5 × 3/2','1/5 × 2/3'],correctIndex:1,explanation:'نثبت 5 ونحوّل القسمة إلى ضرب ونقلب الكسر الثاني فقط: 5 × 3/2.'}
 },
 {
  id:'fraction-division-inverts-wrong-fraction',lessonId:'g5-math-fraction-div-fraction',objectiveId:3,
  wrongIdea:'في قسمة كسرين نقلب الكسر الأول أو نقلب الكسرين معًا.',
  detection:[{signal:'objective_failure'},{signal:'wrong_choice',questionId:'q2',wrongOptionIndexes:[0,2]}],
  prevention:{title:'الأول يبقى والثاني يتغير',body:'اعتبري الكسر الأول هو الكمية التي نملكها، والثاني هو حجم المجموعة التي نسأل كم مرة تدخل فيها. لذلك الكسر الأول يبقى كما هو، ونستخدم مقلوب الثاني لتحويل القسمة إلى ضرب.',prompt:'في 3/5 ÷ 2/7، أي كسر يمثل الكمية التي نبدأ بها؟',visualKind:'fraction_bar'},
  correction:{title:'ثبتي الأول واقلبي الثاني',body:'اكتبي الخطوات ببطء: 3/5 ÷ 2/7 → 3/5 × 7/2. لا نقلب 3/5 لأنه هو المقسوم.',prompt:'بعد تحويل علامة القسمة إلى ضرب، أي كسر يتغير شكله؟',visualKind:'fraction_bar'},
  recheck:{prompt:'أي تحويل صحيح لـ 4/7 ÷ 2/3؟',options:['7/4 × 3/2','4/7 × 3/2','7/4 × 2/3'],correctIndex:1,explanation:'نبقي الكسر الأول 4/7 كما هو ونقلب الكسر الثاني 2/3 إلى 3/2.'}
 },
 {
  id:'atom-neutrality-neutron-confusion',lessonId:'g7-science-atom-structure',objectiveId:4,
  wrongIdea:'تعادل الذرة يعتمد على عدد النيوترونات، أو يكفي وجود نواة متعادلة حتى تكون الذرة كلها متعادلة.',
  detection:[{signal:'objective_failure'},{signal:'wrong_choice',questionId:'q3',wrongOptionIndexes:[1,2]}],
  prevention:{title:'وازني الموجب مع السالب',body:'الشحنة الكلية تأتي من البروتونات الموجبة والإلكترونات السالبة. النيوترونات لا تضيف شحنة، لذلك الذرة المتعادلة تحتاج عددًا متساويًا من البروتونات والإلكترونات.',prompt:'إذا كان لدينا 8 شحنات موجبة، كم شحنة سالبة نحتاج ليصبح المجموع صفرًا؟',visualKind:'atom_builder'},
  correction:{title:'النيوترون لا يوازن الشحنة',body:'البروتون +1 والإلكترون -1، وهما اللذان يوازنان بعضهما. النيوترون شحنته صفر، لذلك لا يغير صافي الشحنة.',prompt:'ذرة فيها 6 بروتونات و6 إلكترونات: ما صافي الشحنة؟',visualKind:'atom_builder'},
  recheck:{prompt:'ذرة متعادلة تحتوي 11 بروتونًا. كم إلكترونًا تحتوي؟',options:['11','22','10'],correctIndex:0,explanation:'في الذرة المتعادلة يتساوى عدد البروتونات الموجبة والإلكترونات السالبة.'}
 },
 {
  id:'compound-is-element-or-mixture',lessonId:'g7-science-important-compounds',objectiveId:1,
  wrongIdea:'المركب هو مجرد عنصر له رمز، أو خليط يمكن فصل مكوناته دون تغير كيميائي.',
  detection:[{signal:'objective_failure'},{signal:'wrong_choice',questionId:'q1',wrongOptionIndexes:[1,2]}],
  prevention:{title:'ابحثي عن أكثر من عنصر مرتبط كيميائيًا',body:'المركب يتكون من عنصرين أو أكثر متحدين كيميائيًا بنسبة محددة. الصيغة H₂O تخبرنا بوجود نوعين من العناصر مرتبطين في مادة واحدة.',prompt:'كم نوعًا من العناصر يظهر في H₂O؟',visualKind:'atom_builder'},
  correction:{title:'العنصر نوع واحد، المركب أكثر من نوع',body:'Fe يمثل عنصر الحديد، بينما H₂O وNaCl يحتويان أكثر من عنصر متحد كيميائيًا. المركب له خواصه الخاصة وليس مجرد وضع العناصر جنبًا إلى جنب.',prompt:'ما الدليل في الصيغة NaCl على أنها مركب؟',visualKind:'atom_builder'},
  recheck:{prompt:'أي مما يلي مركب؟',options:['O₂','NaCl','Fe'],correctIndex:1,explanation:'NaCl يحتوي عنصرين مختلفين، الصوديوم والكلور، متحدين كيميائيًا.'}
 },
 {
  id:'reaction-atoms-disappear',lessonId:'g7-science-chemical-reactions',objectiveId:4,
  wrongIdea:'أثناء التفاعل الكيميائي تختفي الذرات القديمة وتظهر ذرات جديدة من العدم.',
  detection:[{signal:'objective_failure'},{signal:'wrong_choice',questionId:'q3',wrongOptionIndexes:[2]}],
  prevention:{title:'اتبعي الذرات قبل وبعد',body:'في التفاعل الكيميائي لا نحتاج أن تختفي الذرات؛ ما يتغير هو طريقة ارتباطها وترتيبها لتكوين مواد جديدة.',prompt:'إذا بقيت أنواع الذرات نفسها، فما الذي يمكن أن يتغير ليظهر مركب جديد؟',visualKind:'reaction_lab'},
  correction:{title:'التفاعل يعيد الترتيب',body:'المتفاعلات تتحول إلى نواتج لأن الروابط والترتيب يتغيران. الذرات نفسها يعاد تنظيمها بدل أن تختفي.',prompt:'ما الفرق بين تغير الذرات نفسها وتغير طريقة ارتباطها؟',visualKind:'reaction_lab'},
  recheck:{prompt:'ماذا يحدث للذرات في تفاعل كيميائي بصورة مبسطة؟',options:['يعاد ترتيبها لتكوين مواد جديدة','تختفي تمامًا','تبقى المواد كما هي بلا تغير'],correctIndex:0,explanation:'الذرات يعاد ترتيبها وارتباطها لتكوين مواد جديدة.'}
 },
 {
  id:'integers-bigger-absolute-means-bigger',lessonId:'g7-math-integers',objectiveId:3,
  wrongIdea:'العدد ذو القيمة المطلقة الأكبر هو دائمًا العدد الأكبر، حتى عندما يكون سالبًا.',
  detection:[{signal:'objective_failure'},{signal:'wrong_choice',questionId:'q2'}],
  prevention:{title:'المكان قبل الرقم',body:'ضعي العددين على خط الأعداد قبل المقارنة. في الأعداد السالبة، العدد الأقرب إلى الصفر يقع أكثر إلى اليمين ويكون أكبر.',prompt:'بين -8 و-3، أيهما يقع أكثر إلى اليمين؟',visualKind:'number_line'},
  correction:{title:'لا تقارني القيمة المطلقة وحدها',body:'|-8| أكبر من |-3|، لكن -8 يقع يسار -3، لذلك -3 أكبر.',prompt:'ما الدليل من خط الأعداد؟',visualKind:'number_line'},
  recheck:{prompt:'أي عدد أكبر؟',options:['-9','-4'],correctIndex:1,explanation:'-4 يقع إلى يمين -9 على خط الأعداد، لذلك هو الأكبر.'}
 },
 {
  id:'integer-add-sign-rule-overgeneralized',lessonId:'g7-math-add-subtract-integers',objectiveId:1,
  wrongIdea:'عند جمع عدد موجب وسالب نجمع القيم المطلقة ونضع إشارة السالب دائمًا.',
  detection:[{signal:'objective_failure'},{signal:'wrong_choice',questionId:'q1'}],
  prevention:{title:'شاهدي الحركتين',body:'مثلي -3 ثم تحركي 5 خطوات في الاتجاه الموجب. المكان النهائي يوضح لماذا لا نضيف 3 و5 معًا.',prompt:'بعد البدء من -3 والتحرك 5 يمينًا، أين نصل؟',visualKind:'integer_motion'},
  correction:{title:'عند اختلاف الإشارتين نرى من يغلب',body:'يمكن تمثيل العددين كحركتين متعاكستين؛ نطرح القيم المطلقة ونأخذ اتجاه العدد الأكبر قيمة مطلقة.',prompt:'في -3 + 5، أي حركة تبقى بعد إلغاء 3 خطوات متعاكسة؟',visualKind:'integer_motion'},
  recheck:{prompt:'ما ناتج -4 + 7؟',options:['-11','-3','3','11'],correctIndex:2,explanation:'الإشارتان مختلفتان؛ 7-4=3 وإشارة العدد الأكبر قيمة مطلقة موجبة.'}
 },
 {
  id:'subtract-negative-as-ordinary-subtraction',lessonId:'g7-math-add-subtract-integers',objectiveId:3,
  wrongIdea:'طرح عدد سالب يعني دائمًا التحرك إلى اليسار أو إنقاص القيمة.',
  detection:[{signal:'objective_failure'},{signal:'wrong_choice',questionId:'q3'}],
  prevention:{title:'غيّري معنى الطرح',body:'في 4 - (-2)، نحن نزيل حركة سالبة. إزالة اتجاه سالب تعادل إضافة اتجاه موجب.',prompt:'إذا أزلنا -2، لماذا تتحول الحركة إلى اليمين؟',visualKind:'integer_motion'},
  correction:{title:'طرح السالب يغيّر الاتجاه',body:'4 - (-2) = 4 + 2، لذلك الناتج 6. التمثيل بالحركة يفسر القاعدة بدل حفظها.',prompt:'ما العملية المكافئة لـ 3 - (-5)؟',visualKind:'integer_motion'},
  recheck:{prompt:'ما ناتج 6 - (-3)؟',options:['3','-9','9','-3'],correctIndex:2,explanation:'طرح -3 يعادل إضافة +3، لذلك 6+3=9.'}
 },
 {
  id:'pronoun-is-name',lessonId:'g5-ar-noun-types',objectiveId:1,
  wrongIdea:'الضمير واسم العلم نوع واحد لأن كليهما قد يشير إلى شخص.',
  detection:[{signal:'objective_failure'}],
  prevention:{title:'الاسم يذكر والضمير ينوب',body:'اسم العلم يذكر شخصًا أو مكانًا باسمه مثل سلمى أو فلسطين، أما الضمير فينوب عن الاسم مثل هي أو نحن.',prompt:'في «سلمى قرأت، وهي أعجبتها القصة»، أي كلمة سمت الشخص وأي كلمة نابت عنه؟',visualKind:'pronoun_swap'},
  correction:{title:'بدّلي الاسم بضمير',body:'إذا استطعتِ استبدال الاسم بكلمة مثل هو أو هي مع بقاء المرجع واضحًا، فأنتِ تستخدمين ضميرًا لا اسم علم.',prompt:'ما الضمير المناسب الذي يمكن أن ينوب عن «سلمى»؟',visualKind:'pronoun_swap'},
  recheck:{prompt:'أي كلمة ضمير؟',options:['غزة','هي','ليان'],correctIndex:1,explanation:'«هي» ضمير، بينما غزة وليان اسما علم.'}
 },
 {
  id:'does-keeps-s-on-main-verb',lessonId:'g7-en-question-order',objectiveId:3,
  wrongIdea:'After does, the main verb keeps the -s ending: “Does he plays…?”',
  detection:[{signal:'objective_failure'}],
  prevention:{title:'Let does carry the marker',body:'In a present-simple question, does carries the third-person marker, so the main verb returns to its base form.',prompt:'Which is carrying the marker now: does or play?',visualKind:'question_blocks'},
  correction:{title:'Build the question in blocks',body:'Does + subject + base verb: “Does he play football?” not “Does he plays football?”',prompt:'What form of the main verb comes after does?',visualKind:'question_blocks'},
  recheck:{prompt:'Choose the correct question.',options:['Does she likes music?','Does she like music?','Do she likes music?'],correctIndex:1,explanation:'After does, use the base verb: like.'}
 }
];

const allSpecs:MisconceptionSpec[]=[...specs,...misconceptionExtensions];

export function getMisconceptions(lessonId:string,objectiveId?:number){return allSpecs.filter(x=>x.lessonId===lessonId&&(objectiveId===undefined||x.objectiveId===objectiveId))}
export function getPrimaryMisconception(lessonId:string,objectiveId:number){return getMisconceptions(lessonId,objectiveId)[0]||null}
export function detectMisconceptionFromChoice(lessonId:string,questionId:string,selectedIndex:number){return allSpecs.find(spec=>spec.lessonId===lessonId&&spec.detection.some(d=>d.signal==='wrong_choice'&&d.questionId===questionId&&(!d.wrongOptionIndexes||d.wrongOptionIndexes.includes(selectedIndex))))||null}
export function validateMisconceptionLibrary(){
 const issues:string[]=[];const ids=new Set<string>();
 for(const spec of allSpecs){
  if(ids.has(spec.id))issues.push(`duplicate misconception id: ${spec.id}`);ids.add(spec.id);
  const lesson=getLesson(spec.lessonId);if(!lesson){issues.push(`${spec.id}: missing lesson ${spec.lessonId}`);continue}
  const objectiveCount=Math.max(1,lesson.learningPoints.length);if(spec.objectiveId<1||spec.objectiveId>objectiveCount)issues.push(`${spec.id}: objective ${spec.objectiveId} outside 1..${objectiveCount}`);
  for(const detection of spec.detection){
   if(detection.questionId&&!lesson.questions.some(q=>q.id===detection.questionId))issues.push(`${spec.id}: missing question ${detection.questionId}`);
   if(detection.questionId&&detection.wrongOptionIndexes?.length){const question=lesson.questions.find(q=>q.id===detection.questionId);if(question)for(const index of detection.wrongOptionIndexes)if(index<0||index>=question.options.length||index===question.correct)issues.push(`${spec.id}: invalid wrong option ${index} for ${detection.questionId}`)}
  }
  if(spec.recheck.options&&(!Number.isInteger(spec.recheck.correctIndex)||Number(spec.recheck.correctIndex)<0||Number(spec.recheck.correctIndex)>=spec.recheck.options.length))issues.push(`${spec.id}: invalid recheck correctIndex`);
 }
 return {count:allSpecs.length,issues};
}
