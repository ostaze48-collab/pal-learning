import {lessons,type Lesson} from './data';
import type {TeachingVisualKind} from './teachingVisuals';

export type RepresentationFamily='spatial'|'construct'|'compare'|'experiment'|'context'|'language'|'data';
export type RepresentationStats={family:RepresentationFamily;samples:number;successes:number;successRate:number;interactions:number};
export type LearningPatternRecommendation={
 student:string;
 subject?:string;
 evidenceCount:number;
 preferredFamily:RepresentationFamily|null;
 weakFamily:RepresentationFamily|null;
 confidence:number;
 assistive:{sceneViews:number;readAloud:number;reflections:number;practiceHints:number};
 stats:RepresentationStats[];
 updatedAt:string;
};

type UxEvent={event?:string;objectiveId?:number;visual?:TeachingVisualKind;visualKind?:TeachingVisualKind;correct?:boolean|null;at?:string};

export function representationFamily(kind:TeachingVisualKind):RepresentationFamily{
 if(['number_line','integer_motion','geometry_lab','comparison_scale','tense_timeline'].includes(kind))return'spatial';
 if(['factor_tree','atom_builder','word_builder','question_blocks','do_does','pronoun_swap','arabic_pattern','hamza_lab','punctuation_lab'].includes(kind))return'construct';
 if(['cell_compare','material_properties','reading_lens'].includes(kind))return'compare';
 if(['filter_lab','magnet_lab','evaporation_lab','motion_lab','force_lab','reaction_lab','pressure_lab','energy_flow'].includes(kind))return'experiment';
 if(['integer_context','cell_zoom'].includes(kind))return'context';
 if(['data_chart','decimal_grid'].includes(kind))return'data';
 return'language';
}

function readEvents(lessonId:string):UxEvent[]{
 if(typeof window==='undefined')return[];
 try{const raw=localStorage.getItem(`lessonUx:${lessonId}`);const parsed=raw?JSON.parse(raw):[];return Array.isArray(parsed)?parsed:[]}catch{return[]}
}
function eventTime(event:UxEvent){const n=Date.parse(String(event?.at||''));return Number.isFinite(n)?n:0}
function subjectLessons(student:string,subject?:string){return lessons.filter(l=>l.student===student&&(!subject||l.subject===subject))}

export function buildLearningPatternRecommendation(student:string,subject?:string):LearningPatternRecommendation{
 const counts=new Map<RepresentationFamily,{samples:number;successes:number;interactions:number}>();
 let sceneViews=0,readAloud=0,reflections=0,practiceHints=0,evidenceCount=0;
 const add=(family:RepresentationFamily,correct:boolean,interaction:boolean)=>{const old=counts.get(family)||{samples:0,successes:0,interactions:0};old.samples+=1;if(correct)old.successes+=1;if(interaction)old.interactions+=1;counts.set(family,old)};
 for(const lesson of subjectLessons(student,subject)){
  const events=readEvents(lesson.id);if(!events.length)continue;
  sceneViews+=events.filter(e=>e.event==='teaching_scene_view').length;readAloud+=events.filter(e=>e.event==='scene_read_aloud').length;reflections+=events.filter(e=>e.event==='teaching_reflection').length;practiceHints+=events.filter(e=>e.event==='practice_hint').length;
  const evidenceByObjective=new Map<number,UxEvent>();
  for(const e of events){if(e.event!=='objective_evidence'||typeof e.correct!=='boolean')continue;const id=Number(e.objectiveId);if(!Number.isFinite(id)||id<1)continue;const old=evidenceByObjective.get(id);if(!old||eventTime(e)>=eventTime(old))evidenceByObjective.set(id,e)}
  for(const [objectiveId,evidence] of evidenceByObjective){
   evidenceCount+=1;const until=eventTime(evidence)||Number.MAX_SAFE_INTEGER;const candidates=events.filter(e=>Number(e.objectiveId)===objectiveId&&eventTime(e)<=until&&(e.event==='teaching_visual_interaction'||e.event==='teaching_scene_view'));
   const families=new Map<RepresentationFamily,boolean>();
   for(const e of candidates){const kind=(e.visual||e.visualKind) as TeachingVisualKind|undefined;if(!kind)continue;const family=representationFamily(kind);families.set(family,(families.get(family)||false)||e.event==='teaching_visual_interaction')}
   for(const [family,interacted] of families)add(family,Boolean(evidence.correct),interacted);
  }
 }
 const stats=[...counts.entries()].map(([family,x])=>({family,samples:x.samples,successes:x.successes,successRate:x.samples?Math.round(x.successes/x.samples*100):0,interactions:x.interactions})).sort((a,b)=>b.samples-a.samples||b.successRate-a.successRate);
 const eligible=stats.filter(x=>x.samples>=3);const preferred=[...eligible].sort((a,b)=>b.successRate-a.successRate||b.interactions-a.interactions||b.samples-a.samples)[0]||null;const weak=[...eligible].filter(x=>x.successRate<60).sort((a,b)=>a.successRate-b.successRate||b.samples-a.samples)[0]||null;
 const preferredFamily=preferred&&preferred.successRate>=70?preferred.family:null;const weakFamily=weak?.family||null;const confidence=preferredFamily?Math.min(95,55+Math.min(30,preferred!.samples*5)+Math.max(0,preferred!.successRate-70)):0;
 const result:LearningPatternRecommendation={student,subject,evidenceCount,preferredFamily,weakFamily,confidence,assistive:{sceneViews,readAloud,reflections,practiceHints},stats,updatedAt:new Date().toISOString()};
 if(typeof window!=='undefined')try{localStorage.setItem(`learningPattern:${student}:${subject||'all'}`,JSON.stringify(result))}catch{}
 return result;
}

export function learningCue(family:RepresentationFamily|null){
 if(family==='spatial')return 'شاهدي المكان أو الحركة أولًا؛ غالبًا يكشفان العلاقة بسرعة.';
 if(family==='construct')return 'ابني الفكرة جزءًا جزءًا ثم انظري لما يتكرر.';
 if(family==='compare')return 'قارني حالتين جنبًا إلى جنب وابحثي عن الدليل الفارق.';
 if(family==='experiment')return 'غيّري عاملًا واحدًا وراقبي ما يحدث قبل اختيار التفسير.';
 if(family==='context')return 'ابدئي من موقف له معنى ثم ارجعي للرمز أو المصطلح.';
 if(family==='data')return 'ابدئي بالقيم أو النموذج ثم استخرجي العلاقة.';
 if(family==='language')return 'ابدئي بالمعنى ثم لاحظي النمط الذي يتكرر.';
 return null;
}

export function lessonRepresentationCandidates(lesson:Lesson,objectiveId:number,kinds:TeachingVisualKind[]){
 const recommendation=buildLearningPatternRecommendation(lesson.student,lesson.subject);const unique=[...new Set(kinds)];
 return unique.sort((a,b)=>{
  const af=representationFamily(a),bf=representationFamily(b);const score=(family:RepresentationFamily)=>family===recommendation.preferredFamily?3:family===recommendation.weakFamily?-2:0;return score(bf)-score(af)
 });
}
