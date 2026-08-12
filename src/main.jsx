import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Home, Users, Wallet, Landmark, Settings } from 'lucide-react';
import './styles.css';

const KEY='chama-state-v1';
const initial={settings:{chamaName:'NTWA',currency:'KES',contributionAmount:1000,dueDay:5,penaltyDay:14,lateFeeAmount:100,savingsGoal:500000},members:[],contributions:[],loans:[],reminders:[]};
const uid=()=>crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2);
const today=()=>new Date().toISOString().slice(0,10);
const money=(n,c='KES')=>new Intl.NumberFormat('en-KE',{style:'currency',currency:c,maximumFractionDigits:0}).format(Number(n)||0);
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}};
function App(){
 const [s,setS]=useState(()=>{const x=load();return x?{...initial,...x,settings:{...initial.settings,...x.settings}}:initial});
 const [tab,setTab]=useState('dashboard'); const [showSettings,setShowSettings]=useState(false);
 useEffect(()=>localStorage.setItem(KEY,JSON.stringify(s)),[s]);
 const update=(fn)=>setS(p=>{const n=structuredClone(p);fn(n);return n});
 const contributed=s.contributions.reduce((a,x)=>a+Number(x.amount||0),0);
 const disbursed=s.loans.reduce((a,x)=>a+Number(x.principal||0),0);
 const repaid=s.loans.reduce((a,l)=>a+(l.repayments||[]).reduce((b,r)=>b+Number(r.amount||0),0),0);
 const outstanding=s.loans.reduce((a,l)=>{const total=Number(l.principal||0)*(1+Number(l.interestRate||0)/100);return a+Math.max(0,total-(l.repayments||[]).reduce((b,r)=>b+Number(r.amount||0),0))},0);
 const cash=contributed-disbursed+repaid;
 const addMember=()=>{const name=prompt('Member name?')?.trim();if(name)update(x=>x.members.push({id:uid(),name,joinDate:today()}))};
 const addContribution=()=>{if(!s.members.length)return alert('Add a member first.');const m=prompt('Member name:\n'+s.members.map(x=>x.name).join('\n'));const member=s.members.find(x=>x.name.toLowerCase()===m?.trim().toLowerCase());if(!member)return;if(confirm(`Record ${money(s.settings.contributionAmount,s.settings.currency)} for ${member.name}?`))update(x=>x.contributions.unshift({id:uid(),memberId:member.id,amount:Number(x.settings.contributionAmount),date:today()}))};
 return <div className="app"><header><div><small>CHAMA MANAGER</small><h1>{s.settings.chamaName}</h1></div><button onClick={()=>setShowSettings(true)}><Settings size={20}/></button></header><main>
 {tab==='dashboard'&&<><section className="hero"><small>GROUP POOL</small><strong>{money(cash,s.settings.currency)}</strong><span>{s.members.length} members</span></section><div className="grid"><Card t="Contributed" v={money(contributed,s.settings.currency)}/><Card t="Outstanding" v={money(outstanding,s.settings.currency)}/><Card t="Cash in hand" v={money(cash,s.settings.currency)}/></div></>}
 {tab==='members'&&<><h2>Members</h2>{s.members.length?<div>{s.members.map(m=><div className="row" key={m.id}><b>{m.name}</b><span>{money(s.contributions.filter(c=>c.memberId===m.id).reduce((a,c)=>a+Number(c.amount),0),s.settings.currency)}</span></div>)}</div>:<Empty text="No members yet"/>}</>}
 {tab==='contributions'&&<><h2>Contributions</h2>{s.contributions.length?s.contributions.map(c=><div className="row" key={c.id}><b>{s.members.find(m=>m.id===c.memberId)?.name||'Unknown'}</b><span>{money(c.amount,s.settings.currency)}</span></div>):<Empty text="No contributions yet"/>}</>}
 {tab==='loans'&&<><h2>Loans</h2>{s.loans.length?s.loans.map(l=><div className="row" key={l.id}><b>{s.members.find(m=>m.id===l.memberId)?.name||'Unknown'}</b><span>{money(l.principal,s.settings.currency)}</span></div>):<Empty text="No loans yet"/>}</>}
 </main><nav>{[[Home,'dashboard','Home'],[Users,'members','Members'],[Wallet,'contributions','Money In'],[Landmark,'loans','Loans']].map(([I,k,t])=><button key={k} onClick={()=>setTab(k)}><I size={19}/><small>{t}</small></button>)}</nav>{tab==='members'&&<button className="fab" onClick={addMember}>+ Add member</button>}{tab==='contributions'&&<button className="fab" onClick={addContribution}>+ Record</button>}{showSettings&&<SettingsPanel s={s} close={()=>setShowSettings(false)} update={update}/>}</div>}
function Card({t,v}){return <div className="card"><small>{t}</small><b>{v}</b></div>};function Empty({text}){return <div className="empty">{text}</div>}
function SettingsPanel({s,close,update}){const [name,setName]=useState(s.settings.chamaName);const [goal,setGoal]=useState(s.settings.savingsGoal);return <div className="overlay"><div className="panel"><button className="close" onClick={close}>×</button><h2>Settings</h2><label>Chama name<input value={name} onChange={e=>setName(e.target.value)}/></label><label>Savings goal<input type="number" value={goal} onChange={e=>setGoal(e.target.value)}/></label><button className="primary" onClick={()=>{update(x=>{x.settings.chamaName=name.trim()||'NTWA';x.settings.savingsGoal=Number(goal)||0});close()}}>Save</button></div></div>}
createRoot(document.getElementById('root')).render(<App/>);