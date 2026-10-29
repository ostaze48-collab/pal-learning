import {getLesson} from './data';
import type {TeachingVisualKind} from './teachingVisuals';

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

export function getMisconceptions(lessonId:string,objectiveId?:number){return specs.filter(x=>x.lessonId===lessonId&&(objectiveId===undefined||x.objectiveId===objectiveId))}
export function getPrimaryMisconception(lessonId:string,objectiveId:number){return getMisconceptions(lessonId,objectiveId)[0]||null}
export function detectMisconceptionFromChoice(lessonId:string,questionId:string,selectedIndex:number){return specs.find(spec=>spec.lessonId===lessonId&&spec.detection.some(d=>d.signal==='wrong_choice'&&d.questionId===questionId&&(!d.wrongOptionIndexes||d.wrongOptionIndexes.includes(selectedIndex))))||null}
export function validateMisconceptionLibrary(){
 const issues:string[]=[];const ids=new Set<string>();
 for(const spec of specs){
  if(ids.has(spec.id))issues.push(`duplicate misconception id: ${spec.id}`);ids.add(spec.id);
  const lesson=getLesson(spec.lessonId);if(!lesson){issues.push(`${spec.id}: missing lesson ${spec.lessonId}`);continue}
  const objectiveCount=Math.max(1,lesson.learningPoints.length);if(spec.objectiveId<1||spec.objectiveId>objectiveCount)issues.push(`${spec.id}: objective ${spec.objectiveId} outside 1..${objectiveCount}`);
  for(const detection of spec.detection)if(detection.questionId&&!lesson.questions.some(q=>q.id===detection.questionId))issues.push(`${spec.id}: missing question ${detection.questionId}`);
  if(spec.recheck.options&&(!Number.isInteger(spec.recheck.correctIndex)||Number(spec.recheck.correctIndex)<0||Number(spec.recheck.correctIndex)>=spec.recheck.options.length))issues.push(`${spec.id}: invalid recheck correctIndex`);
 }
 return {count:specs.length,issues};
}
