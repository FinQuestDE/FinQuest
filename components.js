// ═══════════════════════════════════════════════════════════
// FinQuest – Global Components (Navbar & Footer)
// ═══════════════════════════════════════════════════════════

function injectGlobalComponentStyles() {
  if (document.getElementById('fq-component-styles')) return;
  const style = document.createElement('style');
  style.id = 'fq-component-styles';
  style.textContent = `
    /* ── CSS Vars (works on ALL pages regardless of var naming) ── */
    :root {
      --color-primary:    #00D48A;
      --color-secondary:  #1A1A2E;
      --color-accent:     #FFD166;
      --color-highlight:  #FF6B6B;
      --color-surface:    #16213E;
      --color-surface-2:  #0F3460;
      --color-text-main:  #F0F4FF;
      --color-text-muted: #8892B0;
      --color-border:     rgba(0,212,138,0.2);
      --color-footer:     #0D0D1A;
      /* Short aliases for pages that use --p / --s / --su etc. */
      --p:   #00D48A;
      --s:   #1A1A2E;
      --acc: #FFD166;
      --hl:  #FF6B6B;
      --su:  #16213E;
      --su2: #0F3460;
      --tx:  #F0F4FF;
      --mu:  #8892B0;
      --bo:  rgba(0,212,138,0.2);
    }

    /* ── NAVBAR ── */
    .fq-navbar {
      position: sticky; top: 0; z-index: 999;
      background: rgba(26,26,46,0.92); backdrop-filter: blur(14px);
      border-bottom: 1px solid rgba(0,212,138,0.2);
    }
    .fq-navbar-inner {
      max-width: 1180px; margin: 0 auto; padding: 0 24px;
      display: flex; align-items: center; justify-content: space-between; height: 64px;
    }
    .fq-logo {
      font-size: 22px; font-weight: 700; text-decoration: none;
      display: flex; align-items: center; gap: 6px;
      font-family: 'Clash Display','DM Sans',sans-serif;
    }
    .fq-logo-fin  { color: #F0F4FF; }
    .fq-logo-quest{ color: #00D48A; }
    .fq-nav-links { display: flex; align-items: center; gap: 28px; list-style: none; margin: 0; padding: 0; }
    .fq-nav-links a { color: #8892B0; text-decoration: none; font-size: 14px; font-weight: 500; transition: color .2s; }
    .fq-nav-links a:hover { color: #F0F4FF; }
    .fq-nav-actions { display: flex; gap: 10px; align-items: center; }

    /* Buttons */
    .fq-btn { display: inline-flex; align-items: center; gap: 8px; padding: 9px 18px; border-radius: 50px; font-family: 'DM Sans',sans-serif; font-weight: 600; font-size: 13px; cursor: pointer; border: none; transition: transform .2s, box-shadow .2s; text-decoration: none; line-height: 1; }
    .fq-btn:hover { transform: translateY(-2px); }
    .fq-btn-primary { background: #00D48A; color: #0a0a14; }
    .fq-btn-primary:hover { box-shadow: 0 8px 24px rgba(0,212,138,.4); }
    .fq-btn-outline { background: transparent; color: #F0F4FF; border: 1.5px solid rgba(240,244,255,.3); }
    .fq-btn-outline:hover { background: rgba(255,255,255,.05); }
    .fq-btn-ghost  { background: rgba(255,255,255,.06); color: #F0F4FF; border: 1.5px solid rgba(240,244,255,.15); }
    .fq-btn-ghost:hover  { border-color: rgba(240,244,255,.4); }

    /* Nav user pill */
    .fq-nav-user { display:flex; align-items:center; gap:10px; background:#16213E; border:1px solid rgba(0,212,138,.2); border-radius:50px; padding:5px 14px 5px 6px; font-size:13px; text-decoration:none; transition:border-color .2s; color:#F0F4FF; }
    .fq-nav-user:hover { border-color:#00D48A; }
    .fq-nav-avatar { width:28px; height:28px; border-radius:50%; background:linear-gradient(135deg,#00D48A,#00a06a); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; color:#0a0a14; }
    .fq-nav-xp { font-family:'JetBrains Mono',monospace; color:#FFD166; font-weight:600; }

    /* Hamburger */
    .fq-hamburger { display: none; flex-direction: column; gap: 5px; cursor: pointer; background: none; border: none; padding: 4px; }
    .fq-hamburger span { display: block; width: 22px; height: 2px; background: #F0F4FF; border-radius: 2px; }

    /* Mobile menu */
    .fq-mobile-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.65); z-index: 1000; }
    .fq-mobile-menu {
      position: fixed; top: 0; right: -100%; width: 280px; height: 100vh;
      background: #16213E; z-index: 1001; padding: 72px 28px 40px;
      display: flex; flex-direction: column; gap: 4px;
      border-left: 1px solid rgba(0,212,138,.2);
      transition: right .35s cubic-bezier(.25,.46,.45,.94);
    }
    .fq-mobile-menu.open { right: 0; }
    .fq-mobile-menu a { color: #F0F4FF; text-decoration: none; font-size: 17px; font-weight: 600; padding: 11px 0; border-bottom: 1px solid rgba(255,255,255,.06); display: block; }
    .fq-mobile-close { position: absolute; top: 18px; right: 18px; background: none; border: none; color: #F0F4FF; font-size: 22px; cursor: pointer; }

    /* ── FOOTER ── */
    .fq-footer { background: #0D0D1A; border-top: 1px solid rgba(255,255,255,.06); padding: 56px 24px 0; margin-top: 40px; }
    .fq-footer-wrap { max-width: 1180px; margin: 0 auto; }
    .fq-footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; padding-bottom: 48px; }
    .fq-footer-brand p { font-size: 14px; color: #8892B0; line-height: 1.65; max-width: 260px; margin-top: 12px; }
    .fq-footer-socials { display: flex; gap: 10px; margin-top: 20px; }
    .fq-footer-soc { width:36px; height:36px; border-radius:8px; background:#16213E; border:1px solid rgba(255,255,255,.08); display:flex; align-items:center; justify-content:center; font-size:15px; text-decoration:none; transition:border-color .2s,transform .2s; }
    .fq-footer-soc:hover { border-color:rgba(0,212,138,.3); transform:translateY(-2px); }
    .fq-footer-col h4 { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; margin-bottom:14px; color:#F0F4FF; }
    .fq-footer-col ul { list-style:none; display:flex; flex-direction:column; gap:9px; padding:0; margin:0; }
    .fq-footer-col ul a { font-size:13px; color:#8892B0; text-decoration:none; transition:color .2s; }
    .fq-footer-col ul a:hover { color:#F0F4FF; }
    .fq-footer-bottom { border-top:1px solid rgba(255,255,255,.06); padding:18px 0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; font-size:12px; color:rgba(255,255,255,.25); }
    .fq-footer-bottom a { color:inherit; text-decoration:none; }

    @media(max-width:1024px) { .fq-footer-grid { grid-template-columns: 1fr 1fr; } }
    @media(max-width:768px) {
      .fq-nav-links, .fq-nav-actions { display: none; }
      .fq-hamburger { display: flex; }
      .fq-footer-grid { grid-template-columns: 1fr; gap: 32px; }
      .fq-footer-bottom { flex-direction: column; align-items: flex-start; }
    }
  `;
  document.head.appendChild(style);
}

