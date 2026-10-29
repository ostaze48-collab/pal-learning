export type TeachingVisualKind=
 'cell_zoom'|'cell_compare'|'cell_parts'|'filter_lab'|'magnet_lab'|'evaporation_lab'|
 'integer_context'|'number_line'|'integer_motion'|'pronoun_swap'|'question_blocks'|'do_does'|
 'factor_tree'|'fraction_bar'|'decimal_grid'|'geometry_lab'|'data_chart'|'proportion_lab'|'faded_math'|'faded_science'|
 'motion_lab'|'force_lab'|'atom_builder'|'reaction_lab'|'pressure_lab'|
 'arabic_pattern'|'hamza_lab'|'tense_timeline'|
 'material_properties'|'energy_flow'|'reading_lens'|'word_builder'|'punctuation_lab'|'comparison_scale';

export type TeachingVisualPurpose='representation'|'exploration'|'guided_application';
export type TeachingScaffoldLevel='full'|'guided'|'faded';
export type TeachingVisualSpec={kind:TeachingVisualKind;variant?:string;purpose?:TeachingVisualPurpose;scaffold?:TeachingScaffoldLevel};

const visuals:Record<string,TeachingVisualSpec>={
 'g5-science-cell-types:1:2':{kind:'cell_zoom'},
 'g5-science-cell-types:2:1':{kind:'cell_compare'},
 'g5-science-cell-types:3:1':{kind:'cell_parts'},
 'g5-science-cell-types:3:2':{kind:'cell_parts'},
 'g5-science-cell-types:4:1':{kind:'cell_compare'},
 'g5-science-separation-methods:1:2':{kind:'filter_lab'},
 'g5-science-separation-methods:2:1':{kind:'magnet_lab'},
 'g5-science-separation-methods:4:1':{kind:'evaporation_lab'},
 'g7-math-integers:1:1':{kind:'integer_context'},
 'g7-math-integers:2:1':{kind:'number_line'},
 'g7-math-integers:2:2':{kind:'number_line'},
 'g7-math-integers:3:1':{kind:'number_line'},
 'g7-math-add-subtract-integers:1:1':{kind:'integer_motion',variant:'-3,+5'},
 'g7-math-add-subtract-integers:2:1':{kind:'integer_motion',variant:'-7,-2'},
 'g7-math-add-subtract-integers:3:1':{kind:'integer_motion',variant:'4,+2'},
 'g5-ar-noun-types:2:1':{kind:'pronoun_swap'},
 'g5-ar-noun-types:2:2':{kind:'word_builder',variant:'g5-ar-noun-types|2|2'},
 'g7-en-question-order:1:1':{kind:'question_blocks'},
 'g7-en-question-order:2:2':{kind:'do_does'}
};

function stageMeta(sceneNumber:number){
 if(sceneNumber>=3)return {purpose:'guided_application' as const,scaffold:'faded' as const};
 if(sceneNumber===2)return {purpose:'exploration' as const,scaffold:'guided' as const};
 return {purpose:'representation' as const,scaffold:'full' as const};
}
function staged(kind:TeachingVisualKind,variant:string|undefined,sceneNumber:number):TeachingVisualSpec{return {kind,variant,...stageMeta(sceneNumber)}}
function isMathFadedLesson(lessonId:string){return /prime|factor|gcf|lcm|fraction|decimal|integer|absolute-value|triangle|area|rectangle|square|net|prism|cube|quadrilateral|pyramid|cartesian|reflection|translation|data|statistics|frequency|mean|median|mode|range|graph|chart|proportion|ratio|scale/.test(lessonId)}
function isScienceFadedLesson(lessonId:string){return /cell-types|materials-properties|separation-methods|physical-chemical-changes|energy-forms|energy-transformations|energy-environment|translational-motion|distance-displacement|average-speed|constant-acceleration|newton|force|atom-structure|element-compound|important-compounds|chemical-reactions|atmospheric-pressure/.test(lessonId)}
function isEnglishFadedLesson(lessonId:string){return /^g[57]-en-/.test(lessonId)&&!/-check$/.test(lessonId)}

