export default function KidLoading({icon='✨',label='نجهز رحلتك…'}:{icon?:string;label?:string}){
 return <div className="kidRouteLoading" role="status" aria-live="polite"><style>{`
  .kidRouteLoading{min-height:58dvh;display:grid;place-items:center;padding:28px;text-align:center;color:#536d66;background:radial-gradient(circle at 50% 38%,#eef8f5 0,#fff 58%)}
  .kidRouteLoading>div{display:grid;justify-items:center;gap:14px}
  .kidRouteLoading .kidLoadIcon{width:82px;height:82px;border-radius:28px;display:grid;place-items:center;background:#fff;font-size:42px;box-shadow:0 16px 38px rgba(31,77,66,.10);animation:kidFloat 1.05s ease-in-out infinite alternate}
  .kidRouteLoading strong{font-size:16px}.kidRouteLoading .kidLoadDots{display:flex;gap:7px}.kidRouteLoading .kidLoadDots i{width:8px;height:8px;border-radius:50%;background:#8db3a8;animation:kidDot .9s ease-in-out infinite}.kidRouteLoading .kidLoadDots i:nth-child(2){animation-delay:.14s}.kidRouteLoading .kidLoadDots i:nth-child(3){animation-delay:.28s}
  @keyframes kidFloat{to{transform:translateY(-7px) rotate(2deg)}}@keyframes kidDot{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.08)}}
  @media(max-width:600px){.kidRouteLoading{min-height:70dvh;padding:18px}.kidRouteLoading .kidLoadIcon{width:72px;height:72px;border-radius:24px;font-size:36px}}
  @media(prefers-reduced-motion:reduce){.kidRouteLoading .kidLoadIcon,.kidRouteLoading .kidLoadDots i{animation:none!important}}
 `}</style><div><span className="kidLoadIcon">{icon}</span><strong>{label}</strong><span className="kidLoadDots" aria-hidden="true"><i/><i/><i/></span></div></div>;
}
