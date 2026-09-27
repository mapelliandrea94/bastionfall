import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { Castle, Coins, Heart, Shield, Swords, Trophy, LogIn, LogOut, Pause, Play, FastForward, Hammer, Sparkles, ChevronUp, Trash2 } from 'lucide-react';
import './style.css';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
const PATH = [36,37,38,39,27,15,16,17,18,30,42,54,55,56,57,45,33,34,35,47];
const PATH_SET = new Set(PATH);
const SPECS = {
  ranger:{name:'Ranger Spire',cost:70,damage:14,range:2.7,rate:.48,desc:'Rapid precision fire'},
  cannon:{name:'Ember Cannon',cost:110,damage:38,range:2.35,rate:1.15,desc:'Heavy impact volleys'},
  frost:{name:'Frost Obelisk',cost:90,damage:9,range:2.5,rate:.72,desc:'Slows the advancing horde'}
};
const BUILDINGS = {
  mine:{name:'Gold Mine',cost:120,desc:'+18 gold after every cleared wave'},
  forge:{name:'War Forge',cost:150,desc:'+10% damage to every tower'},
  shrine:{name:'Guardian Shrine',cost:140,desc:'+3 Keep HP immediately'}
};
const xy=c=>({x:c%12,y:Math.floor(c/12)});
const distance=(a,b)=>{const A=xy(a),B=xy(b);return Math.hypot(A.x-B.x,A.y-B.y)};

