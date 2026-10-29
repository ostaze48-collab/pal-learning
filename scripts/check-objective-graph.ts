import {lessons} from '../lib/data';
import {buildObjectiveKnowledgeGraph} from '../lib/objectiveKnowledgeGraph';

const students=[...new Set(lessons.map(x=>x.student))];
const issues:string[]=[];
let nodeCount=0,edgeCount=0,objectiveCount=0,foundationCount=0;

for(const student of students){
 const graph=buildObjectiveKnowledgeGraph(student);const ids=new Set(graph.nodes.map(x=>x.id));const edgeKeys=new Set<string>();nodeCount+=graph.nodes.length;edgeCount+=graph.edges.length;objectiveCount+=graph.nodes.filter(x=>x.kind==='objective').length;foundationCount+=graph.nodes.filter(x=>x.kind==='foundation').length;
 for(const edge of graph.edges){
  if(!ids.has(edge.from))issues.push(`${student}: edge source missing: ${edge.from}`);
  if(!ids.has(edge.to))issues.push(`${student}: edge target missing: ${edge.to}`);
  if(!Number.isFinite(edge.confidence)||edge.confidence<0||edge.confidence>1)issues.push(`${student}: invalid confidence ${edge.confidence} on ${edge.from} -> ${edge.to}`);
  const key=`${edge.from}|${edge.relation}|${edge.to}`;if(edgeKeys.has(key))issues.push(`${student}: duplicate edge ${key}`);edgeKeys.add(key);
 }
 for(const node of graph.nodes.filter(x=>x.kind==='objective')){
  const partOf=graph.edges.some(edge=>edge.from===node.id&&edge.relation==='part_of'&&ids.has(edge.to));if(!partOf)issues.push(`${student}: objective without part_of edge: ${node.id}`);
 }
 const prereq=graph.edges.filter(x=>x.relation==='prerequisite_of');const adjacency=new Map<string,string[]>();for(const edge of prereq){const list=adjacency.get(edge.from)||[];list.push(edge.to);adjacency.set(edge.from,list)}
 const visiting=new Set<string>(),visited=new Set<string>();
 function visit(id:string):boolean{if(visiting.has(id))return true;if(visited.has(id))return false;visiting.add(id);for(const next of adjacency.get(id)||[])if(visit(next))return true;visiting.delete(id);visited.add(id);return false}
 for(const id of ids)if(visit(id)){issues.push(`${student}: prerequisite cycle detected near ${id}`);break}
}

console.log('\n=== SAMA & SALMA · OBJECTIVE GRAPH QUALITY ===');
console.log(`Students: ${students.length}`);
console.log(`Nodes: ${nodeCount}`);
console.log(`Objectives: ${objectiveCount}`);
console.log(`Foundation nodes: ${foundationCount}`);
console.log(`Edges: ${edgeCount}`);
if(issues.length){console.error(`Graph integrity failed with ${issues.length} issue(s):`);for(const issue of issues.slice(0,80))console.error(`- ${issue}`);if(issues.length>80)console.error(`... ${issues.length-80} more`);process.exit(1)}
console.log('Graph integrity: OK');