import {NextResponse} from 'next/server';

export async function GET(){
  const aiConfigured=Boolean(process.env.OPENAI_API_KEY);
  const curriculumSearchConfigured=Boolean(process.env.OPENAI_CURRICULUM_VECTOR_STORE_ID);
  return NextResponse.json({
    aiConfigured,
    curriculumSearchConfigured,
    webResearchAvailable:aiConfigured,
    model:process.env.OPENAI_TUTOR_MODEL||'default',
    mode:aiConfigured?(curriculumSearchConfigured?'ai+curriculum-search+web':'ai-context+web'):'local-fallback'
  });
}
