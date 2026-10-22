export const id = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
export const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export const monthKey = (d = new Date()) => localDate(d).slice(0,7);
let datePreference='system',weekPreference='monday';
export const setDatePreference=(value:string)=>{datePreference=value};
export const setWeekPreference=(value:string)=>{weekPreference=value};
export function displayDate(value:string|number|Date){const d=value instanceof Date?value:typeof value==='number'?new Date(value):new Date(`${value}T12:00:00`);const locale=datePreference==='day first'?'en-GB':datePreference==='month first'?'en-US':undefined;return d.toLocaleDateString(locale,{day:'numeric',month:'short',year:'numeric'});}
export function weekDates(today=new Date()){const start=new Date(today.getFullYear(),today.getMonth(),today.getDate());const first=weekPreference==='sunday'?0:1;start.setDate(start.getDate()-(start.getDay()-first+7)%7);return Array.from({length:7},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d;});}
export function amountToMinor(input:string):number { const s=input.trim(); if(!/^\d+(?:\.\d{1,2})?$/.test(s)) throw new Error('Enter a valid positive amount with up to two decimals.'); const [a,b='']=s.split('.'); const n=Number(a)*100+Number(b.padEnd(2,'0')); if(!Number.isSafeInteger(n)||n<=0) throw new Error('Enter a valid positive amount.'); return n; }
export const minorToInput=(n:number)=> (n/100).toFixed(2);
export const money=(n:number,currency='INR')=>new Intl.NumberFormat(undefined,{style:'currency',currency,maximumFractionDigits:2}).format(n/100);
export function nextDue(timestamp:number, rule:string):number { const d=new Date(timestamp); const day=d.getDate(); if(rule==='daily') d.setDate(day+1); else if(rule==='weekdays') { do d.setDate(d.getDate()+1); while([0,6].includes(d.getDay())); } else if(rule==='weekly') d.setDate(day+7); else if(rule==='monthly') { d.setDate(1); d.setMonth(d.getMonth()+1); d.setDate(Math.min(day,new Date(d.getFullYear(),d.getMonth()+1,0).getDate())); } return d.getTime(); }
export function nextDueAfter(timestamp:number, rule:string, now=new Date(), anchorTimestamp=timestamp):number {
  const anchor=new Date(anchorTimestamp);
  const today=localDate(now);
  const advance=(previous:number)=>{
    if(rule==='monthly'){
      const d=new Date(previous);
      d.setDate(1);
      d.setMonth(d.getMonth()+1);
      d.setDate(Math.min(anchor.getDate(),new Date(d.getFullYear(),d.getMonth()+1,0).getDate()));
      return d.getTime();
    }
    return nextDue(previous,rule);
  };
  let next=advance(timestamp);
  // Keep the original day for monthly tasks, including dates such as the 31st.
  while(localDate(new Date(next))<=today){
    const previous=next;
    next=advance(previous);
    if(next<=previous) throw new Error('Unsupported repeat schedule');
  }
  return next;
}
export const dueToday=(ms:number|null)=>ms!==null && localDate(new Date(ms))<=localDate();
export function habitScheduled(rule:string,date:string):boolean { if(rule==='daily') return true; const dow=new Date(`${date}T12:00:00`).getDay(); return rule.split(',').includes(String(dow)); }
export function streak(rule:string,start:string,completed:Set<string>,today=localDate()):number { let count=0; const d=new Date(`${today}T12:00:00`); for(let i=0;i<3660;i++){ const key=localDate(d); if(key<start) break; if(habitScheduled(rule,key)){ if(completed.has(key)) count++; else if(key!==today) break; } d.setDate(d.getDate()-1); } return count; }
export function bestStreak(rule:string,start:string,completed:Set<string>,today=localDate()):number {let current=0,best=0;const d=new Date(`${start}T12:00:00`);for(let i=0;i<3660&&localDate(d)<=today;i++,d.setDate(d.getDate()+1)){const key=localDate(d);if(habitScheduled(rule,key)){current=completed.has(key)?current+1:0;best=Math.max(best,current);}}return best;}
