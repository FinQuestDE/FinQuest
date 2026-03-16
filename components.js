// ═══════════════════════════════════════════════════════════
// FinQuest – Global Components (Navbar, Footer & Settings)
// ═══════════════════════════════════════════════════════════

// ─── Cosmetics lookup (mirrors SHOP_ITEMS in dashboard.html) ──
const FQ_FRAMES = {
  'frame-gold':    'border:3px solid #FFD166;box-shadow:0 0 14px rgba(255,209,102,0.55)',
  'frame-emerald': 'border:3px solid #00D48A;box-shadow:0 0 16px rgba(0,212,138,0.65)',
  'frame-fire':    'border:3px solid #FF6B6B;box-shadow:0 0 18px rgba(255,107,107,0.7)',
  'frame-diamond': 'border:3px solid #88CFFF;box-shadow:0 0 22px rgba(136,207,255,0.8)',
  'frame-galaxy':  'border:3px solid #b48eff;box-shadow:0 0 24px rgba(180,142,255,0.8),0 0 48px rgba(180,142,255,0.3)',
};
const FQ_BGS = {
  'bg-ocean':    'linear-gradient(135deg,#0077B6,#00B4D8)',
  'bg-fire2':    'linear-gradient(135deg,#FF4E00,#EC9F05)',
  'bg-galaxy2':  'linear-gradient(135deg,#7B2FBE,#E040FB)',
  'bg-midnight': 'linear-gradient(135deg,#1B1464,#2980B9)',
  'bg-forest':   'linear-gradient(135deg,#134E5E,#71B280)',
  'bg-sunset':   'linear-gradient(135deg,#f953c6,#b91d73)',
};

function fqGetCosmetics() {
  try {
    // Primär: dedizierter Kosmetik-Cache
    var c = JSON.parse(localStorage.getItem('fq_cosmetics') || 'null');
    if (c && (c.avatar || c.frame || c.bg)) return c;
    // Fallback: direkt aus dem User-Objekt lesen (funktioniert auch auf anderen Seiten)
    var email = localStorage.getItem('fq_current_user');
    if (email) {
      var users = JSON.parse(localStorage.getItem('fq_users') || '{}');
      var uc = users[email] && users[email].cosmetics;
      if (uc) {
        // Cache für nächstes Mal aktualisieren
        localStorage.setItem('fq_cosmetics', JSON.stringify(uc));
        return uc;
      }
    }
    return c || {};
  } catch(e) { return {}; }
}

function fqBuildAvatarStyle(cosm) {
  const bg = FQ_BGS[cosm.bg] || 'linear-gradient(135deg,#00D48A,#00a06a)';
  const fr = FQ_FRAMES[cosm.frame] || 'border:3px solid rgba(0,212,138,0.4)';
  return 'background:' + bg + ';' + fr;
}

// ─── Firebase helper (dynamic import – works in non-module scripts) ───
async function fqFirebase() {
  try {
    const [appMod, authMod, dbMod] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'),
    ]);
    const app = appMod.getApp();
    return { auth: authMod.getAuth(app), db: dbMod.getFirestore(app), authMod, dbMod };
  } catch(e) { console.warn('FQ Firebase not ready:', e); return null; }
}

// ─── Friends bridge ───────────────────────────────────────
window.fqHandleFriends = function() {
  if (typeof openFriendsModal === 'function') openFriendsModal();
  else window.location.href = 'dashboard.html';
};

// ─── Settings helpers ─────────────────────────────────────
function fqSetMsg(id, msg, ok) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.color = ok ? '#00D48A' : '#FF6B6B';
}

window.fqOpenSettings = function() {
  var ol = document.getElementById('fq-set-overlay');
  if (!ol) return;
  // Reset delete section
  var wrap    = document.getElementById('fq-del-confirm-wrap');
  var showBtn = document.getElementById('fq-del-show-btn');
  if (wrap)    wrap.style.display = 'none';
  if (showBtn) showBtn.style.display = 'block';
  var delInput = document.getElementById('fq-del-input');
  if (delInput) delInput.value = '';
  var delBtn = document.getElementById('fq-del-final-btn');
  if (delBtn) { delBtn.disabled = true; delBtn.textContent = '🗑️ Endgültig löschen'; }
  // Clear messages
  ['fq-set-name-msg','fq-set-pw-msg','fq-del-msg'].forEach(function(id){ fqSetMsg(id,'',true); });
  // Prefill username
  try {
    var email = localStorage.getItem('fq_current_user');
    var users = JSON.parse(localStorage.getItem('fq_users') || '{}');
    var u = users[email];
    if (u) { var nameEl = document.getElementById('fq-set-name'); if (nameEl) nameEl.value = u.name || ''; }
  } catch(e) {}
  ol.style.display = 'flex';
};

