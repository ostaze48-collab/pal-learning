export type TeachingVisualKind=
 'cell_zoom'|'cell_compare'|'cell_parts'|'filter_lab'|'magnet_lab'|'evaporation_lab'|
 'integer_context'|'number_line'|'integer_motion'|'pronoun_swap'|'question_blocks'|'do_does'|
 'factor_tree'|'fraction_bar'|'decimal_grid'|'geometry_lab'|'data_chart'|'proportion_lab'|
 'motion_lab'|'force_lab'|'atom_builder'|'reaction_lab'|'pressure_lab'|
 'arabic_pattern'|'hamza_lab'|'tense_timeline';

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
 if(sceneNumber!==1)return null;
 const variant=`${lessonId}|${objectiveId}`;

 if(/prime|factor|gcf|lcm/.test(lessonId))return {kind:'factor_tree',variant};
 if(/fraction/.test(lessonId))return {kind:'fraction_bar',variant};
 if(/decimal/.test(lessonId))return {kind:'decimal_grid',variant};
 if(/triangle|area|rectangle|square|net|prism|cube|quadrilateral|pyramid|cartesian|reflection|translation/.test(lessonId))return {kind:'geometry_lab',variant};
 if(/data|statistics|mean|median|mode|range|graph|chart/.test(lessonId))return {kind:'data_chart',variant};
 if(/proportion|ratio|scale/.test(lessonId))return {kind:'proportion_lab',variant};

 if(/translational-motion|distance-displacement|average-speed|constant-acceleration/.test(lessonId))return {kind:'motion_lab',variant};
 if(/newton|force/.test(lessonId))return {kind:'force_lab',variant};
 if(/atom|element|compound/.test(lessonId))return {kind:'atom_builder',variant};
 if(/reaction|chemical-change|physical-chemical/.test(lessonId))return {kind:'reaction_lab',variant};
 if(/pressure/.test(lessonId))return {kind:'pressure_lab',variant};

 if(/hamza|solar-lunar|ta-spelling|ta-marbuta|haa/.test(lessonId))return {kind:'hamza_lab',variant};
 if(/noun|pronoun|verb|definite|indefinite|inflection|built/.test(lessonId))return {kind:'arabic_pattern',variant};

 if(/present|past|future|perfect|continuous|adverbs-frequency|stative|comparative/.test(lessonId))return {kind:'tense_timeline',variant};
 if(/question-order/.test(lessonId))return {kind:'question_blocks',variant:'does-base'};
 return null;
}

export function getTeachingVisual(lessonId:string,objectiveId:number,sceneNumber:number){
 return visuals[`${lessonId}:${objectiveId}:${sceneNumber}`]||fallbackVisual(lessonId,objectiveId,sceneNumber);
}
