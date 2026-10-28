'use client';
import {useMemo,useState} from 'react';
import type {Lesson} from '../../../lib/data';

function isPrime(n:number){if(n<2)return false;for(let i=2;i*i<=n;i++)if(n%i===0)return false;return true}
function factorPairs(n:number){const out:Array<[number,number]>=[];for(let a=2;a*a<=n;a++)if(n%a===0)out.push([a,n/a]);return out}
function primeFactors(n:number){const out:number[]=[];let x=n;for(let p=2;p*p<=x;p++)while(x%p===0){out.push(p);x/=p}if(x>1)out.push(x);return out}

export default function PrimeFactorizationStudio({lesson,onOutcome}:{lesson:Lesson;onOutcome?:(ok:boolean)=>void}){
 const target=useMemo(()=>{const nums=(lesson.example+' '+lesson.summary).match(/\d+/g)?.map(Number).filter(n=>n>=4&&n<=120)||[];return nums[0]||18},[lesson.id,lesson.example,lesson.summary]);
 const pairs=factorPairs(target);const canonical=primeFactors(target);const [leaves,setLeaves]=useState<number[]>([target]);const [selected,setSelected]=useState<number|null>(null);const [pairChoice,setPairChoice]=useState<[number,number]|null>(null);const [message,setMessage]=useState('');const [reverse,setReverse]=useState<number[]>([]);const allPrime=leaves.length>1&&leaves.every(isPrime);
 const compositeIndexes=leaves.map((n,i)=>({n,i})).filter(x=>!isPrime(x.n));
 function pickLeaf(i:number){setSelected(i);setPairChoice(null);setMessage('')}
 function split(pair:[number,number]){if(selected===null)return;const value=leaves[selected];if(pair[0]*pair[1]!==value)return;const next=[...leaves];next.splice(selected,1,pair[0],pair[1]);setLeaves(next);setSelected(null);setPairChoice(pair);setMessage(next.every(isPrime)?'أصبحت كل الأوراق أولية. الآن تحققي بالبناء العكسي.':'ممتاز. بقي عامل مركب؛ افتحيه مرة أخرى.')}
 function reset(){setLeaves([target]);setSelected(null);setPairChoice(null);setMessage('');setReverse([])}
 function addReverse(n:number){if(reverse.length>=canonical.length)return;setReverse(v=>[...v,n])}
 const product=reverse.reduce((a,b)=>a*b,1);const reverseComplete=reverse.length===canonical.length;const reverseOk=reverseComplete&&product===target&&[...reverse].sort((a,b)=>a-b).join(',')===[...canonical].sort((a,b)=>a-b).join(',');
 function finishReverse(){if(!reverseComplete)return;onOutcome?.(reverseOk)}
 return <div className="conceptStudio primeFactorizationStudio">
   <div className="conceptStudioHead"><span>🌳</span><div><small>مختبر التحليل إلى العوامل الأولية</small><h4>فككي العدد حتى تبقى أعداد أولية فقط</h4><p>لا تحفظي التحليل؛ ابني الشجرة بنفسك ثم أعيدي تكوين العدد بالعكس.</p></div></div>
   <div className="factorizationTarget"><small>العدد الذي سنفككه</small><strong>{target}</strong></div>
   <div className="factorLeafBoard">{leaves.map((n,i)=><button key={`${n}-${i}`} className={`${isPrime(n)?'primeLeaf':'compositeLeaf'} ${selected===i?'selected':''}`} onClick={()=>!isPrime(n)&&pickLeaf(i)} disabled={isPrime(n)}><b>{n}</b><small>{isPrime(n)?'أولي ✓':'مركب — افتحيه'}</small></button>)}</div>
   {selected!==null&&<div className="factorPairPicker"><h5>اختاري زوج عوامل للعدد {leaves[selected]}</h5><div>{factorPairs(leaves[selected]).map(pair=><button key={pair.join('x')} onClick={()=>split(pair)}>{pair[0]} × {pair[1]}</button>)}</div><small>كل اختيار صحيح يعطي العدد نفسه عند الضرب. بعد ذلك نفحص هل العوامل أولية أم تحتاج تفكيكًا جديدًا.</small></div>}
   {pairChoice&&<div className="studioFeedback ok"><strong>🔗 {pairChoice[0]} × {pairChoice[1]}</strong><p>{message}</p></div>}
   {!allPrime&&compositeIndexes.length>0&&selected===null&&<div className="studioHint"><strong>الخطوة التالية</strong><p>اضغطي على عامل مركب لفتحه. العامل الأولي يبقى ورقة نهائية ولا نحلله أكثر.</p></div>}
   {allPrime&&<div className="primeFinish"><div className="studioFeedback ok"><strong>⭐ وصلتِ إلى الأوراق الأولية</strong><p>{target} = {leaves.join(' × ')}</p></div><div className="reverseBuild"><h5>🧱 الآن ابني العدد بالعكس</h5><p>اضغطي العوامل الأولية الصحيحة حتى يعيد حاصل الضرب العدد {target}.</p><div className="primeTokenBank">{[...new Set([...canonical,2,3,5,7])].sort((a,b)=>a-b).map(n=><button key={n} onClick={()=>addReverse(n)} disabled={reverse.length>=canonical.length}>{n}</button>)}</div><div className="reverseEquation">{reverse.length?reverse.join(' × '):'اختاري العوامل'} {reverse.length>0&&<><span>=</span><strong>{product}</strong></>}</div>{reverse.length>0&&<button className="resetMini" onClick={()=>setReverse([])}>امسحي البناء</button>}{reverseComplete&&<div className={reverseOk?'studioFeedback ok':'studioFeedback learn'}><strong>{reverseOk?'✅ أعاد التحليل العدد الأصلي':'💡 حاصل الضرب أو العوامل لا تطابق التحليل الأولي'}</strong><p>{reverseOk?'هذا دليل قوي أنك فهمتِ معنى التحليل، لا مجرد خطواته.':`راجعي الأوراق الأولية في الشجرة: ${leaves.join(' × ')}.`}</p><button onClick={finishReverse}>ثبتي النتيجة</button></div>}</div></div>}
   <div className="studioControls"><button onClick={reset}>↻ ابدئي بعدد {target} من جديد</button></div>
 </div>
}