window.fqCloseSettings = function() {
  var ol = document.getElementById('fq-set-overlay');
  if (ol) ol.style.display = 'none';
};

// ─── Benutzername ändern ──────────────────────────────────
window.fqSaveUsername = async function() {
  var input   = document.getElementById('fq-set-name');
  var newName = input ? input.value.trim() : '';
  if (!newName || newName.length < 2) { fqSetMsg('fq-set-name-msg','Mind. 2 Zeichen erforderlich.',false); return; }
  var btn = document.getElementById('fq-set-name-btn');
  if (btn) btn.disabled = true;
  fqSetMsg('fq-set-name-msg','Wird geprüft…',true);
  try {
    var fb = await fqFirebase();
    if (!fb) throw new Error('Firebase nicht bereit.');

    // Prüfen ob der Name bereits vergeben ist (eigenen Account ausschließen)
    var currentUid = (window.FirebaseAuth && window.FirebaseAuth.auth)
      ? window.FirebaseAuth.auth.currentUser && window.FirebaseAuth.auth.currentUser.uid
      : null;
    var q    = fb.dbMod.query(
      fb.dbMod.collection(fb.db, 'users'),
      fb.dbMod.where('username', '==', newName)
    );
    var snap = await fb.dbMod.getDocs(q);
    // Wenn ein Treffer gefunden wurde der nicht der eigene Account ist → vergeben
    var takenByOther = false;
    snap.forEach(function(d) { if (d.id !== currentUid) takenByOther = true; });
    if (takenByOther) {
      fqSetMsg('fq-set-name-msg','Dieser Nutzername ist bereits vergeben.',false);
      return;
    }

    // Name ist frei – speichern
    if (currentUid) {
      await fb.dbMod.updateDoc(fb.dbMod.doc(fb.db,'users',currentUid), { username: newName });
    }
    var email = localStorage.getItem('fq_current_user');
    if (email) {
      var users = JSON.parse(localStorage.getItem('fq_users') || '{}');
      if (users[email]) { users[email].name = newName; localStorage.setItem('fq_users', JSON.stringify(users)); }
    }
    fqSetMsg('fq-set-name-msg','✅ Benutzername gespeichert!',true);
    fqUpdateNavbar();
  } catch(e) {
    fqSetMsg('fq-set-name-msg','Fehler: ' + e.message, false);
  } finally {
    if (btn) btn.disabled = false;
  }
};

// ─── Passwort ändern ─────────────────────────────────────
window.fqChangePassword = async function() {
  var curPw  = (document.getElementById('fq-set-pw-cur')  || {}).value;
  var newPw  = (document.getElementById('fq-set-pw-new')  || {}).value;
  var confPw = (document.getElementById('fq-set-pw-conf') || {}).value;
  if (!curPw || !newPw || !confPw) { fqSetMsg('fq-set-pw-msg','Alle Felder ausfüllen.',false); return; }
  if (newPw !== confPw)            { fqSetMsg('fq-set-pw-msg','Neue Passwörter stimmen nicht überein.',false); return; }
  if (newPw.length < 6)            { fqSetMsg('fq-set-pw-msg','Passwort muss mind. 6 Zeichen haben.',false); return; }
  var btn = document.getElementById('fq-set-pw-btn');
  if (btn) btn.disabled = true;
  fqSetMsg('fq-set-pw-msg','Wird geändert…',true);
  try {
    var fb = await fqFirebase();
    if (!fb || !fb.auth.currentUser) throw new Error('Nicht eingeloggt');
    var EmailAuthProvider = fb.authMod.EmailAuthProvider;
    var reauthenticateWithCredential = fb.authMod.reauthenticateWithCredential;
    var updatePassword = fb.authMod.updatePassword;
    var user = fb.auth.currentUser;
    var cred = EmailAuthProvider.credential(user.email, curPw);
    await reauthenticateWithCredential(user, cred);
    await updatePassword(user, newPw);
    fqSetMsg('fq-set-pw-msg','✅ Passwort erfolgreich geändert!',true);
    ['fq-set-pw-cur','fq-set-pw-new','fq-set-pw-conf'].forEach(function(id){
      var el = document.getElementById(id); if (el) el.value = '';
    });
  } catch(e) {
    var msg = e.code === 'auth/wrong-password'        ? 'Falsches aktuelles Passwort.' :
              e.code === 'auth/requires-recent-login'  ? 'Bitte erst aus- und wieder einloggen.' :
              e.message;
    fqSetMsg('fq-set-pw-msg', msg, false);
  } finally {
    if (btn) btn.disabled = false;
  }
};

