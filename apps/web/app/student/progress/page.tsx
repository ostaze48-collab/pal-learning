const skills=[
  ['معنى الكسر','82%','مستقر'],
  ['الكسور المتكافئة','30%','يحتاج دعمًا'],
  ['توحيد المقامات','20%','يحتاج دعمًا'],
  ['جمع الكسور','28%','يحتاج دعمًا'],
];
export default function Progress(){return <main style={{maxWidth:860,margin:'28px auto',padding:18}}><h1>تقدمي</h1><p>النتيجة معروضة حسب المهارة، وليس كتصنيف عام لمستوى الطالب.</p><div style={{display:'grid',gap:12}}>{skills.map(([name,score,status])=><article key={name} style={{background:'white',padding:18,borderRadius:16,border:'1px solid #e8edf5'}}><div style={{display:'flex',justifyContent:'space-between',gap:10}}><strong>{name}</strong><span>{score}</span></div><div style={{height:8,background:'#edf1f7',borderRadius:99,margin:'12px 0'}}><div style={{height:'100%',width:score,background:'#1f6feb',borderRadius:99}}/></div><small>{status}</small></article>)}</div><a href="/student/recovery" style={{display:'inline-block',marginTop:18,padding:'11px 15px',borderRadius:12,background:'#1f6feb',color:'white',textDecoration:'none'}}>تشغيل مثال مسار العلاج</a></main>}
