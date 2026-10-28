import {spawn} from 'node:child_process';

const port='3999';
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p',port],{
  stdio:['ignore','pipe','pipe'],
  env:{...process.env,PORT:port}
});
child.stdout.on('data',d=>process.stdout.write(`[qa-server] ${d}`));
child.stderr.on('data',d=>process.stderr.write(`[qa-server] ${d}`));

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitReady(){
  for(let i=0;i<30;i++){
    try{const r=await fetch(`http://127.0.0.1:${port}/`);if(r.ok)return}catch{}
    await sleep(1000);
  }
  throw new Error('qa_server_not_ready');
}

let exitCode=0;
try{
  await waitReady();
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),240000);
  const r=await fetch(`http://127.0.0.1:${port}/api/internal/teacher-qa?k=ai-teacher-qa-oct2026`,{signal:controller.signal});
  clearTimeout(timer);
  const text=await r.text();
  console.log('\n=== AI_TEACHER_QA_RESULT_BEGIN ===');
  console.log(text);
  console.log('=== AI_TEACHER_QA_RESULT_END ===');
  if(!r.ok)exitCode=1;
}catch(error){
  console.error('AI_TEACHER_QA_FAILED',error);
  exitCode=1;
}finally{
  child.kill('SIGTERM');
  await sleep(500);
  if(!child.killed)child.kill('SIGKILL');
}
process.exit(exitCode);
