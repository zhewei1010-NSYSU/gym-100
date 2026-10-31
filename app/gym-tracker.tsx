"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Check, ChevronDown, CircleCheck, Cloud, Dumbbell, History, LoaderCircle, LockKeyhole, Plus, Sparkles, Trash2, X, CalendarDays, ArrowUpRight } from "lucide-react";
type RecordEntry = {id:string;date:string;note:string;createdAt:string};
const taipeiToday=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Taipei",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const formatDate=(date:string,options:Intl.DateTimeFormatOptions)=>new Date(date+"T12:00:00+08:00").toLocaleDateString("zh-TW",{...options,timeZone:"Asia/Taipei"});
const sorted=(records:RecordEntry[])=>[...records].sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));
function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{ref.current?.showModal();return()=>ref.current?.close();},[]);
  return <dialog ref={ref} className="modal" onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===ref.current)onClose();}} aria-labelledby="modal-title"><div className="modal-heading"><h2 id="modal-title">{title}</h2><button className="icon-button" aria-label="關閉" onClick={onClose}><X size={21}/></button></div>{children}</dialog>;
}
export default function GymTracker() {
  const [records,setRecords]=useState<RecordEntry[]>([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const [unauthorized,setUnauthorized]=useState(false);
  const [toast,setToast]=useState("");
  const [modal,setModal]=useState(false);
  const [removing,setRemoving]=useState<RecordEntry|null>(null);
  const [date,setDate]=useState(taipeiToday);
  const [today,setToday]=useState(taipeiToday);
  const [note,setNote]=useState("");
  const [limit,setLimit]=useState(8);
  const [tab,setTab]=useState<"all"|"month">("all");
  const pendingRef=useRef(false);
  const retryRef=useRef<{id:string;date:string;note:string}|null>(null);
  const count=records.length,progress=Math.min(count,100);
  const monthCount=records.filter(r=>r.date.slice(0,7)===today.slice(0,7)).length;
  const todayCount=records.filter(r=>r.date===today).length;
  const nextMilestone=[10,25,50,75,100].find(n=>n>count);
  const filtered=tab==="month"?records.filter(r=>r.date.slice(0,7)===today.slice(0,7)):records;
  const load=useCallback(async()=>{
    setLoading(true);setError("");
    try {
      const response=await fetch("/api/checkins",{cache:"no-store"}); const data=await response.json() as {records:RecordEntry[];record:RecordEntry;error?:string};
      if(!response.ok){setUnauthorized(response.status===401);throw new Error(data.error||"無法讀取紀錄");}
      setRecords(sorted(data.records));setUnauthorized(false);
    } catch(e){setError(e instanceof Error?e.message:"連線失敗，請重試。");}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(""),4500);return()=>clearTimeout(timer);},[toast]);
  useEffect(()=>{const handler=()=>{if(document.visibilityState==="visible"){setToday(taipeiToday());if(!pendingRef.current)load();}};document.addEventListener("visibilitychange",handler);return()=>document.removeEventListener("visibilitychange",handler);},[load]);
  async function add(selectedDate:string,selectedNote="") {
    if(pendingRef.current)return;
    pendingRef.current=true;setSaving(true);setError("");
    const previous=retryRef.current;
    const payload=previous?.date===selectedDate&&previous.note===selectedNote?previous:{id:crypto.randomUUID(),date:selectedDate,note:selectedNote};
    retryRef.current=payload;
    try {
      const response=await fetch("/api/checkins",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const data=await response.json() as {records:RecordEntry[];record:RecordEntry;error?:string}; if(!response.ok)throw new Error(data.error||"儲存失敗，請重試。");
      const refresh=await fetch("/api/checkins",{cache:"no-store"});
      if(refresh.ok){const latest=await refresh.json() as {records:RecordEntry[]};setRecords(sorted(latest.records));}
      else setRecords(current=>sorted([...current.filter(r=>r.id!==data.record.id),data.record]));
      retryRef.current=null;setModal(false);setNote("");setToast("打卡成功！又為自己累積了一次。");
    } catch(e){setError(e instanceof Error?e.message:"儲存失敗，請重試。");}
    finally{pendingRef.current=false;setSaving(false);}
  }
  async function remove() {
    if(!removing||pendingRef.current)return;
    pendingRef.current=true;setSaving(true);setError("");
    try{const res=await fetch("/api/checkins?id="+encodeURIComponent(removing.id),{method:"DELETE"});if(!res.ok){const data=await res.json() as {error?:string};throw new Error(data.error||"刪除失敗");}setRecords(current=>current.filter(r=>r.id!==removing.id));setRemoving(null);setToast("紀錄已刪除，進度已更新。");}
    catch(e){setError(e instanceof Error?e.message:"刪除失敗，請重試。");}
    finally{pendingRef.current=false;setSaving(false);}
  }
  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="/" aria-label="健身房 100 次首頁"><span className="brand-symbol"><Dumbbell size={23} strokeWidth={2}/></span><span>GYM<span className="brand-light">100</span><small>我的健身打卡本</small></span></a><span className="privacy"><LockKeyhole size={13}/><span>私人空間</span></span></header>
    <main>
      <section className="intro"><div><p className="eyebrow"><span/> ONE WORKOUT AT A TIME</p><h1>每一次，<span>都算數。</span></h1><p className="intro-copy">不用一次做到完美，只要持續為自己出發。</p></div><div className="sync-status"><Cloud size={16}/>{loading?"同步中…":error?"等待同步":"雲端已同步"}</div></section>
      {error&&<div className="error-banner" role="alert"><span>{error}</span>{unauthorized?<a href="/signin-with-chatgpt?return_to=%2F" target="_top">登入 ChatGPT <ArrowUpRight size={14}/></a>:<button onClick={load} disabled={saving}>重新讀取</button>}</div>}
      <div className="hero-grid">
        <section className="progress-card" aria-labelledby="progress-title">
          <div className="progress-copy"><span className="card-overline" id="progress-title">我的 100 次挑戰</span><div className="big-count"><span data-testid="total-count">{loading?"—":count}</span><span className="count-unit">/ 100 <small>次</small></span></div><p className="count-caption">{count>=100?"100 次達成！持續累積你的每一次。":count===0?"你的第一步，從今天開始。":`已經為自己出發 ${count} 次，繼續保持。`}</p><div className="progress-facts"><div><span>本月累積</span><strong>{loading?"—":monthCount}<small>次</small></strong></div><div><span>{count>=100?"挑戰狀態":"距離目標"}</span><strong>{count>=100?"已完成":loading?"—":100-count}{count<100&&<small>次</small>}</strong></div></div></div>
          <div className="ring-wrap"><svg viewBox="0 0 240 240" className="progress-ring" role="progressbar" aria-label="100 次挑戰完成進度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><circle className="ring-track" cx="120" cy="120" r="100"/><circle className="ring-fill" cx="120" cy="120" r="100" pathLength="100" strokeDasharray="100" strokeDashoffset={100-progress}/></svg><div className="ring-label"><span className="ring-mini"><Sparkles size={18}/></span><strong data-testid="progress-percent">{loading?"—":progress}<small>%</small></strong><span>挑戰完成度</span></div><span className="ring-start">每一圈，都是新的自己</span></div>
        </section>
        <section className="checkin-card"><div className="checkin-heading"><span className="card-overline">把今天，留給更好的自己</span><span className="mini-icon"><Dumbbell size={19}/></span></div><div className="today-date">{formatDate(today,{month:"long",day:"numeric"})}<span>{formatDate(today,{weekday:"long"})}</span></div><p className="checkin-caption">{todayCount>0?`今天已打卡 ${todayCount} 次，做得很好。`:"運動完了嗎？記下今天的努力。"}</p><button className="primary-button checkin-button" onClick={()=>add(taipeiToday())} disabled={loading||saving||!!error}><span>{saving?<LoaderCircle className="spin" size={20}/>:<Plus size={21}/>} {saving?"儲存中…":"今天打卡 +1"}</span><ArrowRight size={20}/></button><button className="backfill-button" disabled={loading||saving||!!error} onClick={()=>{setDate(taipeiToday());setNote("");setModal(true);}}><CalendarDays size={15}/>補登其他日期</button><div className="checkin-footnote"><LockKeyhole size={12}/>每次打卡都會自動儲存</div></section>
      </div>
      <div className="details-grid">
        <section className="journey-card" aria-labelledby="journey-title"><div className="section-heading"><div><p className="eyebrow muted">YOUR JOURNEY</p><h2 id="journey-title">100 次，慢慢累積</h2></div><span className="tiny-pill">{progress} / 100</span></div><p className="section-description">一格代表一次。把努力，變成看得見的軌跡。</p><div className="dot-board" aria-label={`100 格進度，已完成 ${progress} 格`}>{Array.from({length:100},(_,i)=><span key={i} className={`journey-dot ${i<count?"filled":""} ${(i+1)%25===0?"milestone-dot":""}`} title={`第 ${i+1} 次${i<count?" · 已完成":""}`} aria-hidden="true">{i<count?<Check size={13}/>:((i+1)%25===0?i+1:"")}</span>)}</div><div className="board-legend"><span><i/>尚未完成</span><span><i className="done"/>已完成</span></div><div className="milestone-section"><div className="milestone-caption"><span><Sparkles size={14}/>下一個小里程碑</span><strong>{nextMilestone?`${nextMilestone} 次` : "100 次達成！"}</strong></div><div className="milestone-track">{[10,25,50,75,100].map(n=><div className={count>=n?"milestone reached":"milestone"} key={n}><span>{count>=n?<Check size={12}/>:<span/>}</span><small>{n}</small></div>)}</div><p>{nextMilestone?`再 ${nextMilestone-count} 次，就能抵達下一站。`:"你做到了。下一段旅程，也為自己而走。"}</p></div></section>
        <section className="history-card" aria-labelledby="history-title"><div className="section-heading"><div><p className="eyebrow muted">SHOWING UP MATTERS</p><h2 id="history-title">我的打卡紀錄</h2></div><History size={20} className="subtle-icon"/></div><div className="record-tabs" aria-label="紀錄篩選"><button className={tab==="all"?"active":""} aria-pressed={tab==="all"} onClick={()=>{setTab("all");setLimit(8);}}>全部紀錄<span>{count}</span></button><button className={tab==="month"?"active":""} aria-pressed={tab==="month"} onClick={()=>{setTab("month");setLimit(8);}}>本月</button></div>
          {loading?<div className="empty-state"><LoaderCircle className="spin" size={27}/><h3>正在讀取你的努力…</h3></div>:filtered.length===0?<div className="empty-state"><div className="empty-icon"><CalendarDays size={27}/><span><Plus size={13}/></span></div><h3>{tab==="month"?"這個月的新起點":"第一筆紀錄，等你來寫"}</h3><p>{tab==="month"?"準備好了，就為自己打卡一次。":"每一份努力都值得被記住。"}<br/>從一次打卡開始你的 100 次旅程。</p><span className="empty-dashes"><i/><i/><i/></span></div>:<ol className="record-list">{filtered.slice(0,limit).map(record=><li key={record.id}><div className="record-check"><Check size={15}/></div><div className="record-main"><div><time dateTime={record.date}>{formatDate(record.date,{year:"numeric",month:"2-digit",day:"2-digit"})}</time><span className="record-weekday">{formatDate(record.date,{weekday:"short"})}</span>{record.date===today&&<span className="today-tag">今天</span>}</div><p>{record.note||"又完成一次，為自己加分。"}</p></div><button className="delete-button" aria-label={`刪除 ${record.date} 的紀錄`} onClick={()=>{setError("");setRemoving(record);}} disabled={saving}><Trash2 size={15}/></button></li>)}</ol>}
          {filtered.length>limit&&<button className="show-more" onClick={()=>setLimit(current=>current+20)}>查看更多紀錄 <ChevronDown size={15}/></button>}
          <div className="history-footer"><span className="status-dot"/>按打卡日期由新到舊排列<span>台北時間</span></div>
        </section>
      </div>
      <footer className="footer"><span>穩定出現，就是進步。</span><span>MADE FOR YOUR NEXT REP <Dumbbell size={14}/></span></footer>
    </main>
    {toast&&<div className="toast" role="status"><CircleCheck size={20}/>{toast}</div>}
    {modal&&<Modal title="補登一次努力" onClose={()=>{if(!saving){setModal(false);setError("");}}}><p className="modal-description">有些努力值得補上。選擇你去健身房的日期。</p><form onSubmit={e=>{e.preventDefault();add(date,note);}}><label htmlFor="checkin-date">打卡日期</label><input id="checkin-date" type="date" min="2000-01-01" max={taipeiToday()} value={date} onChange={e=>setDate(e.target.value)} required autoFocus/><label htmlFor="checkin-note">備註 <span>選填</span></label><textarea id="checkin-note" maxLength={120} value={note} onChange={e=>setNote(e.target.value)} placeholder="例如：今天練背，感覺很棒。" rows={3}/><span className="input-hint">{note.length} / 120</span>{error&&<p className="inline-error" role="alert">{error}</p>}<button className="primary-button modal-submit" disabled={saving}><span>{saving?<LoaderCircle className="spin" size={18}/>:<Plus size={18}/>} {saving?"儲存中…":"新增這次打卡"}</span></button></form></Modal>}
    {removing&&<Modal title="刪除這次打卡？" onClose={()=>{if(!saving)setRemoving(null);}}><p className="modal-description">將刪除 {formatDate(removing.date,{year:"numeric",month:"long",day:"numeric"})} 的這筆紀錄，累積次數與進度也會一起更新。</p>{error&&<p className="inline-error" role="alert">{error}</p>}<div className="dialog-actions"><button className="secondary-button" disabled={saving} onClick={()=>setRemoving(null)}>保留紀錄</button><button className="danger-button" disabled={saving} onClick={remove}>{saving?"刪除中…":"確認刪除"}</button></div></Modal>}
  </div>;
}