function renderNavbar() {
  if (document.getElementById('fq-navbar')) return;
  const navHtml = `
    <nav class="fq-navbar" id="fq-navbar">
      <div class="fq-navbar-inner">
        <a href="finquest.html" class="fq-logo">
          <span>🚀</span><span class="fq-logo-fin">Fin</span><span class="fq-logo-quest">Quest</span>
        </a>
        <ul class="fq-nav-links">
          <li><a href="finquest.html#how">Wie es funktioniert</a></li>
          <li><a href="finquest.html#courses">Kurse</a></li>
          <li><a href="finquest.html#pricing">Preise</a></li>
        </ul>
        <div id="fq-nav-actions" class="fq-nav-actions">
          <a href="login.html"    class="fq-btn fq-btn-outline">Einloggen</a>
          <a href="register.html" class="fq-btn fq-btn-primary">Kostenlos starten</a>
        </div>
        <button class="fq-hamburger" onclick="fqOpenMenu()" aria-label="Menü öffnen">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>
    <div class="fq-mobile-overlay" id="fqMobileOverlay" onclick="fqCloseMenu()"></div>
    <div class="fq-mobile-menu" id="fqMobileMenu">
      <button class="fq-mobile-close" onclick="fqCloseMenu()">✕</button>
      <a href="finquest.html#how"     onclick="fqCloseMenu()">Wie es funktioniert</a>
      <a href="finquest.html#courses" onclick="fqCloseMenu()">Kurse</a>
      <a href="finquest.html#pricing" onclick="fqCloseMenu()">Preise</a>
      <div id="fq-mobile-auth" style="margin-top:20px;display:flex;flex-direction:column;gap:4px;">
        <a href="login.html"    onclick="fqCloseMenu()">Einloggen</a>
        <a href="register.html" onclick="fqCloseMenu()" style="color:#00D48A">Kostenlos starten →</a>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('afterbegin', navHtml);

  window.fqOpenMenu = function () {
    document.getElementById('fqMobileMenu').classList.add('open');
    document.getElementById('fqMobileOverlay').style.display = 'block';
    document.body.style.overflow = 'hidden';
  };
  window.fqCloseMenu = function () {
    document.getElementById('fqMobileMenu').classList.remove('open');
    document.getElementById('fqMobileOverlay').style.display = 'none';
    document.body.style.overflow = '';
  };
  // Legacy aliases so old onclick="openMenu()" / closeMenu() still work
  window.openMenu  = window.fqOpenMenu;
  window.closeMenu = window.fqCloseMenu;
}

function renderFooter() {
  if (document.getElementById('fq-footer')) return;
  const footerHtml = `
    <footer class="fq-footer" id="fq-footer">
      <div class="fq-footer-wrap">
        <div class="fq-footer-grid">
          <div class="fq-footer-brand">
            <a href="finquest.html" class="fq-logo">
              <span>🚀</span><span class="fq-logo-fin">Fin</span><span class="fq-logo-quest">Quest</span>
            </a>
            <p>Deine Reise zur finanziellen Freiheit beginnt hier. Gamifizierte Finanzbildung für junge Menschen.</p>
            <div class="fq-footer-socials">
              <a href="#" class="fq-footer-soc" aria-label="Instagram">📸</a>
              <a href="#" class="fq-footer-soc" aria-label="TikTok">🎵</a>
              <a href="#" class="fq-footer-soc" aria-label="LinkedIn">💼</a>
              <a href="#" class="fq-footer-soc" aria-label="YouTube">▶️</a>
            </div>
          </div>
          <div class="fq-footer-col">
            <h4>Produkt</h4>
            <ul>
              <li><a href="finquest.html#how">Wie es funktioniert</a></li>
              <li><a href="dashboard.html">Kurse</a></li>
              <li><a href="finquest.html#pricing">Preise</a></li>
              <li><a href="premium.html">Premium</a></li>
              <li><a href="challenges.html">Challenges</a></li>
            </ul>
          </div>
          <div class="fq-footer-col">
            <h4>Unternehmen</h4>
            <ul>
              <li><a href="ueber-uns.html">Über uns</a></li>
              <li><a href="blog.html">Blog</a></li>
              <li><a href="schulen.html">Für Schulen</a></li>
              <li><a href="karriere.html">Karriere</a></li>
              <li><a href="presse.html">Presse</a></li>
            </ul>
          </div>
          <div class="fq-footer-col">
            <h4>Support</h4>
            <ul>
              <li><a href="hilfe.html">Hilfe-Center</a></li>
              <li><a href="kontakt.html">Kontakt</a></li>
              <li><a href="community.html">Community</a></li>
              <li><a href="api-status.html">API-Status</a></li>
            </ul>
          </div>
        </div>
        <div class="fq-footer-bottom">
          <span>© 2025 FinQuest GmbH &nbsp;·&nbsp; <a href="datenschutz.html">Datenschutz</a> &nbsp;·&nbsp; <a href="impressum.html">Impressum</a> &nbsp;·&nbsp; <a href="agb.html">AGB</a></span>
          <span>Keine Finanzberatung. Alle Inhalte dienen ausschließlich der Bildung.</span>
        </div>
      </div>
    </footer>
  `;
  document.body.insertAdjacentHTML('beforeend', footerHtml);
}

// ── Update navbar when user is logged in ──────────────────
function fqUpdateNavbar() {
  try {
    const email = localStorage.getItem('fq_current_user');
    if (!email) return;
    const users = JSON.parse(localStorage.getItem('fq_users') || '{}');
    const user = users[email];
    if (!user) return;

    const initials = user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const xp = user.totalXP || 0;

    const actionsEl = document.getElementById('fq-nav-actions');
    if (actionsEl) {
      actionsEl.innerHTML = `
        <a href="dashboard.html" class="fq-nav-user">
          <div class="fq-nav-avatar">${initials}</div>
          <span>${user.name.split(' ')[0]}</span>
          <span class="fq-nav-xp">⚡${xp}</span>
        </a>
        <button class="fq-btn fq-btn-ghost" onclick="localStorage.removeItem('fq_current_user'); window.location.href='finquest.html'" style="font-size:12px;padding:7px 14px">Ausloggen</button>
      `;
    }
    const mobileAuth = document.getElementById('fq-mobile-auth');
    if (mobileAuth) {
      mobileAuth.innerHTML = `
        <a href="dashboard.html" onclick="fqCloseMenu && fqCloseMenu()" style="color:#00D48A">👤 Mein Profil</a>
        <a href="#" onclick="localStorage.removeItem('fq_current_user'); window.location.href='finquest.html'" style="color:#FF6B6B">🚪 Ausloggen</a>
      `;
    }
  } catch(e) {}
}

// ── Auto-Render on DOMContentLoaded ──────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('meta[name="no-components"]')) return;

  injectGlobalComponentStyles();

  // Navbar: render unless page already has one with id="fq-navbar"
  if (!document.getElementById('fq-navbar')) renderNavbar();

  // Footer: render unless page opts out or already has one
  const noFooterPages = ['dashboard.html', 'login.html', 'register.html'];
  const currentPage = location.pathname.split('/').pop();
  if (!document.getElementById('fq-footer') && !noFooterPages.includes(currentPage)) {
    renderFooter();
  }

  // Update navbar auth state
  fqUpdateNavbar();
});
