import type {ExplicitEvidenceSpec} from './evidenceSpecs';

export const evidenceSpecExtensions:Record<string,ExplicitEvidenceSpec[]>={
 'g5-math-prime-factorization':[
  {objectiveId:1,kind:'apply',interaction:'choice',quality:'direct',prompt:'أي خطوة تبدأ تحليل 18 بطريقة مفيدة؟',options:['18 = 6 × 3','18 = 18 × 1 فقط ثم نتوقف','18 = 20 - 2'],correctIndex:0,explanation:'نبدأ بكتابة العدد كحاصل ضرب عاملين، ثم نفحص هل العوامل أولية أم تحتاج تفكيكًا آخر.'},
  {objectiveId:2,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'اكتشفي لماذا لم ينتهِ التحليل بعد.',statement:'كتبت طالبة: 18 = 2 × 9 ثم توقفت.',options:['يجب تحليل 9 إلى 3 × 3 لأن 9 ليس أوليًا','التحليل انتهى لأن 2 أولي','يجب حذف العدد 2'],correctIndex:0,explanation:'نتابع تحليل أي عامل غير أولي حتى تصبح جميع العوامل أولية.'},
  {objectiveId:3,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي رحلة التحليل من البداية حتى العوامل الأولية.',orderItems:['18 = 6 × 3','6 = 2 × 3','18 = 2 × 3 × 3']}
 ],
 'g5-math-area-units':[
  {objectiveId:1,kind:'recognize',interaction:'choice',quality:'direct',prompt:'ماذا تصف المساحة؟',options:['مقدار السطح الذي يغطيه الشكل','طول حافة واحدة فقط','كمية السائل داخل وعاء'],correctIndex:0,explanation:'المساحة تقيس مقدار السطح.'},
  {objectiveId:2,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي الوحدة في هذه الإجابة.',statement:'قالت طالبة: مساحة الطاولة = 2 م.',options:['نكتب 2 م² لأن المساحة بوحدة مربعة','نكتب 2 لتر','الإجابة 2 م صحيحة للمساحة'],correctIndex:0,explanation:'وحدات المساحة مربعة مثل سم² وم².'},
  {objectiveId:3,kind:'apply',interaction:'match',quality:'direct',prompt:'اربطي كل سطح بوحدة مساحة مناسبة لحجمه.',targets:['سم²','م²'],pairs:[{item:'بطاقة صغيرة',target:'سم²'},{item:'صفحة دفتر',target:'سم²'},{item:'غرفة',target:'م²'},{item:'ساحة صفية',target:'م²'}]}
 ],
 'g7-math-multiply-divide-integers':[
  {objectiveId:1,kind:'compare',interaction:'match',quality:'direct',prompt:'حددي إشارة الناتج قبل الحساب.',targets:['موجب','سالب'],pairs:[{item:'(-4) × (-3)',target:'موجب'},{item:'(-4) × 3',target:'سالب'},{item:'12 ÷ (-3)',target:'سالب'},{item:'(-12) ÷ (-3)',target:'موجب'}]},
  {objectiveId:2,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'اكتشفي خطأ الإشارة.',statement:'قالت طالبة: (-5) × (-2) = -10 لأن العددين سالبان.',options:['الصحيح +10 لأن الإشارتين متماثلتان','الصحيح -7','الإجابة -10 صحيحة'],correctIndex:0,explanation:'في الضرب أو القسمة، الإشارتان المتماثلتان تعطيان ناتجًا موجبًا.'},
  {objectiveId:3,kind:'apply',interaction:'short_text',quality:'direct',prompt:'احسبي 24 ÷ (-6). اكتبي أولًا إشارة الناتج، ثم قيمة القسمة.'}
 ],
 'g7-math-proportion':[
  {objectiveId:1,kind:'compare',interaction:'match',quality:'direct',prompt:'صنّفي زوجي النسب: هل يمثلان تناسبًا أم لا؟',targets:['متناسبتان','غير متناسبتين'],pairs:[{item:'2/3 و 4/6',target:'متناسبتان'},{item:'1/2 و 3/6',target:'متناسبتان'},{item:'2/3 و 5/6',target:'غير متناسبتين'}]},
  {objectiveId:2,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي خطوات التحقق بالضرب التبادلي.',orderItems:['نحدد طرفي النسبتين','نحسب حاصل الضرب التبادلي الأول والثاني','نقارن حاصلَي الضرب','إذا تساويا فالنسبتان متناسبتان']},
  {objectiveId:3,kind:'apply',interaction:'short_text',quality:'direct',prompt:'إذا كان 4/5 = x/15، أوجدي x واكتبي خطوة الضرب التبادلي التي استخدمتها.'}
 ],
 'g7-science-average-speed':[
  {objectiveId:1,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي العلاقة التي نحتاجها لحساب السرعة المتوسطة.',orderItems:['نجمع المسافة الكلية','نجمع الزمن الكلي','نقسم المسافة الكلية على الزمن الكلي']},
  {objectiveId:2,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي هذه الإجابة من ناحية الحساب والوحدة.',statement:'قطع جسم 100 م في 20 ث، فكتب طالب: السرعة = 20 ÷ 100 = 0.2 ث/م.',options:['الصحيح 100 ÷ 20 = 5 م/ث','الصحيح 100 × 20 = 2000 م·ث','الإجابة صحيحة'],correctIndex:0,explanation:'السرعة المتوسطة = المسافة ÷ الزمن، ووحدتها هنا متر لكل ثانية.'},
  {objectiveId:3,kind:'explain',interaction:'experiment_choice',quality:'direct',prompt:'شاهدي الرحلة ثم اختاري الاستنتاج الأدق.',observation:'تحرك جسم ببطء في جزء من الرحلة وبسرعة أكبر في جزء آخر، لكنه قطع 120 م خلال 20 ث.',options:['سرعته المتوسطة 6 م/ث ولا يعني ذلك أنه تحرك بسرعة 6 طوال الوقت','لا يمكن حساب سرعة متوسطة لأن السرعة تغيرت','كانت سرعته 6 م/ث في كل لحظة حتمًا'],correctIndex:0,explanation:'السرعة المتوسطة تعتمد على المسافة الكلية والزمن الكلي، ولا تعني ثبات السرعة لحظة بلحظة.'}
 ]
};
