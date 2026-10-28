import {NextResponse} from 'next/server';

export async function GET(){
  return NextResponse.json({
    aiConfigured:Boolean(process.env.OPENAI_API_KEY),
    curriculumSearchConfigured:Boolean(process.env.OPENAI_CURRICULUM_VECTOR_STORE_ID),
    model:process.env.OPENAI_TUTOR_MODEL||'default',
    mode:process.env.OPENAI_API_KEY?(process.env.OPENAI_CURRICULUM_VECTOR_STORE_ID?'ai+curriculum-search':'ai-context-only'):'local-fallback'
  });
}
