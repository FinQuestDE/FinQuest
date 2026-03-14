// ═══════════════════════════════════════════════════════════
//  FinQuest – Zentrales Auth & Progress System
// ═══════════════════════════════════════════════════════════

const FQ = {

  // ── Nutzer-Verwaltung ──────────────────────────────────────
  init() {
    // Legacy stub to prevent script errors in older files
  },
  
  getUsers() {
    return JSON.parse(localStorage.getItem('fq_users') || '{}');
  },
  saveUsers(users) {
    localStorage.setItem('fq_users', JSON.stringify(users));
  },
  getCurrentUser() {
    const email = localStorage.getItem('fq_current_user');
    if (!email) return null;
    const users = this.getUsers();
    return users[email] || null;
  },
  isLoggedIn() {
    return !!this.getCurrentUser();
  },

  // Sicheres base64 Encoding um Abstürze bei Umlauten zu vermeiden
  _encodePw(pw) {
    try { return btoa(pw); } 
    catch(e) { return btoa(encodeURIComponent(pw)); }
  },

  // Helper um sicherzustellen dass Firebase geladen ist
  async _ensureFirebase() {
    if (window.FirebaseAuth) return true;
    console.log("Warte auf Firebase Initialization...");
    return new Promise((resolve) => {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.FirebaseAuth) {
          console.log("Firebase geladen nach", attempts * 100, "ms");
          clearInterval(interval);
          resolve(true);
        } else if (attempts >= 100) { // 10s timeout (100 * 100ms)
          console.error("Firebase Timeout! Stelle sicher dass firebase-init.js korrekt konfiguriert ist.");
          clearInterval(interval);
          resolve(false);
        }
      }, 100);
    });
  },

  // ── Registrierung ──────────────────────────────────────────
  async register(name, email, password) {
    const isLoaded = await this._ensureFirebase();
    if (!isLoaded) return { ok: false, msg: 'Verbindung zum Server fehlgeschlagen. Lade die Seite neu.' };

    try {
      const cred = await window.FirebaseAuth.createUserWithEmailAndPassword(window.FirebaseAuth.auth, email, password);
      const userId = cred.user.uid;

      // Firestore-Profil anlegen (separat, damit Auth-Erfolg nicht davon abhängt)
      const dataToSave = {
        username:       name,
        xp:             0,
        finCoins:       0,
        title:          "",
        progress:       {},
        streak:         0,
        lastActive:     Date.now(),
        learnHistory:   [],
        cosmetics:      { avatar: '😊', frame: null, bg: null, title: null, owned: [] },
        claimedRewards: {},
        spentXP:        0,
        createdAt:      Date.now(),
      };

      try {
        const db = window.FirebaseDB.db;
        const docRef = window.FirebaseDB.doc(db, "users", userId);
        await window.FirebaseDB.setDoc(docRef, dataToSave);
      } catch(fsErr) {
        // Firestore-Fehler loggen aber Registrierung nicht abbrechen
        // User kann trotzdem eingeloggt werden, Profil wird beim nächsten Login-Sync nachgeholt
        console.error("Firestore setDoc Fehler (nicht kritisch):", fsErr);
      }

      // Lokalen Speicher aktualisieren
      const users = this.getUsers();
      users[email] = {
        id: userId,
        name, email, password: '', createdAt: Date.now(),
        progress: {}, totalXP: 0, finCoins: 0, streak: 0,
        lastActive: Date.now(), learnHistory: [],
        cosmetics: { avatar: '😊', frame: null, bg: null, title: null, owned: [] },
        claimedRewards: {}, spentXP: 0,
      };
      this.saveUsers(users);
      localStorage.setItem('fq_current_user', email);

      // Firestore-Profil nochmals versuchen falls erster Versuch fehlschlug
      if (window.FirebaseDB && window.FirebaseDB.db) {
        try {
          const db = window.FirebaseDB.db;
          const docRef = window.FirebaseDB.doc(db, "users", userId);
          const snap = await window.FirebaseDB.getDoc(docRef);
          if (!snap.exists()) {
            await window.FirebaseDB.setDoc(docRef, dataToSave);
          }
        } catch(e) { /* ignore */ }
      }

      return { ok: true };
    } catch(e) {
      console.error("Registrierung Fehler:", e);
      let msg = e.message || 'Ein Fehler ist aufgetreten.';
      if (e.code === 'auth/email-already-in-use') msg = 'Diese E-Mail wird bereits verwendet.';
      if (e.code === 'auth/weak-password') msg = 'Das Passwort ist zu schwach (min. 6 Zeichen).';
      return { ok: false, msg };
    }
  },

  // ── Login ──────────────────────────────────────────────────
  async login(email, password) {
    const isLoaded = await this._ensureFirebase();
    if (!isLoaded) return { ok: false, msg: 'Verbindung zum Server fehlgeschlagen (Timeout). Lade die Seite neu.' };

    try {
      const cred = await window.FirebaseAuth.signInWithEmailAndPassword(window.FirebaseAuth.auth, email, password);
      const userId = cred.user.uid;

      // Firestore-Profil laden
      const db = window.FirebaseDB.db;
      const docRef = window.FirebaseDB.doc(db, "users", userId);
      const snap = await window.FirebaseDB.getDoc(docRef);

      let fsData = {};
      if (snap.exists()) fsData = snap.data();

      // Streak aus learnHistory neu berechnen (nicht dem gespeicherten Wert vertrauen)
      const learnHistory = fsData.learnHistory || [];
      const recalcStreak = this._calcStreak(learnHistory);

      // Lokalen User-Datensatz vollständig aus Firestore aufbauen
      const now = Date.now();
      const users = this.getUsers();
      users[email] = {
        id:             userId,
        name:           fsData.username   || email,
        email,
        password:       '',
        createdAt:      fsData.createdAt  || now,
        progress:       fsData.progress   || {},
        totalXP:        fsData.xp         || 0,
        finCoins:       fsData.finCoins   || 0,
        streak:         recalcStreak,
        lastActive:     now,
        learnHistory:   learnHistory,
        cosmetics:      fsData.cosmetics  || { avatar: '😊', frame: null, bg: null, title: null, owned: [] },
        claimedRewards: fsData.claimedRewards || {},
        spentXP:        fsData.spentXP    || 0,
        premium:        fsData.premium    || false,
        title:          fsData.title      || '',
      };
      this.saveUsers(users);
      localStorage.setItem('fq_current_user', email);

      // Kosmetika auch lokal cachen
      if (users[email].cosmetics) {
        localStorage.setItem('fq_cosmetics', JSON.stringify(users[email].cosmetics));
      }

      // Aktualisierte Streak + lastActive zurück zu Firestore
      window.FirebaseDB.updateDoc(docRef, {
        streak: recalcStreak,
        lastActive: now,
        learnHistory: learnHistory,
      }).catch(console.error);

      return { ok: true };
    } catch(e) {
      console.error("Login Fehler Objekt:", e);
      let msg = `[${e.code}] ${e.message}`;
      if (e.code === 'auth/invalid-credential') msg = 'E-Mail oder Passwort falsch.';
      return { ok: false, msg };
    }
  },

  // ── Logout ─────────────────────────────────────────────────
  async logout() {
    if (window.FirebaseAuth) await window.FirebaseAuth.signOut(window.FirebaseAuth.auth);
    localStorage.removeItem('fq_current_user');
    window.location.href = 'finquest.html';
  },

  // ── Progress speichern ─────────────────────────────────────
  saveProgress(courseKey, completedArr, xpEarned) {
    const email = localStorage.getItem('fq_current_user');
    if (!email) return;
    const users = this.getUsers();
    const user = users[email];
    if (!user) return;
    const oldArr = user.progress[courseKey] || [];
    const newItems = completedArr.filter(i => !oldArr.includes(i));
    user.progress[courseKey] = completedArr;
    user.totalXP = (user.totalXP || 0) + newItems.length * xpEarned;
    user.lastActive = Date.now();

    // Heute als Lerntag markieren & Streak neu berechnen
    const todayStr = new Date().toISOString().slice(0, 10);
    if (!user.learnHistory) user.learnHistory = [];
    if (!user.learnHistory.includes(todayStr)) user.learnHistory.push(todayStr);
    user.streak = this._calcStreak(user.learnHistory);

    this.saveUsers(users);
    this.syncToFirestore(user);
  },

  // ── Streak berechnen ───────────────────────────────────────
  _calcStreak(learnHistory) {
    if (!learnHistory || learnHistory.length === 0) return 0;
    const histSet = new Set(learnHistory);
    const todayStr = new Date().toISOString().slice(0, 10);
    const check = new Date();
    if (!histSet.has(todayStr)) check.setDate(check.getDate() - 1);
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const ds = check.toISOString().slice(0, 10);
      if (histSet.has(ds)) { streak++; check.setDate(check.getDate() - 1); }
      else break;
    }
    return streak;
  },

  // ── Alles zu Firestore synken ──────────────────────────────
  syncToFirestore(user) {
    if (!window.FirebaseDB || !window.FirebaseDB.db || !user || !user.id) return;
    const db = window.FirebaseDB.db;
    const docRef = window.FirebaseDB.doc(db, "users", user.id);
    const payload = {
      xp:             user.totalXP      || 0,
      finCoins:       user.finCoins      || 0,
      progress:       user.progress     || {},
      streak:         user.streak       || 0,
      lastActive:     user.lastActive   || Date.now(),
      learnHistory:   user.learnHistory  || [],
      cosmetics:      user.cosmetics    || { avatar: '😊', frame: null, bg: null, title: null, owned: [] },
      claimedRewards: user.claimedRewards || {},
      spentXP:        user.spentXP      || 0,
      title:          (user.cosmetics && user.cosmetics.title) ? (() => {
        // title-string für Leaderboard extrahieren
        return user.cosmetics.title;
      })() : (user.title || ''),
    };
    window.FirebaseDB.updateDoc(docRef, payload).catch(e => {
      if (e.code === 'not-found') {
        window.FirebaseDB.setDoc(docRef, { username: user.name || 'User', ...payload }).catch(console.error);
      } else {
        console.error('Firestore sync Fehler:', e);
      }
    });
  },

  // ── XP direkt gutschreiben (Challenge-Belohnungen) ─────────
  addXP(amount) {
    const email = localStorage.getItem('fq_current_user');
    if (!email) return 0;
    const users = this.getUsers();
    const user = users[email];
    if (!user) return 0;
    user.totalXP = (user.totalXP || 0) + amount;
    user.lastActive = Date.now();
    this.saveUsers(users);
    this.syncToFirestore(user);
    return user.totalXP;
  },

  // ── FinCoins gutschreiben ──────────────────────────────────
  addFinCoins(amount) {
    const email = localStorage.getItem('fq_current_user');
    if (!email) return 0;
    const users = this.getUsers();
    const user = users[email];
    if (!user) return 0;
    user.finCoins = (user.finCoins || 0) + amount;
    this.saveUsers(users);
    this.syncToFirestore(user);
    return user.finCoins;
  },

  // ── Challenge-Belohnung als abgeholt markieren ─────────────
  // challengeId: z.B. "kurs_geld101" (permanent) oder
  //              "daily_streak_2025-06-01" / "weekly_marathon_2025-W22" (zeitbasiert)
  claimChallengeReward(challengeId) {
    const email = localStorage.getItem('fq_current_user');
    if (!email) return false;
    const users = this.getUsers();
    const user = users[email];
    if (!user) return false;
    if (!user.claimedRewards) user.claimedRewards = {};
    if (user.claimedRewards[challengeId]) return false;
    user.claimedRewards[challengeId] = Date.now();
    this.saveUsers(users);
    this.syncToFirestore(user);
    return true;
  },

  isChallengeRewardClaimed(challengeId) {
    const user = this.getCurrentUser();
    if (!user) return false;
    return !!(user.claimedRewards || {})[challengeId];
  },

  // ── Kosmetika speichern ────────────────────────────────────
  saveCosmetics(cosm) {
    const email = localStorage.getItem('fq_current_user');
    if (!email) { localStorage.setItem('fq_cosmetics', JSON.stringify(cosm)); return; }
    const users = this.getUsers();
    const user = users[email];
    if (!user) return;
    user.cosmetics = cosm;
    this.saveUsers(users);
    // Lokaler Cache für schnelles Laden ohne Firebase-Wartezeit
    localStorage.setItem('fq_cosmetics', JSON.stringify(cosm));
    this.syncToFirestore(user);
  },

  getCosmetics() {
    const user = this.getCurrentUser();
    if (user && user.cosmetics) return user.cosmetics;
    try { return JSON.parse(localStorage.getItem('fq_cosmetics') || 'null') || { avatar: '😊', frame: null, bg: null, title: null, owned: [] }; }
    catch(e) { return { avatar: '😊', frame: null, bg: null, title: null, owned: [] }; }
  },

  // ── Spent XP für Shop ──────────────────────────────────────
  getSpentXP() {
    const user = this.getCurrentUser();
    if (user && user.spentXP !== undefined) return user.spentXP;
    return parseInt(localStorage.getItem('fq_spent_xp') || '0');
  },

  addSpentXP(amount) {
    const email = localStorage.getItem('fq_current_user');
    if (!email) { localStorage.setItem('fq_spent_xp', this.getSpentXP() + amount); return; }
    const users = this.getUsers();
    const user = users[email];
    if (!user) return;
    user.spentXP = (user.spentXP || 0) + amount;
    this.saveUsers(users);
    this.syncToFirestore(user);
  },

  // ── Progress lesen ─────────────────────────────────────────
  getProgress(courseKey) {
    const user = this.getCurrentUser();
    if (!user) return [];
    return user.progress[courseKey] || [];
  },

  // ── Gesamt-XP ──────────────────────────────────────────────
  getTotalXP() {
    const user = this.getCurrentUser();
    return user ? (user.totalXP || 0) : 0;
  },

  // ── Demo-Account erstellen ─────────────────────────────────
  ensureDemo() {
    const users = this.getUsers();
    if (!users['demo@finquest.de']) {
      users['demo@finquest.de'] = {
        name: 'Max Mustermann',
        email: 'demo@finquest.de',
        password: this._encodePw('demo123'),
        createdAt: Date.now(),
        premium: false,
        progress: { 'kurs-geld101': [0, 1, 2] },
        totalXP: 150,
        streak: 3,
        lastActive: Date.now()
      };
      this.saveUsers(users);
    }
  },

  // ── Auth-Modal HTML einfügen ───────────────────────────────
  injectAuthModal() {
    const html = `
<div id="authOverlay" class="auth-overlay" onclick="FQ.closeAuthIfOutside(event)">
  <div class="auth-modal">
    <button class="auth-close" onclick="FQ.closeAuth()">✕</button>

    <!-- TABS -->
    <div class="auth-tabs">
      <button class="auth-tab active" id="tab-login" onclick="FQ.switchTab('login')">Einloggen</button>
      <button class="auth-tab" id="tab-register" onclick="FQ.switchTab('register')">Registrieren</button>
    </div>

    <!-- LOGIN -->
    <div id="form-login" class="auth-form">
      <div class="auth-logo">🚀 <span style="color:#F0F4FF">Fin</span><span style="color:#00D48A">Quest</span></div>
      <p class="auth-subtitle">Willkommen zurück! Dein Fortschritt wartet.</p>
      <div class="auth-field">
        <label>E-Mail</label>
        <input type="email" id="login-email" placeholder="du@beispiel.de" autocomplete="email">
      </div>
      <div class="auth-field">
        <label>Passwort</label>
        <input type="password" id="login-password" placeholder="Dein Passwort" autocomplete="current-password">
      </div>
      <div class="auth-error" id="login-error"></div>
      <button class="auth-btn" onclick="FQ.doLogin()">Einloggen →</button>
      <div class="auth-demo">
        <span>Demo ausprobieren?</span>
        <button onclick="FQ.loginDemo()">Demo-Account nutzen</button>
      </div>
    </div>

    <!-- REGISTER -->
    <div id="form-register" class="auth-form" style="display:none">
      <div class="auth-logo">🚀 <span style="color:#F0F4FF">Fin</span><span style="color:#00D48A">Quest</span></div>
      <p class="auth-subtitle">Starte deine Finanzreise – kostenlos!</p>
      <div class="auth-field">
        <label>Dein Name</label>
        <input type="text" id="reg-name" placeholder="Max Mustermann" autocomplete="name">
      </div>
      <div class="auth-field">
        <label>E-Mail</label>
        <input type="email" id="reg-email" placeholder="du@beispiel.de" autocomplete="email">
      </div>
      <div class="auth-field">
        <label>Passwort <span style="opacity:0.5;font-size:11px">(min. 6 Zeichen)</span></label>
        <input type="password" id="reg-password" placeholder="Sicheres Passwort wählen" autocomplete="new-password">
      </div>
      <div class="auth-error" id="reg-error"></div>
      <div class="auth-terms">Mit der Registrierung stimmst du unseren <a href="datenschutz.html">Datenschutzbestimmungen</a> zu.</div>
      <button class="auth-btn" onclick="FQ.doRegister()">Konto erstellen →</button>
    </div>
  </div>
</div>`;
    document.body.insertAdjacentHTML('beforeend', html);

    // Enter-Taste unterstützen
    document.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const overlay = document.getElementById('authOverlay');
        if (overlay && overlay.classList.contains('open')) {
          const activeForm = document.getElementById('form-login').style.display !== 'none' ? 'login' : 'register';
          if (activeForm === 'login') FQ.doLogin();
          else FQ.doRegister();
        }
      }
      if (e.key === 'Escape') FQ.closeAuth();
    });
  },

  openAuth(tab = 'login') {
    const overlay = document.getElementById('authOverlay');
    if (!overlay) return;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    this.switchTab(tab);
  },

  closeAuth() {
    const overlay = document.getElementById('authOverlay');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  },

  closeAuthIfOutside(e) {
    if (e.target.id === 'authOverlay') this.closeAuth();
  },

  switchTab(tab) {
    document.getElementById('form-login').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('form-register').style.display = tab === 'register' ? 'block' : 'none';
    document.getElementById('tab-login').classList.toggle('active', tab === 'login');
    document.getElementById('tab-register').classList.toggle('active', tab === 'register');
    document.getElementById('login-error').textContent = '';
    document.getElementById('reg-error').textContent = '';
  },

  async doLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const err = document.getElementById('login-error');
    if (!email || !password) { err.textContent = 'Bitte alle Felder ausfüllen.'; return; }

    const btn = document.querySelector('#form-login .auth-btn');
    const oldText = btn.textContent;
    btn.textContent = 'Lade...';
    btn.disabled = true;

    const res = await this.login(email, password);

    btn.textContent = oldText;
    btn.disabled = false;

    if (res.ok) {
      this.closeAuth();
      this.updateNavbar();
      this.showToast('✅ Willkommen zurück, ' + this.getCurrentUser().name.split(' ')[0] + '!');
      if (window._authCallback) window._authCallback();
    } else {
      err.textContent = res.msg;
    }
  },

  async doRegister() {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const err = document.getElementById('reg-error');
    if (!name || !email || !password) { err.textContent = 'Bitte alle Felder ausfüllen.'; return; }
    if (!email.includes('@')) { err.textContent = 'Bitte eine gültige E-Mail eingeben.'; return; }

    const btn = document.querySelector('#form-register .auth-btn');
    const oldText = btn.textContent;
    btn.textContent = 'Konto wird erstellt...';
    btn.disabled = true;

    const res = await this.register(name, email, password);

    btn.textContent = oldText;
    btn.disabled = false;

    if (res.ok) {
      this.closeAuth();
      this.updateNavbar();
      this.showToast('🎉 Konto erstellt! Viel Spaß, ' + name.split(' ')[0] + '!');
      if (window._authCallback) window._authCallback();
    } else {
      err.textContent = res.msg;
    }
  },

  loginDemo() {
    this.ensureDemo();
    const res = this.login('demo@finquest.de', 'demo123');
    if (res.ok) {
      this.closeAuth();
      this.updateNavbar();
      this.showToast('👋 Demo-Account aktiv!');
      if (window._authCallback) window._authCallback();
    }
  },

  // ── Navbar dynamisch aktualisieren ─────────────────────────
  updateNavbar() {
    const user = this.getCurrentUser();
    const actionsEl = document.getElementById('nav-actions');
    const mobileActionsEl = document.getElementById('mobile-auth-actions');
    if (!actionsEl) return;

    if (user) {
      const xp = user.totalXP || 0;
      actionsEl.innerHTML = `
        <span class="nav-xp">⚡ ${xp} XP</span>
        <a href="dashboard.html" class="btn btn-ghost nav-btn-sm">👤 ${user.name.split(' ')[0]}</a>
        <button onclick="FQ.logout()" class="btn btn-outline nav-btn-sm">Ausloggen</button>`;
      if (mobileActionsEl) mobileActionsEl.innerHTML = `
        <a href="dashboard.html" onclick="closeMenu && closeMenu()" style="color:var(--color-primary)">👤 Mein Profil</a>
        <a href="#" onclick="FQ.logout()" style="color:var(--color-highlight)">Ausloggen</a>`;
    } else {
      actionsEl.innerHTML = `
        <button onclick="FQ.openAuth('login')" class="btn btn-outline nav-btn-sm">Einloggen</button>
        <button onclick="FQ.openAuth('register')" class="btn btn-primary nav-btn-sm">Kostenlos starten</button>`;
      if (mobileActionsEl) mobileActionsEl.innerHTML = `
        <a href="#" onclick="FQ.openAuth('login');closeMenu&&closeMenu()" style="">Einloggen</a>
        <a href="#" onclick="FQ.openAuth('register');closeMenu&&closeMenu()" style="color:var(--color-primary)">Kostenlos starten →</a>`;
    }
  },

  // ── Toast ──────────────────────────────────────────────────
  showToast(msg, color = '#00D48A') {
    let t = document.getElementById('fq-global-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'fq-global-toast';
      t.style.cssText = 'position:fixed;top:80px;right:24px;z-index:9999;background:#16213E;border:1px solid rgba(0,212,138,0.3);border-radius:14px;padding:14px 20px;display:flex;align-items:center;gap:10px;box-shadow:0 8px 32px rgba(0,0,0,0.4);transform:translateX(160%);transition:transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94);font-family:DM Sans,sans-serif;font-size:15px;color:#F0F4FF;max-width:280px;';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.borderColor = color === '#00D48A' ? 'rgba(0,212,138,0.3)' : 'rgba(255,107,107,0.3)';
    t.style.transform = 'translateX(0)';
    clearTimeout(t._timeout);
    t._timeout = setTimeout(() => { t.style.transform = 'translateX(160%)'; }, 3000);
  },

  // ── Init (auf jeder Seite aufrufen) ────────────────────────
  init(options = {}) {
    this.ensureDemo();
    this.injectAuthModal();
    this.injectAuthStyles();
    this.updateNavbar();

    // Guard: Wenn requireAuth=true und nicht eingeloggt, redirect
    if (options.requireAuth && !this.isLoggedIn()) {
      window._authCallback = () => { window.location.reload(); };
      setTimeout(() => this.openAuth('login'), 500);
    }
  },

  // ── CSS für Auth-Modal ─────────────────────────────────────
  injectAuthStyles() {
    if (document.getElementById('fq-auth-styles')) return;
    const style = document.createElement('style');
    style.id = 'fq-auth-styles';
    style.textContent = `
      .auth-overlay {
        position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:10000;
        display:none;align-items:center;justify-content:center;padding:20px;
        backdrop-filter:blur(4px);
      }
      .auth-overlay.open { display:flex; animation:authFadeIn 0.2s ease; }
      @keyframes authFadeIn { from{opacity:0} to{opacity:1} }
      .auth-modal {
        background:#16213E;border:1px solid rgba(0,212,138,0.25);border-radius:24px;
        width:100%;max-width:420px;padding:36px;position:relative;
        animation:authSlideUp 0.3s cubic-bezier(0.25,0.46,0.45,0.94);
        max-height:90vh;overflow-y:auto;
      }
      @keyframes authSlideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
      .auth-close {
        position:absolute;top:16px;right:16px;background:rgba(255,255,255,0.06);
        border:1px solid rgba(255,255,255,0.1);color:#F0F4FF;border-radius:50%;
        width:32px;height:32px;cursor:pointer;font-size:14px;display:flex;
        align-items:center;justify-content:center;transition:background 0.2s;
      }
      .auth-close:hover { background:rgba(255,255,255,0.12); }
      .auth-tabs { display:flex;gap:4px;background:#0F3460;border-radius:12px;padding:4px;margin-bottom:28px; }
      .auth-tab {
        flex:1;padding:10px;border:none;border-radius:9px;font-family:'DM Sans',sans-serif;
        font-size:14px;font-weight:600;cursor:pointer;transition:all 0.2s;
        background:transparent;color:#8892B0;
      }
      .auth-tab.active { background:#16213E;color:#F0F4FF;box-shadow:0 2px 8px rgba(0,0,0,0.3); }
      .auth-logo { font-size:22px;font-weight:700;font-family:'Clash Display','DM Sans',sans-serif;margin-bottom:6px;text-align:center; }
      .auth-subtitle { font-size:14px;color:#8892B0;text-align:center;margin-bottom:24px; }
      .auth-field { margin-bottom:16px; }
      .auth-field label { display:block;font-size:12px;font-weight:600;color:#8892B0;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.06em; }
      .auth-field input {
        width:100%;background:#0F3460;border:1.5px solid rgba(255,255,255,0.1);
        border-radius:12px;padding:13px 16px;font-family:'DM Sans',sans-serif;font-size:15px;
        color:#F0F4FF;outline:none;transition:border-color 0.2s;
      }
      .auth-field input:focus { border-color:rgba(0,212,138,0.5); }
      .auth-field input::placeholder { color:#8892B0; }
      .auth-error { color:#FF6B6B;font-size:13px;min-height:18px;margin-bottom:8px;text-align:center; }
      .auth-btn {
        width:100%;padding:15px;background:#00D48A;color:#0a0a14;border:none;
        border-radius:12px;font-family:'DM Sans',sans-serif;font-size:16px;font-weight:700;
        cursor:pointer;transition:transform 0.2s,box-shadow 0.2s;margin-bottom:16px;
      }
      .auth-btn:hover { transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,212,138,0.35); }
      .auth-terms { font-size:12px;color:#8892B0;text-align:center;margin-bottom:16px;line-height:1.5; }
      .auth-terms a { color:#00D48A;text-decoration:none; }
      .auth-demo { display:flex;align-items:center;justify-content:center;gap:8px;font-size:13px;color:#8892B0; }
      .auth-demo button { background:none;border:none;color:#00D48A;font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif;text-decoration:underline; }
      .nav-xp { font-family:'JetBrains Mono',monospace;font-size:13px;color:#FFD166;font-weight:600;padding:8px 12px;background:rgba(255,209,102,0.08);border-radius:50px;border:1px solid rgba(255,209,102,0.2); }
      .nav-btn-sm { padding:9px 18px !important;font-size:13px !important; }
    `;
    document.head.appendChild(style);
  }
};

// ── Globale Hilfsfunktionen ────────────────────────────────
// Für Seiten die direkt window.syncUserToFirestore aufrufen
window.syncUserToFirestore = function() {
  const email = localStorage.getItem('fq_current_user');
  if (!email) return;
  try {
    const users = JSON.parse(localStorage.getItem('fq_users') || '{}');
    const user = users[email];
    if (user) FQ.syncToFirestore(user);
  } catch(e) {}
};
