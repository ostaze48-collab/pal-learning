import type {CSSProperties,ReactNode} from 'react';

const card:CSSProperties={background:'#fff',border:'1px solid #e7ebf1',borderRadius:18,padding:16,boxShadow:'0 8px 28px rgba(18,33,61,.05)'};

export function StudentShell({title,subtitle,children,backHref}:{title:string;subtitle?:string;children:ReactNode;backHref?:string}){
  return <main style={{maxWidth:860,margin:'0 auto',padding:'18px 14px 92px'}}>
    <header style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-start',marginBottom:16}}>
      <div>{backHref&&<a href={backHref} style={{display:'inline-block',fontSize:13,color:'#176b3a',fontWeight:800,textDecoration:'none',marginBottom:6}}>← رجوع</a>}<h1 style={{margin:'0 0 5px',fontSize:'clamp(26px,7vw,38px)',lineHeight:1.2}}>{title}</h1>{subtitle&&<p style={{margin:0,color:'#667085',lineHeight:1.65}}>{subtitle}</p>}</div>
      <span style={{padding:'6px 9px',borderRadius:999,background:'#fff8e6',color:'#9a6700',border:'1px solid #f2d38a',fontSize:11,fontWeight:900,whiteSpace:'nowrap'}}>نسخة تجريبية</span>
    </header>{children}</main>;
}

export function StudentCard({children,style}:{children:ReactNode;style?:CSSProperties}){return <section style={{...card,...style}}>{children}</section>}

export function Pill({children,tone='neutral'}:{children:ReactNode;tone?:'neutral'|'good'|'warn'|'info'|'bad'}){
  const c={neutral:['#f2f4f7','#344054','#e4e7ec'],good:['#ecfdf3','#067647','#abefc6'],warn:['#fffaeb','#b54708','#fedf89'],info:['#eff8ff','#175cd3','#b2ddff'],bad:['#fef3f2','#b42318','#fecdca']}[tone];
  return <span style={{display:'inline-flex',padding:'4px 8px',borderRadius:999,background:c[0],color:c[1],border:`1px solid ${c[2]}`,fontSize:11,fontWeight:800}}>{children}</span>
}

export function PrimaryLink({href,children,secondary=false}:{href:string;children:ReactNode;secondary?:boolean}){
  return <a href={href} style={{display:'inline-flex',alignItems:'center',justifyContent:'center',minHeight:46,padding:'0 16px',borderRadius:12,background:secondary?'#fff':'#176b3a',color:secondary?'#14213d':'#fff',border:secondary?'1px solid #ccd5df':'1px solid #176b3a',textDecoration:'none',fontWeight:900}}>{children}</a>
}

export function PrimaryButton({children,onClick,disabled=false,secondary=false}:{children:ReactNode;onClick?:()=>void;disabled?:boolean;secondary?:boolean}){
  return <button onClick={onClick} disabled={disabled} style={{minHeight:46,padding:'0 16px',borderRadius:12,border:secondary?'1px solid #ccd5df':'1px solid #176b3a',background:disabled?'#eef1f4':secondary?'#fff':'#176b3a',color:disabled?'#98a2b3':secondary?'#14213d':'#fff',fontWeight:900,cursor:disabled?'not-allowed':'pointer'}}>{children}</button>
}

export function Notice({children,tone='info'}:{children:ReactNode;tone?:'info'|'good'|'warn'|'bad'}){
  const c={info:['#eff8ff','#b2ddff'],good:['#ecfdf3','#abefc6'],warn:['#fffaeb','#fedf89'],bad:['#fef3f2','#fecdca']}[tone];
  return <div style={{padding:12,borderRadius:12,background:c[0],border:`1px solid ${c[1]}`,lineHeight:1.65}}>{children}</div>
}

export function ProgressBar({value}:{value:number}){
  const pct=Math.max(0,Math.min(100,value||0));
  return <div style={{height:9,background:'#edf1f5',borderRadius:99,overflow:'hidden'}}><div style={{width:`${pct}%`,height:'100%',background:'#176b3a',borderRadius:99,transition:'width .2s'}}/></div>
}

export function BottomNav({active}:{active:'home'|'lesson'|'progress'|'review'}){
  const items=[['home','الرئيسية','/student','⌂'],['lesson','الدرس','/student/lesson','◉'],['progress','تقدمي','/student/progress','↗'],['review','مراجعة','/student/recovery','↺']] as const;
  return <nav style={{position:'fixed',bottom:0,left:0,right:0,zIndex:20,background:'rgba(255,255,255,.96)',borderTop:'1px solid #e5e9ef',padding:'7px 8px calc(7px + env(safe-area-inset-bottom))',display:'flex',justifyContent:'center',backdropFilter:'blur(10px)'}}><div style={{width:'min(620px,100%)',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:4}}>{items.map(([key,label,href,icon])=><a key={key} href={href} style={{display:'grid',placeItems:'center',gap:2,padding:'6px 2px',borderRadius:10,textDecoration:'none',background:active===key?'#eef8f1':'transparent',color:active===key?'#176b3a':'#667085',fontSize:11,fontWeight:active===key?900:700}}><span style={{fontSize:18}}>{icon}</span>{label}</a>)}</div></nav>
}

export function Metric({label,value}:{label:string;value:ReactNode}){return <div style={{padding:12,borderRadius:13,background:'#f8fafc',border:'1px solid #eef1f5'}}><div style={{fontSize:11,color:'#667085',fontWeight:800}}>{label}</div><div style={{fontSize:22,fontWeight:900,marginTop:4}}>{value}</div></div>}
