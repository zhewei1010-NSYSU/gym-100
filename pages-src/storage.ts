type Entry={id:string;date:string;note:string;createdAt:string};
const KEY="gym100-pages-records-v1";
const reply=(body:unknown,status=200)=>({ok:status>=200&&status<300,status,json:async()=>body});
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function valid(r:Entry){return r&&typeof r.id==='string'&&typeof r.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(r.date)&&r.date>='2000-01-01'&&r.date<=today()&&!isNaN(Date.parse(r.date))&&new Date(r.date).toISOString().slice(0,10)===r.date&&typeof r.note==='string'&&r.note.length<=120&&typeof r.createdAt==='string';}
export async function localFetch(url:string,options:RequestInit={}){
 try{
  const raw=localStorage.getItem(KEY);const records:Entry[]=raw?JSON.parse(raw):[];
  if(!Array.isArray(records)||!records.every(valid))return reply({error:'本機紀錄格式異常，請保留瀏覽器資料並聯絡協助。'},503);
  if(options.method==='POST'){
   const r={...JSON.parse(String(options.body)),createdAt:new Date().toISOString()};
   if(!valid(r))return reply({error:'請確認日期與備註。'},400);
   const existing=records.find(x=>x.id===r.id);if(!existing){records.push(r);localStorage.setItem(KEY,JSON.stringify(records));}
   return reply({record:existing||r},201);
  }
  if(options.method==='DELETE'){
   const id=new URL(url,'https://local.test').searchParams.get('id');
   localStorage.setItem(KEY,JSON.stringify(records.filter(r=>r.id!==id)));return reply({ok:true});
  }
  return reply({records});
 }catch{return reply({error:'無法存取本機紀錄。請允許瀏覽器儲存資料，並避免使用無痕模式。'},503);}
}
