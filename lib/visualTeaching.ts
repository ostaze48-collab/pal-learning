import type {Lesson} from './data';

export type VisualStrategy=
  |'number_line'
  |'fraction_model'
  |'factor_tree'
  |'geometry'
  |'sequence'
  |'compare'
  |'cause_effect'
  |'sentence_pattern'
  |'timeline'
  |'concept_map';

export type VisualPlan={strategy:VisualStrategy;label:string;reason:string};

function textOf(lesson:Lesson){
  return [lesson.title,lesson.summary,...lesson.learningPoints,lesson.example].join(' ').toLowerCase();
}

export function chooseVisualStrategy(lesson:Lesson):VisualPlan{
  const text=textOf(lesson);
  const id=lesson.id.toLowerCase();

  if(id.includes('prime')||text.includes('عامل أولي')||text.includes('عوامل أولية'))
    return {strategy:'factor_tree',label:'شجرة عوامل',reason:'التفكيك إلى أجزاء أصغر يُفهم أفضل كشجرة.'};

  if(text.includes('كسر')||text.includes('fraction')||text.includes('بسط')||text.includes('مقام'))
    return {strategy:'fraction_model',label:'نموذج أجزاء',reason:'الكسور تحتاج رؤية الجزء مقارنة بالكل.'};

  if(text.includes('عدد صحيح')||text.includes('سالب')||text.includes('موجب')||text.includes('خط الأعداد')||text.includes('موضع')||text.includes('إزاحة'))
    return {strategy:'number_line',label:'خط أعداد/مواضع',reason:'الموضع والاتجاه والقيمة النسبية تظهر أوضح على خط.'};

  if(text.includes('مثلث')||text.includes('زاوية')||text.includes('مساحة')||text.includes('محيط')||text.includes('مجسم')||text.includes('منشور')||text.includes('شبكة'))
    return {strategy:'geometry',label:'رسم هندسي',reason:'الشكل والعلاقات المكانية تحتاج تمثيلًا بصريًا.'};

  if(lesson.subject==='English'){
    if(text.includes('present')||text.includes('past')||text.includes('perfect')||text.includes('frequency')||text.includes('tense'))
      return {strategy:'timeline',label:'خط زمني',reason:'الزمن اللغوي يصبح أوضح عندما نربطه بموقع الحدث في الزمن.'};
    return {strategy:'sentence_pattern',label:'بنية الجملة',reason:'تلوين أجزاء الجملة يساعد على رؤية النمط بدل حفظ القاعدة.'};
  }

  if(lesson.subject==='اللغة العربية'){
    if(text.includes('زمن')||text.includes('ماض')||text.includes('مضارع')||text.includes('أمر'))
      return {strategy:'timeline',label:'خط زمني',reason:'أزمنة الفعل تُفهم أفضل بربطها بالزمن.'};
    return {strategy:'sentence_pattern',label:'بنية لغوية ملوّنة',reason:'تمييز أجزاء الكلمة أو الجملة بصريًا يقلل الحمل على الذاكرة.'};
  }

  if(lesson.subject==='العلوم والحياة'){
    if(text.includes('سبب')||text.includes('نتيجة')||text.includes('قوة')||text.includes('ضغط')||text.includes('تغير')||text.includes('تحول')||text.includes('طاقة'))
      return {strategy:'cause_effect',label:'سبب ← نتيجة',reason:'العلاقة السببية هي محور الفكرة العلمية.'};
    if(text.includes('فرق')||text.includes('مقارنة')||text.includes('نوع'))
      return {strategy:'compare',label:'مقارنة بصرية',reason:'تمييز الصفات المتشابهة والمختلفة أسهل في بطاقتين متقابلتين.'};
    return {strategy:'concept_map',label:'خريطة مفهوم',reason:'ربط الفكرة بأجزائها ووظيفتها يبني تصورًا متماسكًا.'};
  }

  if(text.includes('خطوة')||text.includes('أولًا')||text.includes('ثم')||text.includes('طريقة')||text.includes('عملية'))
    return {strategy:'sequence',label:'خطوات متسلسلة',reason:'المهارة الإجرائية تحتاج ترتيبًا بصريًا واضحًا.'};

  if(text.includes('قارن')||text.includes('أكبر')||text.includes('أصغر')||text.includes('فرق'))
    return {strategy:'compare',label:'مقارنة بصرية',reason:'المقارنة تُفهم أسرع عندما توضع القيم أو الأفكار جنبًا إلى جنب.'};

  return {strategy:'concept_map',label:'خريطة مفهوم',reason:'نبدأ من الفكرة الرئيسة ثم نربط بها أهم النقاط.'};
}
