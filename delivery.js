import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getFirestore, collection, onSnapshot, doc, updateDoc, writeBatch, serverTimestamp, deleteField } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';

const app = initializeApp(firebaseConfig), db = getFirestore(app), auth = getAuth(app);
let customers = [], unsubscribe = null;
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const phoneHref = p => String(p || '').replace(/[^+\d]/g, '');
const safeMap = raw => { try { if (!raw) return ''; const u = new URL(raw); return u.protocol === 'https:' && /(^|\.)google\.(com|co\.in)$|(^|\.)maps\.app\.goo\.gl$/.test(u.hostname) ? u.href : ''; } catch { return ''; } };
const callSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15.8 15.8 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11.5 11.5 0 0 0 3.6.58 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.5 11.5 0 0 0 .58 3.6 1 1 0 0 1-.25 1z"/></svg>';
const mapSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/></svg>';

$('login').onclick = async () => { $('loginMsg').textContent=''; try { await signInWithEmailAndPassword(auth, $('email').value.trim(), $('password').value); } catch { $('loginMsg').textContent='Sign-in failed. Check your delivery ID and password.'; } };
$('signOut').onclick = () => signOut(auth);

onAuthStateChanged(auth, async user => {
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  $('loginGate').classList.toggle('hidden', !!user);
  $('signOut').classList.toggle('hidden', !user);
  $('appContent').classList.add('hidden');
  $('accessDenied').classList.add('hidden');
  if (!user) return;
  try {
    const snap = await import('https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js').then(({getDoc}) => getDoc(doc(db,'staff',user.uid)));
    const role = snap.exists() ? snap.data().role : '';
    if (role !== 'delivery') {
      $('accessDenied').classList.remove('hidden');
      await signOut(auth);
      return;
    }
    $('appContent').classList.remove('hidden');
    listen();
  } catch {
    $('loginGate').classList.add('hidden');
    $('accessDenied').classList.remove('hidden');
    await signOut(auth);
  }
});

function listen() {
  unsubscribe = onSnapshot(collection(db,'customers'), snap => {
    customers = snap.docs.map(d => ({id:d.id, ...d.data(), delivered:d.data().delivered === true}));
    render();
  }, () => { $('status').textContent='Unable to load customers. Check Firestore rules.'; });
}
function render() {
  const q = $('search').value.toLowerCase().trim();
  const filtered = customers.filter(c => [c.name,c.location,c.phone,c.address].some(v => String(v||'').toLowerCase().includes(q)));
  $('count').textContent = filtered.length;
  const groups = {};
  filtered.forEach(c => (groups[c.location || 'Other'] ??= []).push(c));
  const root = $('locations'); root.innerHTML='';
  Object.keys(groups).sort((a,b)=>a.localeCompare(b)).forEach(loc => {
    const list = groups[loc].sort((a,b)=>Number(a.delivered)-Number(b.delivered)||String(a.name).localeCompare(String(b.name)));
    const box = document.createElement('section'); box.className='location';
    box.innerHTML=`<div class="lochead"><span>${mapSvg}<span>${esc(loc)}</span></span><span class="badge">${list.length}</span></div>`;
    list.forEach(c=>box.appendChild(customerRow(c))); root.appendChild(box);
  });
  if (!Object.keys(groups).length) root.innerHTML='<div class="empty">No customers found.</div>';
}
function customerRow(c) {
  const row=document.createElement('div'); row.className=`customer${c.delivered?' delivered':''}`; const map=safeMap(c.mapLink);
  row.innerHTML=`<div class="line"><label class="delivery-check" title="Food delivered"><input class="deliveredBox" type="checkbox" ${c.delivered?'checked':''}><span></span></label><div class="avatar">${esc((c.name||'?')[0].toUpperCase())}</div><div class="info"><div class="name">${esc(c.name)}</div>${c.address?`<div class="addr">${esc(c.address)}</div>`:''}${c.delivered?'<div class="delivered-label">Delivered</div>':''}</div><div class="actions"><a class="icon call-icon" aria-label="Call customer" href="tel:${esc(phoneHref(c.phone))}">${callSvg}</a><button class="icon expand" type="button" aria-label="Show phone">⌄</button>${map?`<a class="icon map-icon" aria-label="Open location" target="_blank" rel="noopener noreferrer" href="${esc(map)}">${mapSvg}</a>`:''}</div></div><div class="phone"><b>${esc(c.phone)}</b><a class="icon call-icon" aria-label="Call customer" href="tel:${esc(phoneHref(c.phone))}">${callSvg}</a>${map?`<a class="icon map-icon" aria-label="Open location" target="_blank" rel="noopener noreferrer" href="${esc(map)}">${mapSvg}</a>`:''}</div>`;
  row.querySelector('.expand').onclick=()=>row.querySelector('.phone').classList.toggle('open');
  row.querySelector('.deliveredBox').onchange=async e=>{e.target.disabled=true;try{await updateDoc(doc(db,'customers',c.id),e.target.checked?{delivered:true,deliveredAt:serverTimestamp()}:{delivered:false,deliveredAt:deleteField()});}catch{e.target.checked=!e.target.checked;$('status').textContent='Could not update delivery status.';}finally{e.target.disabled=false;}};
  return row;
}
$('search').oninput=render;
$('resetDelivered').onclick=async()=>{const delivered=customers.filter(c=>c.delivered);if(!delivered.length){$('status').textContent='No delivered ticks to reset.';return;}if(!confirm(`Reset ${delivered.length} delivered tick${delivered.length===1?'':'s'}?`))return;$('resetDelivered').disabled=true;try{const batch=writeBatch(db);delivered.forEach(c=>batch.update(doc(db,'customers',c.id),{delivered:false,deliveredAt:deleteField()}));await batch.commit();$('status').textContent='All delivery ticks reset.';}catch{$('status').textContent='Reset failed.';}finally{$('resetDelivered').disabled=false;}};
