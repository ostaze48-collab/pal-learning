const tasks=[
  ['الكسور المتكافئة','أولوية مرتفعة','إنشاء/تحسين علاج قصير ثم قياس Recovery'],
  ['توحيد المقامات','أولوية مرتفعة','تحسين الشرح البصري والأسئلة المتدرجة'],
  ['جمع الكسور','أولوية متوسطة','تحليل الأخطاء بعد علاج المتطلبات السابقة'],
];
export default function Improvement(){return <main style={{maxWidth:980,margin:'28px auto',padding:18}}><h1>Content Improvement Queue</h1><p>الأولوية لا تعتمد على عدد الزيارات؛ بل على شدة ضعف الإتقان، عدد الطلاب المتأثرين، والمهارات اللاحقة التي تعتمد على المهارة.</p><div style={{display:'grid',gap:12}}>{tasks.map(([skill,priority,action])=><article key={skill} style={{background:'white',padding:18,borderRadius:16,border:'1px solid #e8edf5'}}><div style={{display:'flex',justifyContent:'space-between',gap:12}}><strong>{skill}</strong><span>{priority}</span></div><p>{action}</p></article>)}</div></main>}
