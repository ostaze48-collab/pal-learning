const students=[
  {slug:'salma',name:'سلمى',grade:'الصف الخامس',semester:'الفصل الأول',icon:'🌷',accent:'#7a4db3',bg:'#faf5ff',lesson:'العدد الأولي',progress:0},
  {slug:'sama',name:'سما',grade:'الصف السابع',semester:'الفصل الأول',icon:'✨',accent:'#176b3a',bg:'#f2fbf5',lesson:'الأعداد الصحيحة',progress:0},
];

export default function Home(){
  return <main style={{minHeight:'100vh',background:'linear-gradient(180deg,#f7fbf8 0%,#f7f8fc 55%,#ffffff 100%)',color:'#14213d'}}>
    <div style={{maxWidth:980,margin:'0 auto',padding:'24px 16px 56px'}}>
      <nav style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',marginBottom:44}}>
        <div><div style={{fontWeight:950,fontSize:19}}>تعلم سلمى وسما</div><div style={{fontSize:12,color:'#667085',marginTop:3}}>الرزم التعليمية الفلسطينية · الفصل الأول</div></div>
        <a href="/family/parent" style={{padding:'9px 13px',borderRadius:12,background:'#14213d',color:'#fff',textDecoration:'none',fontWeight:850}}>🔒 لوحة الأب</a>
      </nav>

      <section style={{textAlign:'center',maxWidth:720,margin:'0 auto 30px'}}>
        <div style={{display:'inline-flex',padding:'6px 11px',borderRadius:999,background:'#fff8e6',border:'1px solid #f0d894',fontSize:12,fontWeight:900,color:'#8b6100'}}>نسخة عائلية · V1</div>
        <h1 style={{fontSize:'clamp(34px,8vw,58px)',lineHeight:1.15,margin:'16px 0 12px'}}>من سيتعلم الآن؟</h1>
        <p style={{margin:0,color:'#667085',fontSize:17,lineHeight:1.8}}>منصة خاصة بسلمى وسما، مبنية في البداية على الرزم التعليمية المعتمدة لطلبة غزة، مع تعلم تفاعلي ومراجعة ذكية وحفظ للتقدم.</p>
      </section>

      <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>
        {students.map((s)=><a key={s.slug} href={`/family/${s.slug}`} style={{textDecoration:'none',color:'#14213d',background:'#fff',border:'1px solid #e5e9ef',borderRadius:24,padding:20,boxShadow:'0 16px 45px rgba(20,33,61,.08)',display:'block'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:14}}>
            <div>
              <div style={{fontSize:12,fontWeight:900,color:s.accent}}>{s.grade} · {s.semester}</div>
              <h2 style={{fontSize:31,margin:'7px 0 4px'}}>{s.name}</h2>
              <div style={{color:'#667085'}}>درس البداية: {s.lesson}</div>
            </div>
            <div style={{width:62,height:62,borderRadius:20,display:'grid',placeItems:'center',fontSize:34,background:s.bg}}>{s.icon}</div>
          </div>
          <div style={{marginTop:20}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:6}}><strong>التقدم</strong><span>{s.progress}%</span></div>
            <div style={{height:9,borderRadius:99,background:'#edf0f4',overflow:'hidden'}}><div style={{height:'100%',width:`${s.progress}%`,background:s.accent,borderRadius:99}}/></div>
          </div>
          <div style={{marginTop:18,padding:'12px 14px',borderRadius:13,background:s.bg,color:s.accent,fontWeight:900,textAlign:'center'}}>ابدئي التعلم ←</div>
        </a>)}
      </section>

      <section style={{marginTop:26,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:10}}>
        {[['📘','الرزم الرسمية','نبدأ بالمحتوى المعتمد للفصل الأول.'],['🧠','إتقان المهارات','كل درس يقيس المهارة لا الحفظ فقط.'],['🔄','مراجعة ذكية','الخطأ يتحول إلى نشاط علاجي قصير.'],['📱','مناسب للهاتف','واجهة خفيفة ويمكن تطويرها للعمل دون اتصال.']].map(([i,t,d])=><div key={t} style={{background:'#fff',border:'1px solid #e9edf2',borderRadius:17,padding:16}}><div style={{fontSize:25}}>{i}</div><strong style={{display:'block',margin:'8px 0 4px'}}>{t}</strong><div style={{fontSize:13,color:'#667085',lineHeight:1.7}}>{d}</div></div>)}
      </section>
    </div>
  </main>;
}
