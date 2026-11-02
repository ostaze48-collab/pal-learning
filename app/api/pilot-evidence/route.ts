import {NextResponse} from 'next/server';
import {Pool} from 'pg';
import {getLesson,getStudent} from '../../../lib/data';

export const runtime='nodejs';
export const dynamic='force-dynamic';

let pool:Pool|undefined;
function db(){if(!process.env.DATABASE_URL)throw new Error('database_not_configured');if(!pool)pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false},max:3,idleTimeoutMillis:10000});return pool}

export async function POST(request:Request){
 try{
  const body=await request.json();
  const expected=process.env.PILOT_INGEST_CODE;
  if(!expected||typeof body?.pilotCode!=='string'||body.pilotCode.length>100||body.pilotCode!==expected)return NextResponse.json({error:'unauthorized'},{status:401});
  const lessonId=typeof body.lessonId==='string'?body.lessonId.slice(0,120):'';
  const lesson=getLesson(lessonId);
  if(!lesson)return NextResponse.json({error:'unknown_lesson'},{status:400});
  const student=getStudent(lesson.student);
  if(!student)return NextResponse.json({error:'unknown_grade'},{status:400});
  const participantId=typeof body.participantId==='string'&&/^[0-9a-f-]{36}$/i.test(body.participantId)?body.participantId:'';
  const diagnosticCorrect=body.diagnosticCorrect===true||body.diagnosticCorrect===false?body.diagnosticCorrect:null;
  const firstPassScore=Number(body.firstPassScore),finalScore=Number(body.finalScore),mastery=Number(body.mastery);
  if(!participantId||!Number.isInteger(firstPassScore)||!Number.isInteger(finalScore)||!Number.isFinite(mastery)||firstPassScore<0||finalScore<0||firstPassScore>lesson.questions.length||finalScore>lesson.questions.length||mastery<0||mastery>100)return NextResponse.json({error:'invalid_evidence'},{status:400});
  const completedAt=typeof body.completedAt==='string'&&!Number.isNaN(Date.parse(body.completedAt))?new Date(body.completedAt):new Date();
  const timeSeconds=Number.isFinite(Number(body.timeSeconds))?Math.max(0,Math.min(7200,Math.round(Number(body.timeSeconds)))):null;
  const safeNumber=(v:unknown)=>v===null||v===undefined?null:Number.isFinite(Number(v))?Math.max(0,Math.min(100,Math.round(Number(v)))):null;
  const sql=db();
  await sql.query(`CREATE TABLE IF NOT EXISTS pilot_learning_evidence (
    id BIGSERIAL PRIMARY KEY,
    participant_id UUID NOT NULL,
    lesson_id TEXT NOT NULL,
    grade SMALLINT NOT NULL,
    subject TEXT NOT NULL,
    diagnostic_correct BOOLEAN,
    first_pass_score SMALLINT NOT NULL,
    final_score SMALLINT NOT NULL,
    mastery SMALLINT NOT NULL,
    mastery_confidence SMALLINT,
    objective_evidence_score SMALLINT,
    transfer_score SMALLINT,
    time_seconds INTEGER,
    completed_at TIMESTAMPTZ NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(participant_id,lesson_id,completed_at)
  )`);
  await sql.query(`INSERT INTO pilot_learning_evidence
   (participant_id,lesson_id,grade,subject,diagnostic_correct,first_pass_score,final_score,mastery,mastery_confidence,objective_evidence_score,transfer_score,time_seconds,completed_at)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
   ON CONFLICT(participant_id,lesson_id,completed_at) DO NOTHING`,
   [participantId,lesson.id,student.grade,lesson.subject,diagnosticCorrect,firstPassScore,finalScore,mastery,safeNumber(body.masteryConfidence),safeNumber(body.objectiveEvidenceScore),safeNumber(body.transferScore),timeSeconds,completedAt]);
  return NextResponse.json({ok:true});
 }catch(error){console.error('pilot evidence ingest failed',error);return NextResponse.json({error:'storage_unavailable'},{status:503})}
}