function App(){
  const [session,setSession]=useState(null),[profile,setProfile]=useState(null);
  const [gold,setGold]=useState(240),[hp,setHp]=useState(20),[wave,setWave]=useState(0),[kills,setKills]=useState(0);
  const [towers,setTowers]=useState([]),[buildings,setBuildings]=useState([]),[enemies,setEnemies]=useState([]),[kind,setKind]=useState('ranger'),[selected,setSelected]=useState(null),[buildMode,setBuildMode]=useState('tower');
  const [running,setRunning]=useState(false),[paused,setPaused]=useState(false),[speed,setSpeed]=useState(1),[panel,setPanel]=useState('build');
  const [notice,setNotice]=useState('Raise your defenses before the first assault.');
  const [authOpen,setAuthOpen]=useState(false),[authMode,setAuthMode]=useState('login');
  const [authEmail,setAuthEmail]=useState(''),[authPassword,setAuthPassword]=useState(''),[authName,setAuthName]=useState('');
  const [authBusy,setAuthBusy]=useState(false),[authError,setAuthError]=useState('');
  const ids=useRef(1),spawn=useRef([]),cooldown=useRef({});
  const selectedTower=towers.find(t=>t.id===selected)||null;
  const selectedBuilding=buildings.find(b=>b.id===selected)||null;
  const fortLevel=profile?.fortress_level||1;
  const shrineBonus=buildings.filter(b=>b.kind==='shrine').length*3;
  const forgeBonus=1+buildings.filter(b=>b.kind==='forge').length*.10;
  const maxHp=20+(fortLevel-1)*2+shrineBonus;

  useEffect(()=>{if(!supabase)return;supabase.auth.getSession().then(({data})=>setSession(data.session));const {data:l}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));return()=>l.subscription.unsubscribe()},[]);
  useEffect(()=>{if(session)loadProfile();else setProfile(null)},[session]);

  async function authed(route,options={}) {
    const token=session?.access_token;
    if(!token) throw new Error('login_required');
    const r=await fetch(route,{...options,headers:{'Content-Type':'application/json',Authorization:'Bearer '+token,...options.headers}});
    const j=await r.json();
    if(!r.ok) throw Object.assign(new Error(j.error||'request_failed'),{payload:j});
    return j;
  }
  async function loadProfile(){try{setProfile((await authed('/api/profile')).profile)}catch{setNotice('Profile sync failed.')}}
  function openAuth(mode='login'){setAuthMode(mode);setAuthError('');setAuthOpen(true)}
  async function submitAuth(e){
    e.preventDefault();
    if(!supabase)return;
    setAuthBusy(true);setAuthError('');
    try{
      if(authMode==='register'){
        const {data,error}=await supabase.functions.invoke('register-player',{body:{email:authEmail,password:authPassword,displayName:authName}});
        if(error||data?.error)throw new Error(data?.error||error?.message||'signup_failed');
        const signed=await supabase.auth.signInWithPassword({email:authEmail,password:authPassword});
        if(signed.error)throw signed.error;
        setNotice('Account created. Welcome to Bastionfall.');
      }else{
        const signed=await supabase.auth.signInWithPassword({email:authEmail,password:authPassword});
        if(signed.error)throw signed.error;
        setNotice('Welcome back, Defender.');
      }
      setAuthOpen(false);setAuthPassword('');
    }catch(err){
      const code=String(err?.message||'auth_failed');
      setAuthError(code==='email_in_use'?'This email is already registered.':code==='password_length'?'Password must be 8–72 characters.':code==='invalid_email'?'Enter a valid email address.':code);
    }finally{setAuthBusy(false)}
  }
  async function logout(){await supabase?.auth.signOut();setNotice('Signed out.')}
  async function finishRun(){if(!session)return;try{const j=await authed('/api/run/complete',{method:'POST',body:JSON.stringify({wave,kills})});setProfile(j.profile);setNotice('Run saved. +'+j.earnedShards+' shards.')}catch{setNotice('Run ended, but online save failed.')}}
  async function fortUpgrade(){try{const j=await authed('/api/fortress/upgrade',{method:'POST',body:'{}'});setProfile(j.profile);setHp(v=>Math.min(v+2,20+(j.profile.fortress_level-1)*2));setNotice('Fortress upgraded permanently.')}catch(e){setNotice(e.payload?.error==='not_enough_shards'?'Not enough shards.':'Upgrade failed.')}}

  function build(cell){
    const tower=towers.find(t=>t.cell===cell),building=buildings.find(b=>b.cell===cell);
    if(tower||building){setSelected((tower||building).id);return}
    if(PATH_SET.has(cell))return;
    if(buildMode==='tower'){
      const s=SPECS[kind];if(gold<s.cost){setNotice('Not enough gold.');return}
      const t={id:ids.current++,kind,cell,level:1};setTowers(v=>[...v,t]);setGold(v=>v-s.cost);setSelected(t.id);
    }else{
      const s=BUILDINGS[kind];if(gold<s.cost){setNotice('Not enough gold.');return}
      const b={id:ids.current++,kind,cell};setBuildings(v=>[...v,b]);setGold(v=>v-s.cost);setSelected(b.id);
      if(kind==='shrine')setHp(v=>v+3);
      setNotice(s.name+' constructed.');
    }
  }
  function upgrade(){if(!selectedTower)return;const cost=Math.round(SPECS[selectedTower.kind].cost*(.55+.35*selectedTower.level));if(gold<cost){setNotice('Not enough gold.');return}setGold(v=>v-cost);setTowers(v=>v.map(t=>t.id===selectedTower.id?{...t,level:t.level+1}:t))}
  function sell(){if(!selectedTower)return;const refund=Math.round(SPECS[selectedTower.kind].cost*(.55+.18*(selectedTower.level-1)));setGold(v=>v+refund);setTowers(v=>v.filter(t=>t.id!==selectedTower.id));setSelected(null)}
  function sellBuilding(){if(!selectedBuilding)return;const refund=Math.round(BUILDINGS[selectedBuilding.kind].cost*.55);if(selectedBuilding.kind==='shrine')setHp(v=>Math.max(1,v-3));setGold(v=>v+refund);setBuildings(v=>v.filter(b=>b.id!==selectedBuilding.id));setSelected(null)}
  function startWave(){if(running||hp<=0)return;const w=wave+1;setWave(w);setRunning(true);setPaused(false);setNotice(w%5===0?'BOSS WAVE — the earth is shaking.':'Wave '+w+' incoming.');const count=w%5===0?1:6+Math.min(10,w);spawn.current=[];for(let n=0;n<count;n++){const boss=w%5===0,max=(boss?440:58)*Math.pow(1.17,w-1);spawn.current.push({delay:n*.72,e:{id:ids.current++,hp:max,maxHp:max,step:0,progress:0,speed:boss?.38:.72+Math.min(.25,w*.01),reward:boss?130+w*10:9+w,boss,slow:0}})}}
  function newRun(){setGold(240);setHp(20+(fortLevel-1)*2);setWave(0);setKills(0);setTowers([]);setBuildings([]);setEnemies([]);spawn.current=[];setRunning(false);setSelected(null);setNotice('A new defense begins.')}

  useEffect(()=>{let last=performance.now();const timer=setInterval(()=>{const now=performance.now(),dt=Math.min(.08,(now-last)/1000)*speed;last=now;if(!running||paused||hp<=0)return;setEnemies(current=>{let next=current.map(e=>({...e}));spawn.current=spawn.current.map(s=>({...s,delay:s.delay-dt}));const ready=spawn.current.filter(s=>s.delay<=0);spawn.current=spawn.current.filter(s=>s.delay>0);next.push(...ready.map(s=>s.e));
    for(const t of towers){cooldown.current[t.id]=(cooldown.current[t.id]||0)-dt;const spec=SPECS[t.kind];if(cooldown.current[t.id]<=0){const target=next.filter(e=>e.hp>0&&distance(t.cell,PATH[Math.min(e.step,PATH.length-1)])<=spec.range).sort((a,b)=>b.step-a.step)[0];if(target){target.hp-=spec.damage*(1+(t.level-1)*.48)*forgeBonus;if(t.kind==='frost')target.slow=Math.max(target.slow,.8);cooldown.current[t.id]=spec.rate}}}
    let earned=0,dead=0,escaped=0;next=next.filter(e=>{if(e.hp<=0){earned+=e.reward;dead++;return false}e.progress+=e.speed*(e.slow>0?.52:1)*dt;e.slow=Math.max(0,e.slow-dt);while(e.progress>=1){e.progress--;e.step++}if(e.step>=PATH.length){escaped+=e.boss?6:1;return false}return true});if(earned)setGold(g=>g+earned);if(dead)setKills(k=>k+dead);if(escaped)setHp(h=>Math.max(0,h-escaped));if(spawn.current.length===0&&next.length===0){setRunning(false);const mineIncome=buildings.filter(b=>b.kind==='mine').length*18;setGold(g=>g+35+wave*3+mineIncome);setNotice('Wave '+wave+' cleared.'+(mineIncome?' Mines produced +'+mineIncome+' gold.':''))}return next})},40);return()=>clearInterval(timer)},[running,paused,speed,towers,buildings,wave,hp,forgeBonus]);
  useEffect(()=>{if(hp===0&&wave>0){setRunning(false);finishRun()}},[hp]);

  const byCell=useMemo(()=>{const m=new Map();enemies.forEach(e=>{const c=PATH[Math.min(e.step,PATH.length-1)];m.set(c,[...(m.get(c)||[]),e])});return m},[enemies]);

  return <div className="app">
    <header className="topbar">
      <div className="brand"><div className="crest"><Castle/></div><div><b>BASTIONFALL</b><span>Kingdom Defense Online</span></div></div>
      <div className="stats"><div><Coins/><b>{gold}</b><span>Gold</span></div><div><Heart/><b>{hp}/{maxHp}</b><span>Keep</span></div><div><Swords/><b>{wave}</b><span>Wave</span></div></div>
      <div className="account">{session?<><button className="accountButton" onClick={()=>setPanel('legacy')}><Shield/><span><b>{profile?.display_name||session.user.email?.split('@')[0]}</b><small>Online defender</small></span></button><button className="iconButton" onClick={logout}><LogOut/></button></>:<button className="login" onClick={()=>openAuth('login')}><LogIn/>Sign in / Create account</button>}</div>
    </header>
    <main className="layout">
      <section className="battle">
        <div className="battleHead"><div><span className="eyebrow">THE VERDANT MARCH</span><h1>Hold the Ember Keep</h1></div><div className="bossTag"><Trophy/><span>Next boss</span><b>Wave {(Math.floor(wave/5)+1)*5}</b></div></div>
        <div className="board">{Array.from({length:72},(_,cell)=>{const road=PATH_SET.has(cell),tower=towers.find(t=>t.cell===cell),building=buildings.find(b=>b.cell===cell),es=byCell.get(cell)||[];return <button key={cell} className={'tile '+(road?'road':'grass')+(selectedTower?.cell===cell?' chosen':'')} onClick={()=>build(cell)}><span className="deco">{cell===PATH[0]?'IN':cell===PATH[PATH.length-1]?'KEEP':!road&&cell%17===0?'◆':''}</span>{tower&&<span className={'tower '+tower.kind}><i/><b>{tower.kind==='ranger'?'R':tower.kind==='cannon'?'C':'F'}</b><small>Lv{tower.level}</small></span>}{building&&<span className={'building '+building.kind}><b>{building.kind==='mine'?'M':building.kind==='forge'?'W':'S'}</b></span>}{es.slice(0,2).map(e=><span key={e.id} className={'enemy '+(e.boss?'boss':'')}><i/><b>{e.boss?'B':'E'}</b><small><em style={{width:Math.max(0,e.hp/e.maxHp*100)+'%'}}/></small></span>)}</button>})}<div className="keepMark"><Shield/>EMBER KEEP</div></div>
        <div className="controls"><button className="primary" disabled={running||hp<=0} onClick={startWave}><Play/>{running?'Wave in progress':'Start Wave '+(wave+1)}</button><button disabled={!running} onClick={()=>setPaused(v=>!v)}>{paused?<Play/>:<Pause/>}{paused?'Resume':'Pause'}</button><button onClick={()=>setSpeed(v=>v===1?2:1)}><FastForward/>{speed}x Speed</button>{hp<=0&&<button className="danger" onClick={newRun}>New Run</button>}</div>
        <p className="notice">{notice}</p>
      </section>
      <aside className="side">
        <nav><button className={panel==='build'?'active':''} onClick={()=>setPanel('build')}><Hammer/>Build</button><button className={panel==='legacy'?'active':''} onClick={()=>setPanel('legacy')}><Sparkles/>Legacy</button></nav>
        {panel==='build'?<div className="panel"><div className="panelTitle"><b>DEFENSE ARSENAL</b><span>Choose a tower, then a grass tile.</span></div><div className="buildTabs"><button className={buildMode==='tower'?'active':''} onClick={()=>{setBuildMode('tower');setKind('ranger');setSelected(null)}}>Defenses</button><button className={buildMode==='base'?'active':''} onClick={()=>{setBuildMode('base');setKind('mine');setSelected(null)}}>Base</button></div><div className="towerList">{(buildMode==='tower'?Object.entries(SPECS):Object.entries(BUILDINGS)).map(([k,s])=><button key={k} className={kind===k?'selected':''} onClick={()=>{setKind(k);setSelected(null)}}><span className={'towerBadge '+k}>{k==='ranger'?'R':k==='cannon'?'C':k==='frost'?'F':k==='mine'?'M':k==='forge'?'W':'S'}</span><span><b>{s.name}</b><small>{s.desc}</small></span><strong>{s.cost}g</strong></button>)}</div>{selectedBuilding&&<div className="inspect"><span className="eyebrow">SELECTED BUILDING</span><h3>{BUILDINGS[selectedBuilding.kind].name}</h3><p className="buildingDesc">{BUILDINGS[selectedBuilding.kind].desc}</p><div className="actions"><button onClick={sellBuilding}><Trash2/>Demolish</button></div></div>}{selectedTower&&<div className="inspect"><span className="eyebrow">SELECTED DEFENSE</span><h3>{SPECS[selectedTower.kind].name}<small>Lv {selectedTower.level}</small></h3><div className="inspectStats"><span>Damage<b>{Math.round(SPECS[selectedTower.kind].damage*(1+(selectedTower.level-1)*.48))}</b></span><span>Range<b>{SPECS[selectedTower.kind].range}</b></span></div><div className="actions"><button className="upgrade" onClick={upgrade}><ChevronUp/>Upgrade</button><button onClick={sell}><Trash2/>Sell</button></div></div>}</div>:<div className="panel legacy"><div className="panelTitle"><b>ACCOUNT LEGACY</b><span>Permanent progress across every defense.</span></div>{session?<><div className="legacyGrid"><div><span>Fortress</span><b>Lv {profile?.fortress_level||1}</b></div><div><span>Best Wave</span><b>{profile?.best_wave||0}</b></div><div><span>Shards</span><b>{profile?.shards||0}</b></div><div><span>Runs</span><b>{profile?.runs||0}</b></div></div><button className="fortUpgrade" onClick={fortUpgrade}><Shield/><span><b>Strengthen the Keep</b><small>+2 permanent max HP</small></span><strong>{(profile?.fortress_level||1)*40} shards</strong></button></>:<div className="offlineCard"><Shield/><h3>Your kingdom needs an account</h3><p>Sign in to keep shards, fortress upgrades and records across devices.</p><button className="login" onClick={()=>openAuth('register')}><LogIn/>Create account</button></div>}</div>}
      </aside>
    </main>
    {authOpen&&<div className="authBackdrop" onMouseDown={()=>!authBusy&&setAuthOpen(false)}>
      <form className="authModal" onSubmit={submitAuth} onMouseDown={e=>e.stopPropagation()}>
        <div className="authMark"><Shield/></div>
        <span className="eyebrow">BASTIONFALL ACCOUNT</span>
        <h2>{authMode==='register'?'Create your Defender':'Return to the Keep'}</h2>
        <p>{authMode==='register'?'No email confirmation. Your account is ready immediately.':'Sign in with the same account on any device.'}</p>
        {authMode==='register'&&<label>Defender name<input value={authName} onChange={e=>setAuthName(e.target.value)} maxLength="40" required placeholder="Joker"/></label>}
        <label>Email<input type="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com"/></label>
        <label>Password<input type="password" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} minLength="8" maxLength="72" required autoComplete={authMode==='register'?'new-password':'current-password'} placeholder="8+ characters"/></label>
        {authError&&<div className="authError">{authError}</div>}
        <button className="authSubmit" type="submit" disabled={authBusy}>{authBusy?'Connecting...':authMode==='register'?'Create account':'Sign in'}</button>
        <button className="authSwitch" type="button" onClick={()=>{setAuthMode(v=>v==='login'?'register':'login');setAuthError('')}}>{authMode==='login'?'New here? Create an account':'Already have an account? Sign in'}</button>
      </form>
    </div>}
  </div>
}
createRoot(document.getElementById('root')).render(<App/>);