// ─── Konto löschen ───────────────────────────────────────
window.fqCheckDeleteConfirm = function() {
  var val = (document.getElementById('fq-del-input') || {}).value;
  var btn = document.getElementById('fq-del-final-btn');
  if (btn) btn.disabled = (val || '').trim() !== 'LÖSCHEN';
};

window.fqDeleteAccountSettings = async function() {
  var btn = document.getElementById('fq-del-final-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Wird gelöscht…'; }
  try {
    // window.FirebaseAuth direkt nutzen – hat den aktiven Auth-State
    if (!window.FirebaseAuth || !window.FirebaseAuth.auth) throw new Error('Firebase nicht bereit.');
    var user = window.FirebaseAuth.auth.currentUser;
    if (!user) throw new Error('Nicht eingeloggt. Bitte aus- und wieder einloggen.');

    var fb = await fqFirebase();
    if (!fb) throw new Error('Firebase-Module konnten nicht geladen werden.');

    var email = localStorage.getItem('fq_current_user');
    var docFn = fb.dbMod.doc;
    // Best-effort: aus Freundeslisten entfernen
    try {
      var mySnap = await fb.dbMod.getDoc(docFn(fb.db,'users',user.uid));
      if (mySnap.exists()) {
        var friends = mySnap.data().friends || [];
        var arrayRemove = fb.dbMod.arrayRemove;
        var updateFn    = fb.dbMod.updateDoc;
        await Promise.all(friends.map(function(fid) {
          return updateFn(docFn(fb.db,'users',fid), { friends: arrayRemove(user.uid) }).catch(function(){});
        }));
      }
    } catch(e) {}
    await fb.dbMod.deleteDoc(docFn(fb.db,'users',user.uid));
    await fb.authMod.deleteUser(user);
    var users = JSON.parse(localStorage.getItem('fq_users') || '{}');
    if (email) delete users[email];
    localStorage.setItem('fq_users', JSON.stringify(users));
    localStorage.removeItem('fq_current_user');
    localStorage.removeItem('fq_cosmetics');
    window.location.href = 'finquest.html';
  } catch(e) {
    var msg = e.code === 'auth/requires-recent-login'
      ? 'Bitte erst ausloggen und wieder einloggen, dann nochmal versuchen.'
      : 'Fehler: ' + e.message;
    fqSetMsg('fq-del-msg', msg, false);
    if (btn) { btn.disabled = false; btn.textContent = '🗑️ Endgültig löschen'; }
  }
};

