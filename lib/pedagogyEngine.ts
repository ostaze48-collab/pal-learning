export type PedagogyPlan={level:'rebuild'|'guided'|'independent';method:string;sequence:string[];feedbackRule:string;cognitiveLoad:string;retrievalRule:string};

export function buildPedagogyPlan(subject:string,subjectMastery:number|null|undefined,hasBlockingGap:boolean,requestedMode:string):PedagogyPlan{
  const mastery=typeof subjectMastery==='number'?subjectMastery:70;
  const level:PedagogyPlan['level']=hasBlockingGap||mastery<55?'rebuild':mastery<82?'guided':'independent';
  let method='التدرج من مثال واضح إلى تطبيق مستقل';
  let sequence=['اربط بالمعلوم السابق','اشرح الفكرة','اعرض مثالًا محلولًا','اطلب محاولة قصيرة','تحقق من الفهم'];

  if(subject==='الرياضيات'){
    method=level==='rebuild'?'محسوس/تصويري/رمزي + مثال محلول كامل':level==='guided'?'مثال محلول ثم إكمال خطوات ناقصة ثم مسألة مستقلة':'استرجاع نشط + تنويع أمثلة + مسألة نقل تعلم';
    sequence=level==='rebuild'?
      ['ابدأ بمعنى الكمية أو العملية بلغة بسيطة','مثّل الفكرة بصريًا أو بأشياء قابلة للتخيل','حوّل التمثيل إلى الرموز الرياضية','حل مثالًا خطوة بخطوة مع تفسير سبب كل خطوة','اطلب سؤالًا مشابهًا مع دعم','تحقق بسؤال جديد مختلف قليلًا']:
      ['استرجع القاعدة السابقة بسؤال قصير','اعرض مثالًا واحدًا محلولًا','اجعل الطالبة تكمل خطوة أو خطوتين','اعرض مثالًا متنوعًا يمنع الحفظ الآلي','اطلب تطبيقًا مستقلًا','صحح الخطأ من جذره إن ظهر'];
  }else if(subject==='العلوم والحياة'){
    method=level==='rebuild'?'ظاهرة ملموسة → ملاحظة → سبب ونتيجة → مفهوم':'توقع → دليل → تفسير علمي → تطبيق';
    sequence=['ابدأ بظاهرة أو موقف يمكن تخيله','اسأل ماذا نلاحظ قبل التفسير','اطلب توقعًا بسيطًا','قدّم الدليل أو المعلومة العلمية','اربط الدليل بالمفهوم','استخدم مثالًا ومثالًا مضادًا','تحقق بسؤال لماذا/كيف'];
  }else if(subject==='اللغة العربية'){
    method=level==='rebuild'?'سياق ومعنى أولًا ثم القاعدة':'سياق → ملاحظة النمط → تسمية القاعدة → تطبيق';
    sequence=['ابدأ بجملة أو سياق مفهوم','وضح المفردات التي قد تعيق الفهم','اجعل الطالبة تلاحظ النمط بنفسها','سمِّ القاعدة بعد فهم معناها','اعرض مثالين ومثالًا مضادًا','اطلب إنتاج جملة أو تفسير قصير'];
  }else if(subject==='English'){
    method=level==='rebuild'?'Comprehensible input + model sentence + guided practice':'Model → notice pattern → guided practice → short production';
    sequence=['استخدم English بسيطًا يمكن فهمه من السياق','قدّم model sentence واضحًا','وضح المعنى بالعربية فقط عند الحاجة','لفت الانتباه للنمط اللغوي دون إغراق بالقواعد','استخدم substitution أو matching قصير','اطلب إنتاج جملة قصيرة','صحح المعنى أولًا ثم الشكل'];
  }

  if(requestedMode==='simplify')sequence=['قلل المصطلحات إلى الحد الأدنى','قسّم الفكرة إلى أصغر خطوات ممكنة',...sequence.slice(0,4)];
  if(requestedMode==='analogy')sequence=['ابدأ بتشبيه مألوف مناسب للعمر','حدد أين يشبه التشبيه المفهوم وأين يختلف',...sequence.slice(1)];
  if(requestedMode==='real_world')sequence=['ابدأ بموقف حياتي قريب','استخرج الفكرة التعليمية من الموقف',...sequence.slice(1)];
  if(requestedMode==='deep')sequence=[...sequence,'أضف امتدادًا واحدًا أعمق فقط بعد تثبيت الأساس'];

  return {
    level,method,sequence,
    feedbackRule:level==='rebuild'?'صحح سوء الفهم فورًا بمثال أصغر ولا تنتقل حتى يظهر دليل فهم':'استخدم تلميحًا أولًا، ثم تفسيرًا إذا استمر الخطأ',
    cognitiveLoad:level==='rebuild'?'فكرة واحدة في كل مرة، أمثلة قليلة واضحة، وتجنب الشرح الطويل المتصل':'قسم الشرح إلى وحدات قصيرة مع سؤال استرجاع بين الوحدات',
    retrievalRule:'لا تعتبر القراءة دليل فهم؛ اطلب من الطالبة استرجاع الفكرة أو تطبيقها دون نسخ قبل الانتقال'
  };
}
