export type TeachingVisualKind=
 'cell_zoom'|'cell_compare'|'cell_parts'|'filter_lab'|'magnet_lab'|'evaporation_lab'|
 'integer_context'|'number_line'|'integer_motion'|'pronoun_swap'|'question_blocks'|'do_does'|
 'factor_tree'|'fraction_bar'|'decimal_grid'|'geometry_lab'|'data_chart'|'proportion_lab'|
 'motion_lab'|'force_lab'|'atom_builder'|'reaction_lab'|'pressure_lab'|
 'arabic_pattern'|'hamza_lab'|'tense_timeline'|
 'material_properties'|'energy_flow'|'reading_lens'|'word_builder'|'punctuation_lab'|'comparison_scale';

export type TeachingVisualSpec={kind:TeachingVisualKind;variant?:string};

const visuals:Record<string,TeachingVisualSpec>={
 'g5-science-cell-types:1:2':{kind:'cell_zoom'},
 'g5-science-cell-types:2:1':{kind:'cell_compare'},
 'g5-science-cell-types:3:1':{kind:'cell_parts'},
 'g5-science-cell-types:3:2':{kind:'cell_parts'},
 'g5-science-cell-types:3:3':{kind:'cell_parts'},
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
 'g5-ar-noun-types:2:2':{kind:'pronoun_swap'},
 'g7-en-question-order:1:1':{kind:'question_blocks'},
 'g7-en-question-order:2:2':{kind:'do_does'}
};

function fallbackVisual(lessonId:string,objectiveId:number,sceneNumber:number):TeachingVisualSpec|null{
 if(sceneNumber<1||sceneNumber>2)return null;
 const variant=`${lessonId}|${objectiveId}|${sceneNumber}`;

 if(/prime|factor|gcf|lcm/.test(lessonId))return {kind:'factor_tree',variant};
 if(/fraction/.test(lessonId))return {kind:'fraction_bar',variant};
 if(/decimal/.test(lessonId))return sceneNumber===1?{kind:'decimal_grid',variant}:{kind:'fraction_bar',variant};
 if(/integer|absolute-value/.test(lessonId)){
  if(/add-subtract|multiply-divide/.test(lessonId))return sceneNumber===1?{kind:'integer_motion',variant:'-3,+5'}:{kind:'number_line',variant};
  return sceneNumber===1?{kind:'number_line',variant}:{kind:'integer_context',variant};
 }
 if(/triangle|area|rectangle|square|net|prism|cube|quadrilateral|pyramid|cartesian|reflection|translation/.test(lessonId))return {kind:'geometry_lab',variant};
 if(/data|statistics|frequency|mean|median|mode|range|graph|chart/.test(lessonId))return {kind:'data_chart',variant};
 if(/proportion|ratio|scale/.test(lessonId))return {kind:'proportion_lab',variant};

 if(/cell/.test(lessonId)){
  if(sceneNumber===2)return {kind:objectiveId===1?'cell_zoom':objectiveId===2?'cell_parts':'cell_compare',variant};
  return {kind:objectiveId%2===0?'cell_compare':'cell_zoom',variant};
 }
 if(/materials-properties/.test(lessonId))return {kind:'material_properties',variant};
 if(/energy-forms|energy-transformations|energy-environment/.test(lessonId))return {kind:'energy_flow',variant};
 if(/translational-motion|distance-displacement|average-speed|constant-acceleration/.test(lessonId))return {kind:'motion_lab',variant};
 if(/newton|force/.test(lessonId))return {kind:'force_lab',variant};
 if(/atom|element|compound/.test(lessonId))return {kind:'atom_builder',variant};
 if(/reaction|chemical-change|physical-chemical/.test(lessonId))return {kind:'reaction_lab',variant};
 if(/pressure/.test(lessonId))return {kind:'pressure_lab',variant};

 if(/reading|poem|teacher-merit/.test(lessonId))return {kind:'reading_lens',variant};
 if(/hamza|solar-lunar|ta-spelling|ta-marbuta|haa/.test(lessonId))return sceneNumber===1?{kind:'hamza_lab',variant}:null;
 if(/noun|pronoun|verb|definite|indefinite|inflection|built|building-signs/.test(lessonId))return {kind:'arabic_pattern',variant};

 if(/comparative/.test(lessonId))return sceneNumber===1?{kind:'comparison_scale',variant}:{kind:'word_builder',variant};
 if(/punctuation/.test(lessonId))return sceneNumber===1?{kind:'punctuation_lab',variant}:{kind:'word_builder',variant};
 if(/question-order|which-or/.test(lessonId))return sceneNumber===1?{kind:'question_blocks',variant:'does-base'}:{kind:'word_builder',variant};
 if(/present|past|future|perfect|continuous|adverbs-frequency|stative|just-already-yet/.test(lessonId))return sceneNumber===1?{kind:'tense_timeline',variant}:{kind:'word_builder',variant};
 if(/new-friends|mini-olympics|holidays|basketball|animal-magic|keep-in-touch|sport-report|directions|reflexive|message-friend/.test(lessonId))return sceneNumber===1?{kind:'word_builder',variant}:{kind:'reading_lens',variant};
 return null;
}

export function getTeachingVisual(lessonId:string,objectiveId:number,sceneNumber:number){
 return visuals[`${lessonId}:${objectiveId}:${sceneNumber}`]||fallbackVisual(lessonId,objectiveId,sceneNumber);
}