// ─── Settings Modal (injected once into body) ─────────────
function fqInjectSettingsModal() {
  if (document.getElementById('fq-set-overlay')) return;
  var html = '' +
    '<div id="fq-set-overlay" onclick="if(event.target===this)fqCloseSettings()"' +
    '  style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.78);z-index:9999;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(10px)">' +
    '  <div style="background:#16213E;border:1px solid rgba(255,255,255,0.1);border-radius:24px;width:100%;max-width:480px;display:flex;flex-direction:column;max-height:90vh;overflow:hidden;animation:fqModalIn .25s ease">' +
    '    <!-- Header -->' +
    '    <div style="display:flex;align-items:center;justify-content:space-between;padding:24px 28px 18px;border-bottom:1px solid rgba(255,255,255,0.07);flex-shrink:0">' +
    '      <div style="font-size:20px;font-weight:700;color:#F0F4FF;font-family:\'Clash Display\',\'DM Sans\',sans-serif">⚙️ Einstellungen</div>' +
    '      <button onclick="fqCloseSettings()" style="width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.07);border:none;color:#F0F4FF;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center" onmouseover="this.style.background=\'rgba(255,255,255,0.15)\'" onmouseout="this.style.background=\'rgba(255,255,255,0.07)\'">✕</button>' +
    '    </div>' +
    '    <!-- Body -->' +
    '    <div style="overflow-y:auto;padding:22px 28px 28px;display:flex;flex-direction:column;gap:16px">' +
    '      <!-- Benutzername -->' +
    '      <div class="fq-set-section">' +
    '        <div class="fq-set-stitle">👤 Benutzername ändern</div>' +
    '        <div style="display:flex;gap:8px">' +
    '          <input id="fq-set-name" class="fq-set-input" type="text" maxlength="30" placeholder="Neuer Benutzername" />' +
    '          <button id="fq-set-name-btn" class="fq-set-btn" onclick="fqSaveUsername()">Speichern</button>' +
    '        </div>' +
    '        <div id="fq-set-name-msg" class="fq-set-msg"></div>' +
    '      </div>' +
    '      <!-- Passwort -->' +
    '      <div class="fq-set-section">' +
    '        <div class="fq-set-stitle">🔑 Passwort ändern</div>' +
    '        <input id="fq-set-pw-cur"  class="fq-set-input" type="password" placeholder="Aktuelles Passwort" />' +
    '        <input id="fq-set-pw-new"  class="fq-set-input" type="password" placeholder="Neues Passwort (mind. 6 Zeichen)" style="margin-top:8px" />' +
    '        <input id="fq-set-pw-conf" class="fq-set-input" type="password" placeholder="Neues Passwort bestätigen" style="margin-top:8px" />' +
    '        <button id="fq-set-pw-btn" class="fq-set-btn" onclick="fqChangePassword()" style="margin-top:8px">Passwort ändern</button>' +
    '        <div id="fq-set-pw-msg" class="fq-set-msg"></div>' +
    '      </div>' +
    '      <!-- Gefahrenzone -->' +
    '      <div class="fq-set-section" style="border-color:rgba(255,107,107,0.3);background:rgba(255,107,107,0.04)">' +
    '        <div class="fq-set-stitle" style="color:#FF6B6B">⚠️ Konto löschen</div>' +
    '        <p style="font-size:12px;color:#8892B0;margin-bottom:14px;line-height:1.65">Diese Aktion ist <strong style="color:#F0F4FF">unwiderruflich</strong>. Alle Daten, XP, Fortschritte und Käufe werden dauerhaft gelöscht.</p>' +
    '        <button id="fq-del-show-btn" class="fq-set-btn" style="background:rgba(255,107,107,0.1);color:#FF6B6B;border:1.5px solid rgba(255,107,107,0.3)"' +
    '          onmouseover="this.style.background=\'rgba(255,107,107,0.2)\'" onmouseout="this.style.background=\'rgba(255,107,107,0.1)\'"' +
    '          onclick="document.getElementById(\'fq-del-confirm-wrap\').style.display=\'flex\';this.style.display=\'none\'">🗑️ Konto löschen</button>' +
    '        <div id="fq-del-confirm-wrap" style="display:none;flex-direction:column;gap:8px">' +
    '          <input id="fq-del-input" class="fq-set-input" type="text" placeholder="LÖSCHEN" autocomplete="off"' +
    '            style="color:#FF6B6B;border-color:rgba(255,107,107,0.35);letter-spacing:0.08em;font-weight:700"' +
    '            oninput="fqCheckDeleteConfirm()" />' +
    '          <div style="font-size:11px;color:#8892B0">Tippe <strong style="color:#F0F4FF">LÖSCHEN</strong> zur Bestätigung</div>' +
    '          <button id="fq-del-final-btn" class="fq-set-btn" onclick="fqDeleteAccountSettings()" disabled' +
    '            style="background:rgba(255,107,107,0.15);color:#FF6B6B;border:1.5px solid rgba(255,107,107,0.4)">🗑️ Endgültig löschen</button>' +
    '          <div id="fq-del-msg" class="fq-set-msg"></div>' +
    '        </div>' +
    '      </div>' +
    '    </div>' +
    '  </div>' +
    '</div>' +
    '<style>' +
    '@keyframes fqModalIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}' +
    '.fq-set-section{background:#0F3460;border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:18px 20px}' +
    '.fq-set-stitle{font-size:13px;font-weight:700;color:#F0F4FF;margin-bottom:12px;font-family:"Clash Display","DM Sans",sans-serif}' +
    '.fq-set-input{width:100%;background:#16213E;border:1.5px solid rgba(255,255,255,0.09);border-radius:12px;padding:11px 16px;font-family:"DM Sans",sans-serif;font-size:14px;color:#F0F4FF;outline:none;transition:border-color .2s,box-shadow .2s}' +
    '.fq-set-input:focus{border-color:#00D48A;box-shadow:0 0 0 3px rgba(0,212,138,0.12)}' +
    '.fq-set-input::placeholder{color:#8892B0}' +
    '.fq-set-btn{display:inline-flex;align-items:center;justify-content:center;padding:10px 18px;background:#00D48A;color:#0a0a14;border:none;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;transition:all .2s;font-family:"DM Sans",sans-serif;white-space:nowrap}' +
    '.fq-set-btn:hover:not(:disabled){box-shadow:0 4px 16px rgba(0,212,138,0.35);transform:translateY(-1px)}' +
    '.fq-set-btn:disabled{opacity:.35;cursor:not-allowed}' +
    '.fq-set-msg{font-size:12px;min-height:16px;margin-top:6px}' +
    '.fq-dd-btn{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;cursor:pointer;font-size:13px;font-weight:600;color:#F0F4FF;background:transparent;border:none;width:100%;font-family:"DM Sans",sans-serif;text-align:left;transition:background .15s}' +
    '.fq-dd-btn:hover{background:rgba(255,255,255,0.07)}' +
    '</style>';
  document.body.insertAdjacentHTML('beforeend', html);
}

