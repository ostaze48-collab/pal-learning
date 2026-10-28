export type TeachingVisualKind='cell_zoom'|'cell_compare'|'cell_parts'|'filter_lab'|'magnet_lab'|'evaporation_lab'|'integer_context'|'number_line'|'integer_motion'|'pronoun_swap'|'question_blocks'|'do_does';
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

export function getTeachingVisual(lessonId:string,objectiveId:number,sceneNumber:number){return visuals[`${lessonId}:${objectiveId}:${sceneNumber}`]||null}