function fallbackVisual(lessonId:string,objectiveId:number,sceneNumber:number):TeachingVisualSpec|null{
 if(sceneNumber<1||sceneNumber>3)return null;
 const variant=`${lessonId}|${objectiveId}|${sceneNumber}`;
 if(sceneNumber===3){if(isMathFadedLesson(lessonId)||isScienceFadedLesson(lessonId)||isEnglishFadedLesson(lessonId))return staged('faded_math',variant,sceneNumber);return null}

 if(/prime|factor|gcf|lcm/.test(lessonId))return staged('factor_tree',variant,sceneNumber);
 if(/fraction/.test(lessonId))return staged('fraction_bar',variant,sceneNumber);
 if(/decimal/.test(lessonId))return staged(sceneNumber===2?'fraction_bar':'decimal_grid',variant,sceneNumber);
 if(/integer|absolute-value/.test(lessonId)){
  if(/add-subtract|multiply-divide/.test(lessonId))return sceneNumber===1?{kind:'integer_motion',variant:'-3,+5',...stageMeta(sceneNumber)}:staged('number_line',variant,sceneNumber);
  return staged(sceneNumber===2?'integer_context':'number_line',variant,sceneNumber);
 }
 if(/triangle|area|rectangle|square|net|prism|cube|quadrilateral|pyramid|cartesian|reflection|translation/.test(lessonId))return staged('geometry_lab',variant,sceneNumber);
 if(/data|statistics|frequency|mean|median|mode|range|graph|chart/.test(lessonId))return staged('data_chart',variant,sceneNumber);
 if(/proportion|ratio|scale/.test(lessonId))return staged('proportion_lab',variant,sceneNumber);

 if(/cell/.test(lessonId)){
  if(sceneNumber===2)return staged(objectiveId===1?'cell_zoom':objectiveId===2?'cell_parts':'cell_compare',variant,sceneNumber);
  return staged(objectiveId%2===0?'cell_compare':'cell_zoom',variant,sceneNumber);
 }
 if(/materials-properties/.test(lessonId))return staged('material_properties',variant,sceneNumber);
 if(/energy-forms|energy-transformations|energy-environment/.test(lessonId))return staged('energy_flow',variant,sceneNumber);
 if(/translational-motion|distance-displacement|average-speed|constant-acceleration/.test(lessonId))return staged('motion_lab',variant,sceneNumber);
 if(/newton|force/.test(lessonId))return staged('force_lab',variant,sceneNumber);
 if(/atom|element|compound/.test(lessonId))return staged('atom_builder',variant,sceneNumber);
 if(/reaction|chemical-change|physical-chemical/.test(lessonId))return staged('reaction_lab',variant,sceneNumber);
 if(/pressure/.test(lessonId))return staged('pressure_lab',variant,sceneNumber);

 if(/reading|poem|teacher-merit/.test(lessonId))return staged('reading_lens',variant,sceneNumber);
 if(/hamza|solar-lunar|ta-spelling|ta-marbuta|haa/.test(lessonId))return sceneNumber===1?staged('hamza_lab',variant,sceneNumber):null;
 if(/noun|pronoun|verb|definite|indefinite|inflection|built|building-signs/.test(lessonId))return staged(sceneNumber===1?'arabic_pattern':'word_builder',variant,sceneNumber);

 if(/comparative/.test(lessonId))return staged(sceneNumber===1?'comparison_scale':'word_builder',variant,sceneNumber);
 if(/punctuation/.test(lessonId))return staged(sceneNumber===1?'punctuation_lab':'word_builder',variant,sceneNumber);
 if(/question-order|which-or/.test(lessonId))return sceneNumber===1?{kind:'question_blocks',variant:'does-base',...stageMeta(sceneNumber)}:staged('word_builder',variant,sceneNumber);
 if(/present|past|future|perfect|continuous|adverbs-frequency|stative|just-already-yet/.test(lessonId))return staged(sceneNumber===1?'tense_timeline':'word_builder',variant,sceneNumber);
 if(/new-friends|mini-olympics|holidays|basketball|animal-magic|keep-in-touch|sport-report|directions|reflexive|message-friend/.test(lessonId))return staged(sceneNumber===1?'word_builder':'reading_lens',variant,sceneNumber);
 return null;
}

export function getTeachingVisual(lessonId:string,objectiveId:number,sceneNumber:number){
 const explicit=visuals[`${lessonId}:${objectiveId}:${sceneNumber}`];
 return explicit?{...explicit,...stageMeta(sceneNumber)}:fallbackVisual(lessonId,objectiveId,sceneNumber);
}