// ─── CSS ─────────────────────────────────────────────────
function injectGlobalComponentStyles() {
  if (document.getElementById('fq-component-styles')) return;
  var style = document.createElement('style');
  style.id = 'fq-component-styles';
  style.textContent = [
    ':root{--color-primary:#00D48A;--color-secondary:#1A1A2E;--color-accent:#FFD166;--color-highlight:#FF6B6B;--color-surface:#16213E;--color-surface-2:#0F3460;--color-text-main:#F0F4FF;--color-text-muted:#8892B0;--color-border:rgba(0,212,138,0.2);--color-footer:#0D0D1A;--p:#00D48A;--s:#1A1A2E;--acc:#FFD166;--hl:#FF6B6B;--su:#16213E;--su2:#0F3460;--tx:#F0F4FF;--mu:#8892B0;--bo:rgba(0,212,138,0.2)}',
    '.fq-navbar{position:sticky;top:0;z-index:999;background:rgba(26,26,46,0.92);backdrop-filter:blur(14px);border-bottom:1px solid rgba(0,212,138,0.2)}',
    '.fq-navbar-inner{max-width:1180px;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between;height:64px}',
    '.fq-logo{font-size:22px;font-weight:700;text-decoration:none;display:flex;align-items:center;gap:6px;font-family:\'Clash Display\',\'DM Sans\',sans-serif}',
    '.fq-logo-fin{color:#F0F4FF}.fq-logo-quest{color:#00D48A}',
    '.fq-nav-links{display:flex;align-items:center;gap:28px;list-style:none;margin:0;padding:0}',
    '.fq-nav-links a{color:#8892B0;text-decoration:none;font-size:14px;font-weight:500;transition:color .2s}',
    '.fq-nav-links a:hover{color:#F0F4FF}',
    '.fq-nav-actions{display:flex;gap:10px;align-items:center}',
    '.fq-btn{display:inline-flex;align-items:center;gap:8px;padding:9px 18px;border-radius:50px;font-family:\'DM Sans\',sans-serif;font-weight:600;font-size:13px;cursor:pointer;border:none;transition:transform .2s,box-shadow .2s;text-decoration:none;line-height:1}',
    '.fq-btn:hover{transform:translateY(-2px)}',
    '.fq-btn-primary{background:#00D48A;color:#0a0a14}.fq-btn-primary:hover{box-shadow:0 8px 24px rgba(0,212,138,.4)}',
    '.fq-btn-outline{background:transparent;color:#F0F4FF;border:1.5px solid rgba(240,244,255,.3)}.fq-btn-outline:hover{background:rgba(255,255,255,.05)}',
    '.fq-btn-ghost{background:rgba(255,255,255,.06);color:#F0F4FF;border:1.5px solid rgba(240,244,255,.15)}.fq-btn-ghost:hover{border-color:rgba(240,244,255,.4)}',
    '.fq-nav-user{display:flex;align-items:center;gap:8px;background:#16213E;border:1px solid rgba(0,212,138,.2);border-radius:50px;padding:5px 12px 5px 6px;font-size:13px;text-decoration:none;transition:border-color .2s;color:#F0F4FF;cursor:pointer;user-select:none}',
    '.fq-nav-user:hover{border-color:#00D48A}',
    '.fq-nav-avatar{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#00D48A,#00a06a);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#0a0a14;flex-shrink:0}',
    '.fq-nav-xp{font-family:\'JetBrains Mono\',monospace;color:#FFD166;font-weight:600}',
    '.fq-hamburger{display:none;flex-direction:column;gap:5px;cursor:pointer;background:none;border:none;padding:4px}',
    '.fq-hamburger span{display:block;width:22px;height:2px;background:#F0F4FF;border-radius:2px}',
    '.fq-mobile-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:1000}',
    '.fq-mobile-menu{position:fixed;top:0;right:-100%;width:280px;height:100vh;background:#16213E;z-index:1001;padding:72px 28px 40px;display:flex;flex-direction:column;gap:4px;border-left:1px solid rgba(0,212,138,.2);transition:right .35s cubic-bezier(.25,.46,.45,.94)}',
    '.fq-mobile-menu.open{right:0}',
    '.fq-mobile-menu a{color:#F0F4FF;text-decoration:none;font-size:17px;font-weight:600;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.06);display:block}',
    '.fq-mobile-close{position:absolute;top:18px;right:18px;background:none;border:none;color:#F0F4FF;font-size:22px;cursor:pointer}',
    '.fq-footer{background:#0D0D1A;border-top:1px solid rgba(255,255,255,.06);padding:56px 24px 0;margin-top:40px}',
    '.fq-footer-wrap{max-width:1180px;margin:0 auto}',
    '.fq-footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:48px;padding-bottom:48px}',
    '.fq-footer-brand p{font-size:14px;color:#8892B0;line-height:1.65;max-width:260px;margin-top:12px}',
    '.fq-footer-socials{display:flex;gap:10px;margin-top:20px}',
    '.fq-footer-soc{width:36px;height:36px;border-radius:8px;background:#16213E;border:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;font-size:15px;text-decoration:none;transition:border-color .2s,transform .2s}',
    '.fq-footer-soc:hover{border-color:rgba(0,212,138,.3);transform:translateY(-2px)}',
    '.fq-footer-col h4{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin-bottom:14px;color:#F0F4FF}',
    '.fq-footer-col ul{list-style:none;display:flex;flex-direction:column;gap:9px;padding:0;margin:0}',
    '.fq-footer-col ul a{font-size:13px;color:#8892B0;text-decoration:none;transition:color .2s}',
    '.fq-footer-col ul a:hover{color:#F0F4FF}',
    '.fq-footer-bottom{border-top:1px solid rgba(255,255,255,.06);padding:18px 0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;font-size:12px;color:rgba(255,255,255,.25)}',
    '.fq-footer-bottom a{color:inherit;text-decoration:none}',
    '@media(max-width:1024px){.fq-footer-grid{grid-template-columns:1fr 1fr}}',
    '@media(max-width:768px){.fq-nav-links,.fq-nav-actions{display:none}.fq-hamburger{display:flex}.fq-footer-grid{grid-template-columns:1fr;gap:32px}.fq-footer-bottom{flex-direction:column;align-items:flex-start}}',
  ].join('');
  document.head.appendChild(style);
}

