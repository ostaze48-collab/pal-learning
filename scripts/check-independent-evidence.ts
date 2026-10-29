import {lessons} from '../lib/data';
import {auditIndependentEvidence} from '../lib/independentEvidence';

const report=auditIndependentEvidence(lessons);

console.log('\n=== SAMA & SALMA · INDEPENDENT EVIDENCE QUALITY ===');
console.log(`Independent objective tasks: ${report.total}`);
console.log(`Already novel/reframed: ${report.novel}`);
console.log(`Auto-converted away from quiz surface: ${report.generated}`);

if(report.issues.length){
 console.error('\nINDEPENDENCE BLOCKERS');
 for(const issue of report.issues)console.error(`- ${issue.lessonId} · objective ${issue.objectiveId} · ${issue.code}: ${issue.message}`);
 process.exit(1);
}

console.log('Quiz-surface reuse in independent evidence: none');
