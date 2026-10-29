import type {ExplicitEvidenceSpec} from './evidenceSpecs';

const specs:Record<string,ExplicitEvidenceSpec[]>={
 'g5-math-prime-factorization':[
  {objectiveId:1,kind:'apply',interaction:'match',quality:'direct',prompt:'اربطي كل عدد بزوج عوامل صحيح يبدأ منه التحليل.',targets:['2 × 9','3 × 8','5 × 7'],pairs:[{item:'18',target:'2 × 9'},{item:'24',target:'3 × 8'},{item:'35',target:'5 × 7'}]},
  {objectiveId:2,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي خطوات متابعة التحليل عندما يظهر عامل غير أولي.',orderItems:['نكتب العدد كحاصل ضرب عاملين','نفحص هل كل عامل أولي','نحلل أي عامل غير أولي مرة أخرى']},
  {objectiveId:3,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'اكتشفي لماذا لم يكتمل التحليل.',statement:'18 = 2 × 9، إذن انتهينا من التحليل إلى عوامل أولية.',options:['لم ننتهِ؛ 9 غير أولي ويجب تحليله إلى 3 × 3','انتهينا لأن 2 أولي','يجب استبدال 2 بالعدد 1'],correctIndex:0,explanation:'نتوقف فقط عندما تصبح جميع العوامل أعدادًا أولية؛ 9 = 3 × 3.'}
 ],
 'g7-math-add-subtract-integers':[
  {objectiveId:2,kind:'apply',interaction:'choice',quality:'direct',questionId:'q2',prompt:'اختاري الناتج الصحيح عند جمع عددين سالبين.'},
  {objectiveId:3,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي خطوات حل 4 - (-2).',orderItems:['نحوّل طرح السالب إلى إضافة مقابله الموجب','نكتب 4 + 2','نحصل على 6']}
 ],
 'g7-math-multiply-divide-integers':[
  {objectiveId:1,kind:'compare',interaction:'match',quality:'direct',prompt:'اربطي كل زوج إشارات بإشارة الناتج في الضرب أو القسمة.',targets:['موجب','سالب'],pairs:[{item:'موجب مع موجب',target:'موجب'},{item:'سالب مع سالب',target:'موجب'},{item:'موجب مع سالب',target:'سالب'},{item:'سالب مع موجب',target:'سالب'}]},
  {objectiveId:2,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي قاعدة الإشارة.',statement:'(-5) × (-2) = -10 لأن وجود عدد سالب يجعل الناتج سالبًا.',options:['الصحيح 10؛ لأن الإشارتين متماثلتان','الصحيح -7؛ لأننا نجمع القيم','الحل -10 صحيح'],correctIndex:0,explanation:'عند تماثل الإشارتين يكون الناتج موجبًا، و5 × 2 = 10.'},
  {objectiveId:3,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي طريقة حل عملية ضرب أو قسمة أعداد صحيحة.',orderItems:['نحدد إشارة الناتج من الإشارتين','نجري العملية على القيم المطلقة','نضع الإشارة التي حددناها على الناتج']}
 ],
 'g7-science-average-speed':[
  {objectiveId:1,kind:'apply',interaction:'choice',quality:'direct',questionId:'q1',prompt:'احسبي السرعة المتوسطة من المسافة الكلية والزمن الكلي.'},
  {objectiveId:2,kind:'apply',interaction:'match',quality:'direct',prompt:'اربطي كل مسافة وزمن بالوحدة المناسبة لكتابة السرعة.',targets:['م/ث','كم/س','م/دقيقة'],pairs:[{item:'60 م خلال 12 ث',target:'م/ث'},{item:'6 كم خلال 0.5 ساعة',target:'كم/س'},{item:'300 م خلال 5 دقائق',target:'م/دقيقة'}]},
  {objectiveId:3,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي معنى السرعة المتوسطة.',statement:'إذا كانت السرعة المتوسطة لرحلة 5 م/ث فهذا يعني أن الجسم تحرك بسرعة 5 م/ث في كل لحظة.',options:['غير صحيح؛ المتوسط يلخص المسافة الكلية والزمن الكلي وقد تتغير السرعة أثناء الرحلة','صحيح؛ المتوسط يعني سرعة ثابتة دائمًا','غير صحيح؛ السرعة المتوسطة لا تستخدم الزمن'],correctIndex:0,explanation:'السرعة المتوسطة لا تعني أن السرعة اللحظية بقيت ثابتة طوال الرحلة.'}
 ]
};

export function getEvidenceSpecExtensions(lessonId:string){return specs[lessonId]||null}