// ─── Navbar HTML ─────────────────────────────────────────
function renderNavbar() {
  if (document.getElementById('fq-navbar')) return;
  var navHtml = '' +
    '<nav class="fq-navbar" id="fq-navbar"><div class="fq-navbar-inner">' +
    '<a href="finquest.html" class="fq-logo"><span>🚀</span><span class="fq-logo-fin">Fin</span><span class="fq-logo-quest">Quest</span></a>' +
    '<ul class="fq-nav-links"><li><a href="finquest.html#how">Wie es funktioniert</a></li><li><a href="finquest.html#courses">Kurse</a></li><li><a href="finquest.html#pricing">Preise</a></li></ul>' +
    '<div id="fq-nav-actions" class="fq-nav-actions"><a href="login.html" class="fq-btn fq-btn-outline">Einloggen</a><a href="register.html" class="fq-btn fq-btn-primary">Kostenlos starten</a></div>' +
    '<button class="fq-hamburger" onclick="fqOpenMenu()" aria-label="Menü öffnen"><span></span><span></span><span></span></button>' +
    '</div></nav>' +
    '<div class="fq-mobile-overlay" id="fqMobileOverlay" onclick="fqCloseMenu()"></div>' +
    '<div class="fq-mobile-menu" id="fqMobileMenu">' +
    '<button class="fq-mobile-close" onclick="fqCloseMenu()">✕</button>' +
    '<a href="finquest.html#how" onclick="fqCloseMenu()">Wie es funktioniert</a>' +
    '<a href="finquest.html#courses" onclick="fqCloseMenu()">Kurse</a>' +
    '<a href="finquest.html#pricing" onclick="fqCloseMenu()">Preise</a>' +
    '<div id="fq-mobile-auth" style="margin-top:20px;display:flex;flex-direction:column;gap:4px">' +
    '<a href="login.html" onclick="fqCloseMenu()">Einloggen</a>' +
    '<a href="register.html" onclick="fqCloseMenu()" style="color:#00D48A">Kostenlos starten →</a>' +
    '</div></div>';
  document.body.insertAdjacentHTML('afterbegin', navHtml);
  window.fqOpenMenu = function() { document.getElementById('fqMobileMenu').classList.add('open'); document.getElementById('fqMobileOverlay').style.display='block'; document.body.style.overflow='hidden'; };
  window.fqCloseMenu = function() { document.getElementById('fqMobileMenu').classList.remove('open'); document.getElementById('fqMobileOverlay').style.display='none'; document.body.style.overflow=''; };
  window.openMenu  = window.fqOpenMenu;
  window.closeMenu = window.fqCloseMenu;
}

