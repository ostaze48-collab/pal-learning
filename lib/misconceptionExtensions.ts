import type {MisconceptionSpec} from './misconceptionLibrary';

export const misconceptionExtensions:MisconceptionSpec[]=[
 {
  id:'proportion-checks-by-adding',lessonId:'g7-math-proportion',objectiveId:2,
  wrongIdea:'يمكن التحقق من التناسب بجمع حدود النسب بدل مقارنة العلاقة بينهما.',
  detection:[{signal:'objective_failure'},{signal:'wrong_choice',questionId:'q2',wrongOptionIndexes:[0]}],
  prevention:{title:'قارني العلاقة لا المجموع',body:'في التناسب نهتم ببقاء النسبة نفسها. جمع حدود كل نسبة لا يختبر التكافؤ؛ الضرب التبادلي يقارن العلاقتين مباشرة.',prompt:'في 2/3 و4/6، ماذا يخبرك 2×6 و3×4؟',visualKind:'proportion_lab'},
  correction:{title:'اختبري الضربين المتقاطعين',body:'إذا كانت a/b = c/d فإن a×d يجب أن يساوي b×c. تساوي الضربين يعني أن النسبتين تمثلان العلاقة نفسها.',prompt:'هل 3/5 و6/10 متناسبتان؟ ما الضربان اللذان ستقارن بينهما؟',visualKind:'proportion_lab'},
  recheck:{prompt:'ما الطريقة الأسرع للتحقق من 4/7 = 12/21؟',options:['جمع 4+7 و12+21','مقارنة 4×21 و7×12','طرح البسط من المقام'],correctIndex:1,explanation:'نستخدم الضرب التبادلي؛ 4×21 = 84 و7×12 = 84، إذن النسبتان متناسبتان.'}
 },
 {
  id:'direct-proportion-confused-with-inverse',lessonId:'g7-math-direct-proportion',objectiveId:1,
  wrongIdea:'أي علاقة بين كميتين متغيرتين هي تناسب طردي حتى إذا زادت إحداهما عندما نقصت الأخرى.',
  detection:[{signal:'objective_failure'},{signal:'wrong_choice',questionId:'q2',wrongOptionIndexes:[1,2]}],
  prevention:{title:'راقبي اتجاه التغير',body:'في التناسب الطردي، عندما تتضاعف كمية تتضاعف الأخرى بالنسبة نفسها. إذا زادت واحدة بينما نقصت الثانية فالعلاقة ليست طردية.',prompt:'إذا تضاعف عدد الأقلام مع ثبات سعر القلم، ماذا يحدث للتكلفة؟',visualKind:'proportion_lab'},
  correction:{title:'الطردي يتحرك في الاتجاه نفسه',body:'عدد المنتجات والتكلفة بسعر ثابت يتحركان معًا. أما السرعة والزمن لمسافة ثابتة، أو العمال والزمن لنفس العمل، فيتحركان في اتجاهين متعاكسين.',prompt:'أي مثال ينخفض فيه الزمن عندما تزيد الكمية الأخرى؟',visualKind:'proportion_lab'},
  recheck:{prompt:'أي علاقة أقرب إلى التناسب الطردي؟',options:['عدد الدفاتر والتكلفة بسعر ثابت','السرعة والزمن لمسافة ثابتة','عدد العمال والزمن لنفس المهمة'],correctIndex:0,explanation:'عند ثبات سعر الوحدة، زيادة عدد الدفاتر تزيد التكلفة بالنسبة نفسها.'}
 },
 {
  id:'inverse-proportion-keeps-sum-not-product',lessonId:'g7-math-inverse-proportion',objectiveId:2,
  wrongIdea:'في التناسب العكسي يبقى مجموع الكميتين أو الفرق بينهما ثابتًا بدل حاصل الضرب.',
  detection:[{signal:'objective_failure'},{signal:'wrong_choice',questionId:'q3',wrongOptionIndexes:[0,1]}],
  prevention:{title:'ابحثي عن حاصل الضرب',body:'في العمل نفسه: 4 عمال × 6 أيام = 24 عامل-يوم. إذا تغير عدد العمال نبحث عن زمن يجعل حاصل الضرب يبقى 24.',prompt:'إذا أصبح عدد العمال 8، كم يومًا يحافظ على حاصل الضرب نفسه؟',visualKind:'proportion_lab'},
  correction:{title:'العكسي يحفظ الناتج المشترك',body:'في العلاقة العكسية البسيطة x×y ثابت. لذلك مضاعفة إحدى الكميتين تجعل الأخرى نصفها حتى يبقى حاصل الضرب نفسه.',prompt:'إذا كانت 3×8 = 24، فما العدد الذي يقترن بـ6 ليبقى الناتج 24؟',visualKind:'proportion_lab'},
  recheck:{prompt:'إذا كان 5 عمال ينجزون عملاً في 12 يومًا بالمعدل نفسه، فأي قيمة يجب أن تبقى ثابتة عند تغيير عدد العمال؟',options:['مجموع العمال والأيام','حاصل ضرب العمال في الأيام','فرق العمال والأيام'],correctIndex:1,explanation:'في هذا النموذج العكسي يبقى حاصل ضرب عدد العمال في الزمن ثابتًا.'}
 },
 {
  id:'scale-compares-unlike-units',lessonId:'g7-math-scale',objectiveId:2,
  wrongIdea:'يمكن حساب مقياس الرسم مباشرة بأطوال بوحدات مختلفة دون توحيد الوحدات.',
  detection:[{signal:'objective_failure'},{signal:'wrong_choice',questionId:'q2',wrongOptionIndexes:[1,2,3]}],
  prevention:{title:'اجعلي الوحدتين تتكلمان اللغة نفسها',body:'قبل بناء نسبة بين طول على الرسم وطول حقيقي يجب أن يكون الطولان بالوحدة نفسها. لا معنى لمقارنة 1 سم و4 كم كرقمين فقط.',prompt:'ما الذي يجب توحيده قبل كتابة النسبة؟',visualKind:'proportion_lab'},
  correction:{title:'وحّدي الوحدات ثم قارني',body:'حوّلي الطولين إلى الوحدة نفسها أولًا، وبعدها اكتبي مقياس الرسم أو استخدمي التناسب. هذا يمنع خطأ عامل التحويل.',prompt:'إذا كان الرسم بالسنتيمتر والحقيقة بالمتر، ما الخطوة التي تسبق الحساب؟',visualKind:'proportion_lab'},
  recheck:{prompt:'قبل مقارنة 2 سم على مخطط بـ10 م حقيقةً، ماذا نفعل أولًا؟',options:['نجمع 2 و10','نوحّد الوحدات','نقسم 10 على 2 مباشرة دون تحويل'],correctIndex:1,explanation:'يجب تحويل الطولين إلى الوحدة نفسها قبل بناء مقياس الرسم أو المقارنة.'}
 },
 {
  id:'distance-return-means-zero-distance',lessonId:'g7-science-distance-displacement',objectiveId:1,
  wrongIdea:'إذا عاد الجسم إلى نقطة البداية فالمسافة الكلية تساوي صفرًا لأن الإزاحة صفر.',
  detection:[{signal:'objective_failure'},{signal:'wrong_choice',questionId:'q1',wrongOptionIndexes:[0]}],
  prevention:{title:'تتبعي الطريق لا نقطة النهاية فقط',body:'إذا تحرك جسم 4 م شرقًا ثم 4 م غربًا فقد قطع 8 م من المسار، حتى لو انتهى في المكان الذي بدأ منه.',prompt:'ما الذي تجمعه المسافة: طول الطريق أم الفرق بين البداية والنهاية؟',visualKind:'motion_lab'},
  correction:{title:'المسافة للمسار والإزاحة للتغير',body:'المسافة تجمع كل ما قُطع على الطريق. الإزاحة تقارن موضع البداية بموضع النهاية مع الاتجاه؛ لذلك يمكن أن تكون الإزاحة صفرًا والمسافة غير صفرية.',prompt:'في رحلة ذهاب وعودة، أي كمية يمكن أن تصبح صفرًا؟',visualKind:'motion_lab'},
  recheck:{prompt:'تحرك جسم 5 م شرقًا ثم 5 م غربًا إلى نقطة البداية. ما المسافة الكلية؟',options:['0 م','5 م','10 م'],correctIndex:2,explanation:'المسافة تجمع طول المسارين: 5 + 5 = 10 م، بينما الإزاحة تساوي صفرًا.'}
 },
 {
  id:'average-speed-inverts-formula',lessonId:'g7-science-average-speed',objectiveId:1,
  wrongIdea:'السرعة المتوسطة تحسب بالزمن ÷ المسافة بدل المسافة ÷ الزمن.',
  detection:[{signal:'objective_failure'},{signal:'wrong_choice',questionId:'q2',wrongOptionIndexes:[1]}],
  prevention:{title:'اسألي كم مسافة في كل ثانية',body:'السرعة تصف مقدار المسافة في وحدة زمن؛ لذلك نقسم المسافة على الزمن: متر لكل ثانية، لا ثانية لكل متر.',prompt:'أي ترتيب يعطي وحدة م/ث: المسافة÷الزمن أم الزمن÷المسافة؟',visualKind:'motion_lab'},
  correction:{title:'الوحدة تكشف القانون',body:'إذا أردنا م/ث فنضع الأمتار في البسط والثواني في المقام. مثلًا 60 م ÷ 12 ث = 5 م/ث.',prompt:'إذا كتبتِ 12÷60، فما الوحدة التي ستنتج؟',visualKind:'motion_lab'},
  recheck:{prompt:'قطع جسم 90 م في 15 ث. ما سرعته المتوسطة؟',options:['6 م/ث','1/6 م/ث','75 م/ث'],correctIndex:0,explanation:'السرعة المتوسطة = المسافة ÷ الزمن = 90 ÷ 15 = 6 م/ث.'}
 },
 {
  id:'newton-second-more-mass-means-more-acceleration',lessonId:'g7-science-newton-second-law',objectiveId:2,
  wrongIdea:'عند ثبات القوة، زيادة كتلة الجسم تجعل تسارعه أكبر.',
  detection:[{signal:'objective_failure'},{signal:'wrong_choice',questionId:'q3',wrongOptionIndexes:[1]}],
  prevention:{title:'نفس الدفعة لجسمين مختلفين',body:'تخيلي دفع عربة خفيفة وعربة أثقل بالقوة نفسها. العربة الأثقل تغيّر سرعتها أقل، لأن القوة نفسها تؤثر في كتلة أكبر.',prompt:'أي عربة ستتسارع أكثر مع القوة نفسها: الأخف أم الأثقل؟',visualKind:'force_lab'},
  correction:{title:'عند ثبات القوة، زيادة الكتلة تقلل التسارع',body:'من F = m×a نحصل على a = F/m. عندما تكبر الكتلة وتبقى القوة ثابتة، يصغر التسارع.',prompt:'إذا بقيت القوة 12 نيوتن وزادت الكتلة من 3 إلى 6 كغم، ماذا يحدث للتسارع؟',visualKind:'force_lab'},
  recheck:{prompt:'القوة نفسها تؤثر في جسمين كتلتهما 2 كغم و4 كغم. أيهما تسارعه أكبر؟',options:['جسم 2 كغم','جسم 4 كغم','التسارع متساوٍ دائمًا'],correctIndex:0,explanation:'عند ثبات القوة يكون التسارع أكبر للجسم ذي الكتلة الأصغر.'}
 }
];
