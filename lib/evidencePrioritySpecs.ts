import type {ExplicitEvidenceSpec} from './evidenceSpecs';

const specs:Record<string,ExplicitEvidenceSpec[]>={
 'g5-math-prime-numbers':[
  {objectiveId:1,kind:'compare',interaction:'match',quality:'direct',prompt:'صنّفي الأعداد إلى أولية وغير أولية.',targets:['أولي','غير أولي'],pairs:[{item:'2',target:'أولي'},{item:'7',target:'أولي'},{item:'9',target:'غير أولي'},{item:'15',target:'غير أولي'}]},
  {objectiveId:2,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'اكتشفي الخطأ في الحكم على العدد.',statement:'العدد 21 أولي لأنه عدد فردي.',options:['21 غير أولي لأن 3 × 7 = 21','21 أولي لأن كل عدد فردي أولي','21 أولي لأنه أكبر من 20'],correctIndex:0,explanation:'كون العدد فرديًا لا يكفي؛ العدد الأولي له عاملان فقط: 1 ونفسه.'},
  {objectiveId:3,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي طريقة التحقق من أن عددًا ما أولي.',orderItems:['أفحص هل له قواسم غير 1 ونفسه','إذا وجدت قاسمًا آخر فهو غير أولي','إذا لم أجد قاسمًا آخر فهو أولي']}
 ],
 'g5-math-gcf':[
  {objectiveId:1,kind:'apply',interaction:'match',quality:'direct',prompt:'اربطي كل عدد بقائمة عوامل صحيحة له.',targets:['1، 2، 3، 6','1، 2، 4، 8','1، 3، 9'],pairs:[{item:'6',target:'1، 2، 3، 6'},{item:'8',target:'1، 2، 4، 8'},{item:'9',target:'1، 3، 9'}]},
  {objectiveId:2,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي خطوات إيجاد القاسم المشترك الأكبر لعددين.',orderItems:['أكتب عوامل العدد الأول','أكتب عوامل العدد الثاني','أحدد العوامل المشتركة','أختار أكبر عامل مشترك']},
  {objectiveId:3,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي اختيار القاسم المشترك الأكبر.',statement:'عوامل 12 و18 المشتركة هي 1،2،3،6؛ إذن GCF = 3.',options:['الصحيح GCF = 6 لأنه أكبر عامل مشترك','الصحيح GCF = 18 لأنه الأكبر','الصحيح GCF = 1 دائمًا'],correctIndex:0,explanation:'نختار أكبر قيمة من العوامل المشتركة، وهي 6.'}
 ],
 'g5-math-lcm':[
  {objectiveId:1,kind:'apply',interaction:'match',quality:'direct',prompt:'اربطي كل عدد ببدايات مضاعفاته الصحيحة.',targets:['4، 8، 12، 16','6، 12، 18، 24','5، 10، 15، 20'],pairs:[{item:'4',target:'4، 8، 12، 16'},{item:'6',target:'6، 12، 18، 24'},{item:'5',target:'5، 10، 15، 20'}]},
  {objectiveId:2,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي خطوات إيجاد المضاعف المشترك الأصغر.',orderItems:['أكتب مضاعفات العدد الأول','أكتب مضاعفات العدد الثاني','أحدد أول مضاعف يظهر في القائمتين','أختار أصغر مضاعف مشترك']},
  {objectiveId:3,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي هذا الاستنتاج.',statement:'أول مضاعفات 4 و6 المشتركة هي 12 و24؛ إذن LCM = 24.',options:['الصحيح LCM = 12 لأنه أصغر مضاعف مشترك','الصحيح LCM = 6 لأنه أصغر عدد','الصحيح LCM = 4'],correctIndex:0,explanation:'المطلوب أصغر مضاعف مشترك، وأول قيمة مشتركة هنا هي 12.'}
 ],
 'g5-math-decimal-multiplication':[
  {objectiveId:1,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي طريقة ضرب عددين عشريين.',orderItems:['أضرب الأرقام مؤقتًا كأنها أعداد صحيحة','أعدّ المنازل العشرية في العاملين','أضع الفاصلة في الناتج بعدد المنازل نفسه']},
  {objectiveId:2,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'اكتشفي خطأ موضع الفاصلة.',statement:'2.4 × 3 = 72.',options:['الصحيح 7.2 لأن 24 × 3 = 72 ثم نعيد منزلة عشرية واحدة','الصحيح 0.72','الإجابة 72 صحيحة'],correctIndex:0,explanation:'في 2.4 منزلة عشرية واحدة، لذلك يكون الناتج 7.2.'},
  {objectiveId:3,kind:'compare',interaction:'match',quality:'direct',prompt:'اربطي كل عملية بتقدير مناسب لناتجها.',targets:['حوالي 6','حوالي 15','أقل من 1'],pairs:[{item:'2.1 × 3',target:'حوالي 6'},{item:'4.9 × 3',target:'حوالي 15'},{item:'0.2 × 3',target:'أقل من 1'}]}
 ],
 'g5-math-decimal-division':[
  {objectiveId:1,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي طريقة القسمة عندما يكون المقسوم عليه عشريًا.',orderItems:['أحرك الفاصلة في المقسوم عليه حتى يصبح عددًا صحيحًا','أحرك الفاصلة في المقسوم العدد نفسه من المنازل','أجري القسمة الجديدة المكافئة']},
  {objectiveId:2,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي تحويل عملية القسمة.',statement:'4.8 ÷ 0.6 تصبح 4.8 ÷ 6 بعد تحريك فاصلة المقسوم عليه فقط.',options:['يجب أن تصبح 48 ÷ 6 لأننا نحرك الفاصلة في العددين','تصبح 4.8 ÷ 6 فعلًا','تصبح 0.48 ÷ 6'],correctIndex:0,explanation:'نضرب المقسوم والمقسوم عليه في القوة نفسها من 10 حتى تبقى قيمة القسمة مكافئة.'},
  {objectiveId:3,kind:'compare',interaction:'match',quality:'direct',prompt:'اربطي كل قسمة بتقدير منطقي للناتج.',targets:['أكبر من 1','يساوي 1','أقل من 1'],pairs:[{item:'6 ÷ 0.5',target:'أكبر من 1'},{item:'3 ÷ 3',target:'يساوي 1'},{item:'0.4 ÷ 2',target:'أقل من 1'}]}
 ],
 'g5-math-triangles':[
  {objectiveId:1,kind:'compare',interaction:'match',quality:'direct',prompt:'صنّفي المثلث بحسب نوع زواياه.',targets:['حاد الزوايا','قائم الزاوية','منفرج الزاوية'],pairs:[{item:'زواياه 60°،60°،60°',target:'حاد الزوايا'},{item:'فيه زاوية 90°',target:'قائم الزاوية'},{item:'فيه زاوية 110°',target:'منفرج الزاوية'}]},
  {objectiveId:2,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي الحكم على المثلث.',statement:'مثلث زواياه 30°،60°،90° هو مثلث حاد لأن فيه زاويتين حادتين.',options:['هو قائم الزاوية لأن فيه زاوية 90°','هو منفرج لأن 60 أكبر من 30','هو حاد فعلًا'],correctIndex:0,explanation:'وجود زاوية قائمة واحدة يكفي لتصنيف المثلث قائم الزاوية.'},
  {objectiveId:3,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي طريقة تصنيف مثلث من زواياه.',orderItems:['أبحث أولًا عن زاوية 90° أو أكبر منها','إذا وجدت 90° فهو قائم وإذا وجدت أكبر فهو منفرج','إذا كانت الزوايا الثلاث أقل من 90° فهو حاد']}
 ],
 'g5-math-nets':[
  {objectiveId:1,kind:'compare',interaction:'match',quality:'direct',prompt:'اربطي شكل الأوجه بالمجسم الذي يمكن أن تكوّنه.',targets:['مكعب','منشور ثلاثي','هرم رباعي'],pairs:[{item:'6 مربعات متساوية',target:'مكعب'},{item:'مثلثان + 3 مستطيلات',target:'منشور ثلاثي'},{item:'مربع + 4 مثلثات',target:'هرم رباعي'}]},
  {objectiveId:2,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي فكرة الشبكة.',statement:'أي ترتيب لستة مربعات منفصلة يصلح شبكة لمكعب.',options:['يجب أن تكون المربعات متصلة بترتيب يسمح بطيها دون تداخل','كل ستة مربعات تصلح مهما كان ترتيبها','شبكة المكعب تحتاج أربع دوائر'],correctIndex:0,explanation:'ليس عدد الأوجه وحده كافيًا؛ طريقة اتصال الأوجه تحدد هل يمكن طي الشبكة إلى مجسم.'},
  {objectiveId:3,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي طريقة فحص شبكة قبل اختيار المجسم.',orderItems:['أحدد أشكال الأوجه وعددها','أتخيل طي الأوجه حول الحواف المشتركة','أتحقق أن الأوجه تغلق المجسم بلا تداخل']}
 ],
 'g7-math-integer-order':[
  {objectiveId:1,kind:'compare',interaction:'match',quality:'direct',prompt:'صنّفي موضع الأعداد بالنسبة إلى الصفر.',targets:['يسار الصفر','عند الصفر','يمين الصفر'],pairs:[{item:'-5',target:'يسار الصفر'},{item:'0',target:'عند الصفر'},{item:'4',target:'يمين الصفر'}]},
  {objectiveId:2,kind:'construct',interaction:'order',quality:'direct',prompt:'رتّبي هذه الأعداد من الأصغر إلى الأكبر.',orderItems:['-7','-2','0','3','8']},
  {objectiveId:3,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي المقارنة بين عددين سالبين.',statement:'-8 أكبر من -3 لأن 8 أكبر من 3.',options:['الصحيح -8 أصغر من -3 لأنه يقع أكثر إلى اليسار','العبارة صحيحة','العددان متساويان'],correctIndex:0,explanation:'على خط الأعداد، العدد الواقع أكثر إلى اليسار هو الأصغر.'}
 ],
 'g7-science-distance-displacement':[
  {objectiveId:1,kind:'compare',interaction:'match',quality:'direct',prompt:'صنّفي الوصف إلى مسافة أو إزاحة.',targets:['مسافة','إزاحة'],pairs:[{item:'طول الطريق كله الذي سارته الطالبة',target:'مسافة'},{item:'أقصر تغير من نقطة البداية إلى النهاية مع الاتجاه',target:'إزاحة'}]},
  {objectiveId:2,kind:'explain',interaction:'experiment_choice',quality:'direct',prompt:'شاهدي المسار ثم اختاري الاستنتاج الأدق.',observation:'سارت طالبة 3 م شرقًا ثم 3 م غربًا وعادت إلى نقطة البداية.',options:['المسافة 6 م والإزاحة 0 م','المسافة 0 م والإزاحة 6 م','المسافة والإزاحة 6 م'],correctIndex:0,explanation:'المسافة تجمع طول الطريق، أما الإزاحة فتعتمد على موضعي البداية والنهاية واتجاه التغير.'},
  {objectiveId:3,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي هذا الاستنتاج.',statement:'إذا قطعت سيّارة طريقًا منحنيًا بين مدينتين فالمسافة والإزاحة متساويتان دائمًا.',options:['قد تختلفان لأن المسافة تتبع الطريق بينما الإزاحة تصف التغير المباشر بين البداية والنهاية','هما متساويتان دائمًا','الإزاحة دائمًا أكبر من المسافة'],correctIndex:0,explanation:'المسافة تعتمد على المسار الفعلي، والإزاحة تعتمد على البداية والنهاية.'}
 ],
 'g7-science-newton-first-law':[
  {objectiveId:1,kind:'explain',interaction:'experiment_choice',quality:'direct',prompt:'اختاري ما يطابق الملاحظة.',observation:'كتاب ساكن على طاولة ولم تؤثر فيه قوة محصلة تغيّر حالته.',options:['يبقى ساكنًا ما لم تؤثر قوة محصلة','يبدأ بالحركة وحده بعد مدة','يختفي وزنه'],correctIndex:0,explanation:'الجسم يحافظ على حالته الحركية ما لم تؤثر فيه قوة محصلة.'},
  {objectiveId:2,kind:'correct_error',interaction:'error_fix',quality:'direct',prompt:'صححي معنى القصور الذاتي.',statement:'القصور الذاتي يعني أن الجسم المتحرك يحتاج دائمًا قوة مستمرة حتى يستمر في الحركة بسرعة ثابتة.',options:['إذا كانت القوة المحصلة صفرًا يمكنه الاستمرار بسرعة ثابتة في خط مستقيم','لا يمكن لأي جسم أن يستمر بالحركة','القصور يعني أن السرعة تزداد دائمًا'],correctIndex:0,explanation:'قانون نيوتن الأول يربط تغير الحركة بوجود قوة محصلة، لا بمجرد وجود حركة.'},
  {objectiveId:3,kind:'compare',interaction:'match',quality:'direct',prompt:'اربطي الحالة بالنتيجة المتوقعة عندما تكون القوة المحصلة صفرًا.',targets:['يبقى ساكنًا','يستمر بسرعة ثابتة'],pairs:[{item:'جسم ساكن أصلًا',target:'يبقى ساكنًا'},{item:'جسم يتحرك بسرعة ثابتة في خط مستقيم',target:'يستمر بسرعة ثابتة'}]}
 ]
};

export function getPriorityEvidenceSpecs(lessonId:string){return specs[lessonId]||null}