// ─── Footer HTML ─────────────────────────────────────────
function renderFooter() {
  if (document.getElementById('fq-footer')) return;
  var footerHtml = '' +
    '<footer class="fq-footer" id="fq-footer"><div class="fq-footer-wrap"><div class="fq-footer-grid">' +
    '<div class="fq-footer-brand"><a href="finquest.html" class="fq-logo"><span>🚀</span><span class="fq-logo-fin">Fin</span><span class="fq-logo-quest">Quest</span></a><p>Deine Reise zur finanziellen Freiheit beginnt hier. Gamifizierte Finanzbildung für junge Menschen.</p>' +
    '<div class="fq-footer-socials"><a href="#" class="fq-footer-soc">📸</a><a href="#" class="fq-footer-soc">🎵</a><a href="#" class="fq-footer-soc">💼</a><a href="#" class="fq-footer-soc">▶️</a></div></div>' +
    '<div class="fq-footer-col"><h4>Produkt</h4><ul><li><a href="finquest.html#how">Wie es funktioniert</a></li><li><a href="dashboard.html">Kurse</a></li><li><a href="finquest.html#pricing">Preise</a></li><li><a href="premium.html">Premium</a></li><li><a href="challenges.html">Challenges</a></li></ul></div>' +
    '<div class="fq-footer-col"><h4>Unternehmen</h4><ul><li><a href="ueber-uns.html">Über uns</a></li><li><a href="blog.html">Blog</a></li><li><a href="schulen.html">Für Schulen</a></li><li><a href="karriere.html">Karriere</a></li><li><a href="presse.html">Presse</a></li></ul></div>' +
    '<div class="fq-footer-col"><h4>Support</h4><ul><li><a href="hilfe.html">Hilfe-Center</a></li><li><a href="kontakt.html">Kontakt</a></li><li><a href="community.html">Community</a></li><li><a href="api-status.html">API-Status</a></li></ul></div>' +
    '</div><div class="fq-footer-bottom">' +
    '<span>© 2025 FinQuest GmbH &nbsp;·&nbsp; <a href="datenschutz.html">Datenschutz</a> &nbsp;·&nbsp; <a href="impressum.html">Impressum</a> &nbsp;·&nbsp; <a href="agb.html">AGB</a></span>' +
    '<span>Keine Finanzberatung. Alle Inhalte dienen ausschließlich der Bildung.</span>' +
    '</div></div></footer>';
  document.body.insertAdjacentHTML('beforeend', footerHtml);
}

