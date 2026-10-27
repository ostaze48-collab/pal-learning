'use client';
import {useEffect,useState} from 'react';
import {apiJson} from '../../../lib/api';

export default function Recovery(){
  const [data,setData]=useState<any>(null);const [error,setError]=useState('');
  useEffect(()=>{(async()=>{
    try{
      const skills=await apiJson<any[]>('/learning/skills');
      const target=skills.find(x=>x.skill_code==='SK.MATH.FRACTION.ADDITION');
      if(!target) throw new Error('مهارة جمع الكسور غير موجودة بعد');
      const result=await apiJson<any>('/learning/diagnostics/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({target_skill_id:target.id})},true);
      setData(result);
    }catch(e:any){setError(e.message||'تعذر تشغيل التشخيص')}
  })()},[]);
  const blocks=data?.remediation?.content?.blocks||[];
  return <main style={{maxWidth:820,margin:'28px auto',padding:18}}><div style={{fontSize:14,opacity:.65}}>مسار تعلم شخصي</div><h1>{data?.remediation?.title||'Learning Recovery'}</h1><p>نبحث عن المهارة السابقة التي تمنع التقدم، ثم نعالجها باختصار ونعود إلى درس الصف الحالي.</p>{error&&<div style={{padding:14,background:'#ffecec',borderRadius:12}}>{error}</div>}{!data&&!error&&<p>جارٍ تحليل مسار المهارات…</p>}{data&&<><section style={{background:'white',padding:20,borderRadius:16,border:'1px solid #e8edf5'}}><strong>نتيجة التشخيص</strong><h2>{data.status==='ROOT_GAP_FOUND'?'تم العثور على فجوة جذرية':'جاهز للمهارة المستهدفة'}</h2><p>Root skill ID: {data.root_gap_skill_id||'—'} · Target skill ID: {data.target_skill_id}</p></section>{data.remediation&&<section style={{marginTop:12,background:'#eef6ff',padding:20,borderRadius:16}}><strong>{data.remediation.estimated_minutes} دقائق</strong>{blocks.map((b:any,i:number)=><div key={i} style={{marginTop:12,padding:12,background:'white',borderRadius:12}}><div style={{fontSize:12,opacity:.6}}>{b.type}</div><p>{b.body||b.prompt||((b.items||[]).join(' · '))}</p></div>)}</section>}</>}</main>
}
