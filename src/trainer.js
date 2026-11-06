// NFSU2 Revived Trainer — runs in the page (MAIN world) on nfsu2.xyz
// Addresses from Racer_S's "NFSU2 +10 Trainer"; the recompile keeps the original memory layout.
(() => {
  'use strict';
  if (window.__nfsTrainer) return;

  // ---------- known addresses ----------
  const CASH = 0x861E74;           // int32 bank
  const CAR_PTR = 0x89CDA8;        // car = [[CAR_PTR] + 0x20] - 0x30
  const NOS_PTR = 0x89CCF8;        // nitrous ints at [NOS_PTR] + 0x454 / + 0x45C
  const POS = 0x50, FWD = 0x60, VEL = 0xA0, ANG = 0xB0;
  const MPH200 = 89.408;           // m/s

  const LS = 'nfsTrainer.v2';
  const S = {
    offlineByUs: false, sessionRef: null,
    cashFreeze: false, cashFreezeVal: 0,
    nosInf: false, lockSpeed: false, lockKmh: 200,
    boostX: 2, maxKmh: 500, jump: 10, phaseM: 6,
    slots: {},
  };
  window.__nfsTrainer = S;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(LS) || '{}'); } catch {}
  const save = () => { try { localStorage.setItem(LS, JSON.stringify(saved)); } catch {} };
  for (const k of ['lockKmh', 'boostX', 'maxKmh', 'jump', 'phaseM']) if (typeof saved[k] === 'number') S[k] = saved[k];

  // ---------- memory ----------
  let buf = null, dv = null;
  function mem() {
    const m = window.__nfsu2?.session?.proc?.memory;
    if (!m) return false;
    if (m.buffer !== buf) { buf = m.buffer; dv = new DataView(buf); }
    return true;
  }
  const inRange = a => a > 0x10000 && a + 0x100 < buf.byteLength;
  const u32 = a => dv.getUint32(a, true), i32 = a => dv.getInt32(a, true);
  const f32 = a => dv.getFloat32(a, true);
  const wi32 = (a, v) => dv.setInt32(a, v, true), wf32 = (a, v) => dv.setFloat32(a, v, true);
  const vec = a => [f32(a), f32(a + 4), f32(a + 8)];
  const setVec = (a, v) => { wf32(a, v[0]); wf32(a + 4, v[1]); wf32(a + 8, v[2]); };
  const len = v => Math.hypot(v[0], v[1], v[2]);
  const money = v => '$' + Number(v).toLocaleString('en-US');

  function car() {
    if (!mem()) return 0;
    const p0 = u32(CAR_PTR); if (!inRange(p0)) return 0;
    const p1 = u32(p0 + 0x20); if (!inRange(p1)) return 0;
    const c = p1 - 0x30;
    const f = vec(c + FWD), p = vec(c + POS);
    if (!(Math.abs(len(f) - 1) < 0.05) || !p.every(Number.isFinite)) return 0;  // sanity: forward is a unit vector
    return c;
  }
  function nos() {
    if (!mem()) return 0;
    const p = u32(NOS_PTR);
    return inRange(p) ? p : 0;
  }

  // ---------- online gate ----------
  function net() {
    const s = window.__nfsu2?.session;
    if (s !== S.sessionRef) { S.sessionRef = s; S.offlineByUs = false; S.nosInf = false; S.lockSpeed = false; }
    const n = s?.net; let peers = 0;
    try { peers = (n?.peers?.() || []).length; } catch {}
    return { n, peers };
  }
  const offlineOK = () => { const { n, peers } = net(); return !!n && S.offlineByUs && peers === 0; };
  function needCar() {
    if (!offlineOK()) { toast('F2 → Go offline first', 2500); return 0; }
    const c = car(); if (!c) toast('Car not found', 1800);
    return c;
  }

  // ---------- actions ----------
  const A = {
    toggle: () => { panel.hidden = !panel.hidden; render(); },
    offline: () => {
      const { n } = net(); if (!n) return toast('Start the game first.');
      try { n.offline(); S.offlineByUs = true; toast('Offline · cheats on', 2000); } catch (e) { toast('Could not go offline: ' + e.message, 3000); }
      render();
    },
    money: () => { if (!mem()) return; wi32(CASH, 99999999); S.cashFreezeVal = 99999999; toast('Bank: $99,999,999'); render(); },
    cashApply: () => {
      if (!mem()) return;
      const v = Math.max(0, Math.min(2e9, parseInt($('cashVal').value, 10) || 0));
      wi32(CASH, v); S.cashFreezeVal = v; toast(`Bank set to ${money(v)}`); render();
    },
    boost: () => { const c = needCar(); if (!c) return; const v = vec(c + VEL), m = len(v); if (m < 0.5) return; const k = Math.min(m * S.boostX, S.maxKmh / 3.6) / m; setVec(c + VEL, v.map(x => x * k)); toast(`Boost ×${S.boostX}`, 700); },
    instant: () => { const c = needCar(); if (!c) return; const f = vec(c + FWD); setVec(c + VEL, f.map(x => x * MPH200)); toast('200 mph', 700); },
    brake: () => { const c = needCar(); if (!c) return; setVec(c + VEL, [0, 0, 0]); setVec(c + ANG, [0, 0, 0]); },
    jump: () => { const c = needCar(); if (!c) return; wf32(c + VEL + 8, f32(c + VEL + 8) + S.jump); },
    phase: () => { const c = needCar(); if (!c) return; const p = vec(c + POS), f = vec(c + FWD); setVec(c + POS, p.map((x, i) => x + f[i] * S.phaseM)); },
    nosToggle: () => { if (!needCar()) return; S.nosInf = !S.nosInf; toast(S.nosInf ? 'Infinite N2O on' : 'Infinite N2O off', 1200); render(); },
    nosShort: () => { if (!needCar()) return; const p = nos(); if (!p) return toast('Nitrous not found'); wi32(p + 0x454, 8000); wi32(p + 0x45C, 8000); toast('N2O refilled', 800); },
    savePos: n => { const c = needCar(); if (!c) return; S.slots[n] = [vec(c + POS), vec(c + FWD)]; toast(`Position ${n} saved`, 900); },
    warp: n => {
      const c = needCar(); if (!c) return; const s = S.slots[n];
      if (!s) return toast(`Slot ${n} empty`, 1500);
      setVec(c + POS, s[0]); setVec(c + VEL, [0, 0, 0]); setVec(c + ANG, [0, 0, 0]); toast(`Warped to ${n}`, 900);
    },
  };

  // ---------- per-frame effects ----------
  function frame() {
    requestAnimationFrame(frame);
    if (!mem()) return;
    if (S.cashFreeze && i32(CASH) !== S.cashFreezeVal) wi32(CASH, S.cashFreezeVal);
    if (!S.nosInf && !S.lockSpeed) return;
    if (!offlineOK()) { S.nosInf = S.lockSpeed = false; return; }
    if (S.nosInf) { const p = nos(); if (p) { wi32(p + 0x454, 9999999); wi32(p + 0x45C, 9999999); } }
    if (S.lockSpeed) {
      const c = car(); if (!c) return;
      const v = vec(c + VEL), m = len(v);
      if (m > 1) { const k = (S.lockKmh / 3.6) / m; setVec(c + VEL, v.map(x => x * k)); }
    }
  }
  requestAnimationFrame(frame);
  setInterval(() => { if (!panel.hidden) render(); }, 400);

  // ---------- UI ----------
  const host = document.createElement('div');
  host.id = 'nfs-trainer';
  const root = host.attachShadow({ mode: 'open' });
  const CSS = `
:host{all:initial;--f:"Arial Narrow","Roboto Condensed","Helvetica Neue",Arial,sans-serif}
*{box-sizing:border-box}
.p{position:fixed;top:14px;left:14px;width:384px;max-height:calc(100vh - 28px);overflow:auto;z-index:2147483647;
 color:#dff6ff;font:600 14px/1.4 var(--f);font-stretch:condensed;
 background:linear-gradient(160deg,rgba(6,22,40,.94) 0%,rgba(3,10,20,.95) 55%,rgba(10,6,2,.94) 100%);
 border:1px solid rgba(70,200,255,.55);
 box-shadow:0 0 0 1px rgba(0,0,0,.6),0 0 18px rgba(40,170,255,.35),inset 0 0 30px rgba(40,170,255,.08);
 clip-path:polygon(0 0,calc(100% - 22px) 0,100% 22px,100% 100%,22px 100%,0 calc(100% - 22px));
 padding:0 16px 20px;scrollbar-width:thin;scrollbar-color:#2a8fd0 transparent}
.p[hidden]{display:none}
.p::before{content:"";position:absolute;inset:0;pointer-events:none;
 background:repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 1px,transparent 1px 3px)}
.hd{display:flex;align-items:center;gap:8px;margin:0 -16px 6px;padding:10px 16px 8px;
 background:linear-gradient(90deg,rgba(40,170,255,.35),rgba(40,170,255,0) 80%);border-bottom:2px solid #ff9a1f}
.logo{font:italic 900 22px/1 "Arial Black","Arial",sans-serif;letter-spacing:.5px;color:#fff;
 text-shadow:0 0 8px rgba(80,200,255,.9),2px 2px 0 #06223a;transform:skewX(-8deg)}
.logo i{color:#ff9a1f;font-style:inherit;text-shadow:0 0 8px rgba(255,140,20,.8),2px 2px 0 #3a1a00}
.hd .st{flex:1;text-align:right;font-size:12px;letter-spacing:.5px;text-transform:uppercase}
h3{display:inline-block;margin:14px 0 6px;padding:2px 14px 2px 10px;font:italic 800 13px/1.3 var(--f);letter-spacing:2px;text-transform:uppercase;
 color:#04121e;background:linear-gradient(90deg,#5fd8ff,#2a8fd0);clip-path:polygon(0 0,100% 0,calc(100% - 9px) 100%,0 100%)}
.mt{margin-top:10px}
.row{display:flex;align-items:center;gap:8px;margin:6px 0;flex-wrap:wrap}
.note{color:#8fb7cc;font-weight:500}
.big{font:italic 800 20px/1 var(--f);color:#ffb347;text-shadow:0 0 6px rgba(255,140,20,.6)}
input[type=number]{width:118px;background:rgba(0,0,0,.45);color:#fff;border:0;border-bottom:2px solid #2a8fd0;padding:3px 6px;font:inherit;outline:none}
input[type=number]:focus{border-bottom-color:#ff9a1f;background:rgba(40,170,255,.12)}
input.s{width:62px;text-align:center}
input[type=checkbox]{accent-color:#ff9a1f;width:15px;height:15px;vertical-align:-2px}
label{cursor:pointer}
button{font:italic 800 13px/1 var(--f);letter-spacing:1px;text-transform:uppercase;color:#04121e;cursor:pointer;border:0;padding:6px 14px;
 background:linear-gradient(180deg,#8ae6ff,#2a9be0);clip-path:polygon(7px 0,100% 0,calc(100% - 7px) 100%,0 100%);transition:filter .1s}
button:hover{background:linear-gradient(180deg,#ffd27a,#ff8c14);filter:drop-shadow(0 0 6px rgba(255,140,20,.8))}
button.x{background:none;color:#8fd8ff;font-size:20px;padding:0 4px;clip-path:none}
button.x:hover{color:#ff9a1f;filter:none}
.ok{color:#7dff9a;text-shadow:0 0 6px rgba(80,255,140,.6)}.bad{color:#ff6a5a;text-shadow:0 0 6px rgba(255,80,60,.5)}
.dis{opacity:.35;pointer-events:none;filter:grayscale(.6)}
.keys{display:grid;grid-template-columns:auto 1fr;gap:3px 10px;align-items:center;margin-top:4px}
kbd{display:inline-block;min-width:44px;text-align:center;font:italic 800 12px/1 var(--f);letter-spacing:.5px;color:#ffb347;
 padding:4px 8px;border:1px solid rgba(255,154,31,.7);background:rgba(255,140,20,.08);transform:skewX(-10deg);
 box-shadow:inset 0 0 8px rgba(255,140,20,.15)}
.ft{margin-top:12px;padding-top:8px;border-top:1px solid rgba(70,200,255,.25);color:#5f8aa3;font-size:11.5px;font-weight:500;letter-spacing:.3px}
.toast{position:fixed;top:20%;left:50%;transform:translateX(-50%) skewX(-10deg);z-index:2147483647;pointer-events:none;opacity:0;transition:opacity .15s,transform .15s;
 font:italic 900 24px/1 "Arial Black",Arial,sans-serif;letter-spacing:1px;white-space:nowrap;text-transform:uppercase;color:#ffb347;padding:12px 28px;
 text-shadow:0 0 10px rgba(255,140,20,.9),2px 2px 0 #2a1200;
 background:linear-gradient(90deg,rgba(4,18,32,0),rgba(4,18,32,.85) 15%,rgba(4,18,32,.85) 85%,rgba(4,18,32,0));
 border-top:2px solid rgba(70,200,255,.7);border-bottom:2px solid rgba(70,200,255,.7)}
.toast.on{opacity:1;transform:translateX(-50%) skewX(-10deg) scale(1.03)}`;
  const sheet = new CSSStyleSheet(); sheet.replaceSync(CSS); root.adoptedStyleSheets = [sheet]; // site CSP blocks inline <style>
  root.innerHTML = `
<div class="p" id="p" hidden>
 <div class="hd"><span class="logo">U2 <i>TRAINER</i></span><span class="st" id="st"></span><button class="x" data-a="toggle" title="Hide (F2)">×</button></div>
 <h3>Bank</h3>
 <div class="row"><span class="note">Current</span><span class="big" id="cashNow"></span></div>
 <div class="row"><input id="cashVal" type="number" value="9999999"><button data-a="cashApply">Set bank</button><label><input type="checkbox" id="cashFrz"> Freeze</label></div>
 <h3>Car · offline only</h3>
 <div class="row"><span id="netInfo" class="note"></span><button data-a="offline" id="offBtn">Go offline</button></div>
 <div id="car">
  <div class="row"><span class="note" id="carInfo"></span></div>
  <div class="keys">
   <kbd>Y</kbd><span>Boost ×<input id="boostX" class="s" type="number" step="0.5"> max <input id="maxKmh" class="s" type="number"> km/h</span>
   <kbd>I</kbd><span>Instant 200 mph</span>
   <kbd>PgDn</kbd><span>Super brakes</span>
   <kbd>End</kbd><span>Jump <input id="jump" class="s" type="number"></span>
   <kbd>PgUp</kbd><span>Move <input id="phaseM" class="s" type="number"> m forward</span>
   <kbd>Ins</kbd><span>Infinite nitrous <span id="nosSt"></span></span>
   <kbd>Del</kbd><span>Nitrous refill</span>
   <kbd>O</kbd><span>Bank $99,999,999</span>
   <kbd>⇧ 1–9</kbd><span>Save position</span>
   <kbd>Ctrl 1–9</kbd><span>Warp to saved position</span>
  </div>
  <div class="row mt"><label><input type="checkbox" id="lock"> Lock speed at</label><input id="lockKmh" class="s" type="number"><span>km/h</span></div>
 </div>
 <div class="ft">F2 show / hide · keys from Racer_S's original +10 trainer</div>
</div>
<div class="toast" id="toast"></div>`;
  const $ = id => root.getElementById(id);
  const panel = $('p');
  let toastT;
  function toast(msg, ms = 1600) { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms); }

  for (const k of ['boostX', 'maxKmh', 'jump', 'phaseM', 'lockKmh']) $(k).value = S[k];
  root.addEventListener('click', e => { const a = e.target.closest('[data-a]')?.dataset.a; if (a) A[a]?.(); });
  root.addEventListener('change', e => {
    const id = e.target.id;
    if (id === 'cashFrz') { S.cashFreeze = e.target.checked; if (mem()) S.cashFreezeVal = i32(CASH); }
    else if (id === 'lock') S.lockSpeed = e.target.checked && !!needCar();
    else if (typeof S[id] === 'number') { const v = parseFloat(e.target.value); if (Number.isFinite(v)) { S[id] = v; saved[id] = v; save(); } }
    render();
  });

  // build small status lines without innerHTML: 'text' | ['cls','text'] | [part, part...]
  function put(el, spec) {
    el.textContent = '';
    const add = x => {
      if (typeof x === 'string') el.append(x);
      else if (x.length === 2 && typeof x[0] === 'string' && typeof x[1] === 'string' && /^(ok|bad)$/.test(x[0])) { const sp = document.createElement('span'); sp.className = x[0]; sp.textContent = x[1]; el.append(sp); }
      else x.forEach(add);
    };
    add(spec);
  }

  function render() {
    const attached = mem(), { n, peers } = net(), ok = offlineOK();
    put($('st'), attached ? ['ok', '● game attached'] : ['bad', '● waiting for game']);
    $('cashNow').textContent = attached ? money(i32(CASH)) : '—';
    $('cashFrz').checked = S.cashFreeze;
    put($('netInfo'), !n ? 'Game not running'
      : [ok ? ['ok', 'Offline'] : S.offlineByUs ? ['bad', 'Players nearby'] : ['bad', 'Online'], ` · players around: ${peers}`]);
    $('offBtn').hidden = !n || S.offlineByUs;
    $('car').className = ok ? '' : 'dis';
    const c = attached ? car() : 0;
    $('carInfo').textContent = c ? `Car found · ${Math.round(len(vec(c + VEL)) * 3.6)} km/h` : 'Car not found (menu or loading?)';
    put($('nosSt'), S.nosInf ? ['ok', 'ON'] : '');
    $('lock').checked = S.lockSpeed;
  }

  // ---------- keys ----------
  const inPanel = e => e.composedPath().includes(host);
  const typing = () => { const a = document.activeElement; return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable) || !!document.querySelector('dialog[open]'); };
  const swallow = e => { e.preventDefault(); e.stopImmediatePropagation(); };
  const keyMap = { KeyY: 'boost', KeyI: 'instant', PageDown: 'brake', End: 'jump', PageUp: 'phase', Insert: 'nosToggle', Delete: 'nosShort', KeyO: 'money' };
  function onKey(e) {
    if (inPanel(e)) { e.stopImmediatePropagation(); return; }
    if (e.code === 'F2') { if (e.type === 'keydown' && !e.repeat) A.toggle(); return swallow(e); }
    if (typing() || e.altKey || e.metaKey) return;
    const digit = /^Digit([1-9])$/.exec(e.code)?.[1];
    if (digit && (e.shiftKey || e.ctrlKey)) { if (e.type === 'keydown' && !e.repeat) (e.shiftKey ? A.savePos : A.warp)(digit); return swallow(e); }
    if (e.ctrlKey || e.shiftKey) return;
    const a = keyMap[e.code];
    if (!a) return;
    if (a === 'money' ? !mem() : !offlineOK()) return;   // when cheats are off, let the key reach the game
    if (e.type === 'keydown' && !e.repeat) A[a]();
    swallow(e);
  }
  for (const t of ['keydown', 'keyup']) window.addEventListener(t, onKey, true);
  window.addEventListener('keypress', e => { if (inPanel(e)) e.stopImmediatePropagation(); }, true);
  for (const t of ['mousedown', 'mouseup', 'click', 'pointerdown', 'pointerup', 'wheel', 'contextmenu', 'touchstart', 'touchend'])
    host.addEventListener(t, e => e.stopPropagation());

  const mount = () => (document.fullscreenElement || document.body || document.documentElement).appendChild(host);
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount, { once: true });
  document.addEventListener('fullscreenchange', mount);
})();