// ─── Navbar auth update (one pill + dropdown) ─────────────
function fqUpdateNavbar() {
  try {
    var email = localStorage.getItem('fq_current_user');
    if (!email) return;
    var users = JSON.parse(localStorage.getItem('fq_users') || '{}');
    var user  = users[email];
    if (!user) return;

    var firstName = user.name.split(' ')[0];
    var xp        = user.totalXP || 0;
    var cosm      = fqGetCosmetics();
    var avatarContent = cosm.avatar || user.name.split(' ').map(function(w){ return w[0]; }).join('').slice(0,2).toUpperCase();
    var avStyle   = fqBuildAvatarStyle(cosm);

    var actionsEl = document.getElementById('fq-nav-actions');
    if (actionsEl) {
      var pillSt  = 'display:inline-flex;align-items:center;gap:8px;background:#16213E;border:1px solid rgba(0,212,138,0.25);border-radius:50px;padding:5px 14px 5px 6px;font-size:13px;font-weight:500;text-decoration:none;color:#F0F4FF;cursor:pointer;font-family:DM Sans,sans-serif;line-height:1';
      var avSt    = avStyle + ';width:30px;height:30px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;flex-shrink:0;color:#0a0a14';
      var xpSt    = 'font-family:JetBrains Mono,monospace;color:#FFD166;font-weight:600;font-size:13px';
      var ddSt    = 'display:none;position:absolute;top:calc(100% + 10px);right:0;background:#16213E;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:8px;min-width:215px;box-shadow:0 16px 40px rgba(0,0,0,0.55);z-index:9999';
      var btnSt   = 'display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;cursor:pointer;font-size:13px;font-weight:600;color:#F0F4FF;background:transparent;border:none;width:100%;font-family:DM Sans,sans-serif;text-align:left;';

      actionsEl.innerHTML =
        '<div style="position:relative;z-index:1000" id="fq-profile-wrap">' +
          '<a href="dashboard.html" id="fq-profile-pill" style="' + pillSt + '">' +
            '<div id="fq-nav-av" style="' + avSt + '">' + avatarContent + '</div>' +
            '<span style="font-size:13px;font-weight:600;color:#F0F4FF">' + firstName + '</span>' +
            '<span style="' + xpSt + '">&#9889;' + xp + '</span>' +
            '<span style="font-size:10px;color:#8892B0;margin-left:2px">&#9660;</span>' +
          '</a>' +
          '<div id="fq-nav-dd" style="' + ddSt + '">' +
            '<div style="padding:10px 12px 12px;border-bottom:1px solid rgba(255,255,255,0.07);margin-bottom:6px">' +
              '<div style="font-size:14px;font-weight:700;color:#F0F4FF">' + user.name + '</div>' +
              '<div style="font-size:11px;color:#8892B0;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:185px">' + email + '</div>' +
            '</div>' +
            '<button onclick="fqHandleFriends()" style="' + btnSt + '" onmouseover="this.style.background=\'rgba(255,255,255,0.07)\'" onmouseout="this.style.background=\'transparent\'">&#128101; Freunde <span id="fq-req-badge" style="display:none;margin-left:auto;background:#FF6B6B;color:#fff;font-size:9px;font-weight:700;padding:1px 7px;border-radius:50px">0</span></button>' +
            '<button onclick="fqOpenSettings()" style="' + btnSt + '" onmouseover="this.style.background=\'rgba(255,255,255,0.07)\'" onmouseout="this.style.background=\'transparent\'">&#9881; Einstellungen</button>' +
            '<div style="height:1px;background:rgba(255,255,255,0.07);margin:4px 0"></div>' +
            '<button onclick="localStorage.removeItem(\'fq_current_user\');window.location.href=\'finquest.html\'" style="' + btnSt + 'color:#FF6B6B" onmouseover="this.style.background=\'rgba(255,107,107,0.1)\'" onmouseout="this.style.background=\'transparent\'">&#128682; Ausloggen</button>' +
          '</div>' +
        '</div>';

      // Hover auf wrapper → Dropdown zeigen; Pill navigiert zu dashboard.html
      var wrap = document.getElementById('fq-profile-wrap');
      var dd   = document.getElementById('fq-nav-dd');
      if (wrap && dd) {
        wrap.addEventListener('mouseenter', function(){ dd.style.display = 'block'; });
        wrap.addEventListener('mouseleave', function(){ dd.style.display = 'none'; });
        // Klick auf Dropdown-Bereich soll NICHT zum Dashboard navigieren
        dd.addEventListener('mousedown', function(e){ e.stopPropagation(); });
      }

      // Friend-request badge
      if (typeof window.loadMyFriendsData === 'function') {
        window.loadMyFriendsData().then(function(d) {
          var n = (d.requests||[]).length;
          var badge = document.getElementById('fq-req-badge');
          if (badge) { badge.textContent = n; badge.style.display = n > 0 ? 'inline-block' : 'none'; }
        }).catch(function(){});
      }
    }

    var mobileAuth = document.getElementById('fq-mobile-auth');
    if (mobileAuth) {
      mobileAuth.innerHTML =
        '<a href="dashboard.html" onclick="fqCloseMenu&&fqCloseMenu()" style="color:#00D48A">👤 Mein Dashboard</a>' +
        '<a href="#" onclick="fqOpenSettings&&fqOpenSettings()" style="color:#F0F4FF">⚙️ Einstellungen</a>' +
        '<a href="#" onclick="localStorage.removeItem(\'fq_current_user\');window.location.href=\'finquest.html\'" style="color:#FF6B6B">🚪 Ausloggen</a>';
    }
  } catch(e) {}
}

// ─── Auto-Render ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  if (document.querySelector('meta[name="no-components"]')) return;

  injectGlobalComponentStyles();

  if (!document.getElementById('fq-navbar')) renderNavbar();

  var noFooterPages = ['dashboard.html','login.html','register.html'];
  var currentPage   = location.pathname.split('/').pop();
  if (!document.getElementById('fq-footer') && noFooterPages.indexOf(currentPage) === -1) {
    renderFooter();
  }

  fqUpdateNavbar();
  fqInjectSettingsModal();
});
