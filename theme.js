/* ═══════════════════════════════════════════════════════════════
   theme.js  –  FinQuest Design-Switcher  v5.0
   Einbinden: <script src="theme.js"></script> vor </body>
═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const KEY   = 'fq_theme';
  const THEME = localStorage.getItem(KEY) || 'game';

  document.documentElement.setAttribute('data-theme', THEME);

  /*
    WARM MODERN – für 20-30-Jährige
    ─────────────────────────────────────────────────
    Inspiriert von: Arc Browser, Linear, Raycast, Notion

    Palette:
    BG:         #F7F5F2   warm off-white (wie Papier)
    Surface:    #FFFFFF   weiß aber mit warmen Schatten
    Surface2:   #F0EDE8   warm-grau für States
    Akzent:     #7C3AED   leuchtendes Violet
    Akzent2:    #EC4899   Pink-Highlight (für spezielle Momente)
    Gradient:   #7C3AED → #EC4899  (violet → pink)
    Text:       #1A1523   fast-schwarz mit violet-Unterton
    Muted:      #6B6578   warm-purple-grau
    Border:     rgba(124,58,237,0.1)

    Key Design-Entscheidungen:
    ✓ Warme Schatten statt kalte Borders
    ✓ Gradient nur auf den wichtigsten Elementen (Buttons, Active States, Avatar)
    ✓ Streak-Zahl als riesiger Gradient-Wert
    ✓ Premium Banner: Tiefdunkles Violet-Schwarz
    ✓ Karten "schweben" durch echte box-shadows
    ✓ Hover: glow-Effekt in Violet
    ✓ Toast: schwarz-violet-gradient
    ─────────────────────────────────────────────────
  */

  const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

html[data-theme="clean"] * {
  font-family: 'Inter', -apple-system, sans-serif !important;
  text-shadow: none !important;
}
html[data-theme="clean"] h1,
html[data-theme="clean"] h2,
html[data-theme="clean"] h3,
html[data-theme="clean"] h4,
html[data-theme="clean"] .logo,
html[data-theme="clean"] .profile-info h1,
html[data-theme="clean"] .section-title,
html[data-theme="clean"] .widget-title,
html[data-theme="clean"] .modal-title,
html[data-theme="clean"] .fr-modal-title {
  letter-spacing: -0.03em !important;
}

/* Animationen weg */
html[data-theme="clean"] .animate-pop,
html[data-theme="clean"] .lb-row.bumped { animation: none !important; }
html[data-theme="clean"] .lb-dot { animation: none !important; background: #7C3AED !important; }
html[data-theme="clean"] .btn:hover,
html[data-theme="clean"] .dc-card:hover,
html[data-theme="clean"] .shop-item:hover,
html[data-theme="clean"] .ach-card:hover:not(.locked),
html[data-theme="clean"] .fr-lb-row:hover { transform: none !important; }

/* ════════ BODY ════════ */
html[data-theme="clean"],
html[data-theme="clean"] body {
  background: #F7F5F2 !important;
  color: #1A1523 !important;
}

/* ════════ NAVBAR ════════ */
html[data-theme="clean"] .navbar,
html[data-theme="clean"] .fq-navbar {
  background: rgba(255,255,255,0.88) !important;
  backdrop-filter: blur(24px) !important;
  -webkit-backdrop-filter: blur(24px) !important;
  border-bottom: 1px solid rgba(124,58,237,0.08) !important;
  box-shadow: 0 1px 0 rgba(0,0,0,0.06), 0 4px 20px rgba(124,58,237,0.04) !important;
}
html[data-theme="clean"] .logo-fin {
  color: #1A1523 !important;
  font-weight: 700 !important;
}
html[data-theme="clean"] .logo-quest {
  color: #7C3AED !important;
  font-weight: 700 !important;
}

/* ════════ BUTTONS ════════ */
html[data-theme="clean"] .btn-primary,
html[data-theme="clean"] .fq-btn-primary {
  background: linear-gradient(135deg, #7C3AED 0%, #EC4899 100%) !important;
  color: #ffffff !important;
  border: none !important;
  border-radius: 10px !important;
  font-weight: 600 !important;
  box-shadow: 0 4px 16px rgba(124,58,237,0.4), 0 1px 3px rgba(0,0,0,0.1) !important;
}
html[data-theme="clean"] .btn-primary:hover {
  background: linear-gradient(135deg, #6D28D9 0%, #DB2777 100%) !important;
  box-shadow: 0 6px 22px rgba(124,58,237,0.5) !important;
}
html[data-theme="clean"] .btn-ghost,
html[data-theme="clean"] .btn-outline,
html[data-theme="clean"] .fq-btn-ghost,
html[data-theme="clean"] .fq-btn-outline {
  background: #ffffff !important;
  border: 1px solid rgba(26,21,35,0.12) !important;
  color: #3D3452 !important;
  border-radius: 10px !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.07) !important;
}
html[data-theme="clean"] .btn-ghost:hover,
html[data-theme="clean"] .btn-outline:hover {
  border-color: rgba(124,58,237,0.3) !important;
  color: #7C3AED !important;
  box-shadow: 0 2px 8px rgba(124,58,237,0.12) !important;
}
html[data-theme="clean"] .btn-shop {
  background: rgba(124,58,237,0.07) !important;
  border: 1px solid rgba(124,58,237,0.2) !important;
  color: #7C3AED !important;
  border-radius: 10px !important;
}
html[data-theme="clean"] .btn-shop:hover {
  background: rgba(124,58,237,0.12) !important;
  transform: none !important;
  box-shadow: none !important;
}

/* ════════ PROFIL HEADER ════════ */
html[data-theme="clean"] .profile-header {
  background: linear-gradient(145deg, #ffffff 0%, #FAF7FF 100%) !important;
  border: 1px solid rgba(124,58,237,0.1) !important;
  border-radius: 22px !important;
  box-shadow: 0 8px 40px rgba(124,58,237,0.08), 0 1px 3px rgba(0,0,0,0.05) !important;
}
html[data-theme="clean"] .profile-header::before { display: none !important; }
html[data-theme="clean"] .avatar-big {
  background: linear-gradient(135deg, #7C3AED 0%, #EC4899 100%) !important;
  border: 3px solid rgba(124,58,237,0.25) !important;
  box-shadow: 0 8px 28px rgba(124,58,237,0.35) !important;
}
html[data-theme="clean"] .avatar-wrap:hover .avatar-big { transform: none !important; }
html[data-theme="clean"] .avatar-edit-hint { background: #7C3AED !important; border-color: #fff !important; }
html[data-theme="clean"] .profile-info h1 { color: #1A1523 !important; font-weight: 700 !important; }
html[data-theme="clean"] .profile-email { color: #6B6578 !important; }
html[data-theme="clean"] .pbadge {
  background: rgba(124,58,237,0.07) !important;
  border: 1px solid rgba(124,58,237,0.14) !important;
  color: #6D28D9 !important;
  border-radius: 8px !important;
}
html[data-theme="clean"] .pbadge.gold {
  background: #FFF7ED !important;
  border-color: rgba(234,88,12,0.2) !important;
  color: #9A3412 !important;
}
html[data-theme="clean"] .pbadge.green {
  background: rgba(124,58,237,0.07) !important;
  border-color: rgba(124,58,237,0.18) !important;
  color: #7C3AED !important;
}
html[data-theme="clean"] .pstat {
  background: rgba(255,255,255,0.85) !important;
  border: 1px solid rgba(124,58,237,0.08) !important;
  border-radius: 14px !important;
  box-shadow: 0 2px 10px rgba(124,58,237,0.06) !important;
}
html[data-theme="clean"] .pstat-val { color: #1A1523 !important; font-weight: 700 !important; }
html[data-theme="clean"] .pstat.xp-stat .pstat-val { color: #7C3AED !important; }
html[data-theme="clean"] .pstat-key { color: #6B6578 !important; font-size: 10px !important; }

/* ════════ XP BAR ════════ */
html[data-theme="clean"] .xp-bar-wrap {
  background: #ffffff !important;
  border: 1px solid rgba(124,58,237,0.08) !important;
  border-radius: 18px !important;
  box-shadow: 0 4px 20px rgba(124,58,237,0.05) !important;
}
html[data-theme="clean"] .xp-track {
  background: #F0EDE8 !important;
  height: 8px !important;
  border-radius: 4px !important;
}
html[data-theme="clean"] .xp-fill {
  background: linear-gradient(90deg, #7C3AED, #EC4899) !important;
  border-radius: 4px !important;
  box-shadow: 0 0 10px rgba(124,58,237,0.4) !important;
}
html[data-theme="clean"] .xp-val      { color: #7C3AED !important; font-weight: 700 !important; }
html[data-theme="clean"] .xp-label-txt { color: #6B6578 !important; }
html[data-theme="clean"] .xp-coins    { color: #3D3452 !important; }
html[data-theme="clean"] .level-label { color: #6B6578 !important; }

/* ════════ TABS ════════ */
html[data-theme="clean"] .tab-nav {
  background: rgba(255,255,255,0.7) !important;
  border: 1px solid rgba(124,58,237,0.08) !important;
  border-radius: 16px !important;
  box-shadow: 0 2px 10px rgba(124,58,237,0.05) !important;
  backdrop-filter: blur(12px) !important;
}
html[data-theme="clean"] .tab-btn {
  color: #9E98AA !important;
  border-radius: 12px !important;
  font-weight: 500 !important;
}
html[data-theme="clean"] .tab-btn.active {
  background: linear-gradient(135deg, #7C3AED, #EC4899) !important;
  color: #ffffff !important;
  box-shadow: 0 4px 14px rgba(124,58,237,0.4) !important;
}
html[data-theme="clean"] .tab-btn:hover:not(.active) {
  background: rgba(124,58,237,0.07) !important;
  color: #7C3AED !important;
}

/* ════════ TITLES ════════ */
html[data-theme="clean"] .section-title {
  color: #1A1523 !important;
  font-size: 16px !important;
  font-weight: 700 !important;
}
html[data-theme="clean"] .widget-title {
  color: #1A1523 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
}

/* ════════ KURS-CARDS ════════ */
html[data-theme="clean"] .dc-card {
  background: #ffffff !important;
  border: 1px solid rgba(26,21,35,0.07) !important;
  border-radius: 16px !important;
  box-shadow: 0 2px 12px rgba(26,21,35,0.06) !important;
}
html[data-theme="clean"] .dc-card:hover {
  border-color: rgba(124,58,237,0.2) !important;
  box-shadow: 0 8px 28px rgba(124,58,237,0.1) !important;
}
html[data-theme="clean"] .dc-card.started {
  border-left: 3px solid #7C3AED !important;
  border-color: rgba(124,58,237,0.15) !important;
}
html[data-theme="clean"] .dc-title { color: #1A1523 !important; font-weight: 600 !important; }
html[data-theme="clean"] .dc-sub   { color: #6B6578 !important; }
html[data-theme="clean"] .dc-bar   { background: #F0EDE8 !important; }
html[data-theme="clean"] .dc-bar-fill { background: linear-gradient(90deg, #7C3AED, #EC4899) !important; }
html[data-theme="clean"] .dc-pct   { color: #7C3AED !important; font-weight: 700 !important; }

/* ════════ WIDGETS ════════ */
html[data-theme="clean"] .widget {
  background: #ffffff !important;
  border: 1px solid rgba(26,21,35,0.07) !important;
  border-radius: 18px !important;
  box-shadow: 0 4px 16px rgba(26,21,35,0.06) !important;
}

/* ════════ STREAK ════════ */
html[data-theme="clean"] .streak-num {
  font-size: 56px !important;
  font-weight: 800 !important;
  letter-spacing: -0.04em !important;
  background: linear-gradient(135deg, #7C3AED, #EC4899) !important;
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  background-clip: text !important;
}
html[data-theme="clean"] .streak-label { color: #9E98AA !important; }
html[data-theme="clean"] .sday {
  background: #F0EDE8 !important;
  border: 1.5px solid rgba(26,21,35,0.08) !important;
  color: #9E98AA !important;
}
html[data-theme="clean"] .sday.done {
  background: linear-gradient(135deg, #7C3AED, #EC4899) !important;
  border-color: transparent !important;
  color: #ffffff !important;
  box-shadow: 0 2px 8px rgba(124,58,237,0.3) !important;
}

/* ════════ DAILY CHALLENGE ════════ */
html[data-theme="clean"] .challenge-card {
  background: linear-gradient(135deg, rgba(124,58,237,0.06), rgba(236,72,153,0.03)) !important;
  border: 1px solid rgba(124,58,237,0.14) !important;
  border-radius: 14px !important;
}
html[data-theme="clean"] .challenge-card:hover {
  background: linear-gradient(135deg, rgba(124,58,237,0.09), rgba(236,72,153,0.05)) !important;
}
html[data-theme="clean"] .challenge-card.done-ch {
  background: rgba(124,58,237,0.07) !important;
  border-color: rgba(124,58,237,0.2) !important;
}
html[data-theme="clean"] .ch-title  { color: #1A1523 !important; font-weight: 600 !important; }
html[data-theme="clean"] .ch-desc   { color: #6B6578 !important; }
html[data-theme="clean"] .ch-reward { color: #3D3452 !important; }
html[data-theme="clean"] .ch-start-btn {
  background: linear-gradient(135deg, #7C3AED, #EC4899) !important;
  color: #ffffff !important;
  border-radius: 8px !important;
  box-shadow: 0 3px 12px rgba(124,58,237,0.35) !important;
}
html[data-theme="clean"] .ch-done-label { color: #7C3AED !important; }

/* ════════ ACHIEVEMENTS ════════ */
html[data-theme="clean"] .ach-item {
  background: #F0EDE8 !important;
  border: 1px solid transparent !important;
  border-radius: 12px !important;
}
html[data-theme="clean"] .ach-name { color: #6B6578 !important; }
html[data-theme="clean"] .ach-card {
  background: #ffffff !important;
  border: 1px solid rgba(26,21,35,0.07) !important;
  border-radius: 14px !important;
}
html[data-theme="clean"] .ach-card.unlocked {
  background: linear-gradient(135deg, rgba(124,58,237,0.07), rgba(236,72,153,0.04)) !important;
  border-color: rgba(124,58,237,0.18) !important;
}
html[data-theme="clean"] .ach-name-big { color: #1A1523 !important; font-weight: 600 !important; }
html[data-theme="clean"] .ach-xp       { color: #7C3AED !important; font-weight: 700 !important; }

/* ════════ LEADERBOARD ════════ */
html[data-theme="clean"] .lb-row { border-bottom: 1px solid #F0EDE8 !important; }
html[data-theme="clean"] .lb-row:last-child { border-bottom: none !important; }
html[data-theme="clean"] .lb-row.lb-me {
  background: linear-gradient(135deg, rgba(124,58,237,0.07), rgba(236,72,153,0.04)) !important;
  border-radius: 10px !important;
}
html[data-theme="clean"] .lb-av {
  background: linear-gradient(135deg, #7C3AED, #EC4899) !important;
  box-shadow: 0 3px 10px rgba(124,58,237,0.3) !important;
}
html[data-theme="clean"] .lb-rank  { color: #9E98AA !important; }
html[data-theme="clean"] .lb-name  { color: #1A1523 !important; font-weight: 600 !important; }
html[data-theme="clean"] .lb-lvl   { color: #9E98AA !important; }
html[data-theme="clean"] .lb-xp    { color: #7C3AED !important; font-weight: 700 !important; }
html[data-theme="clean"] .lb-empty { color: #9E98AA !important; }

/* ════════ SHOP ════════ */
html[data-theme="clean"] .shop-header {
  background: linear-gradient(145deg, #ffffff, #FAF7FF) !important;
  border: 1px solid rgba(124,58,237,0.1) !important;
  border-radius: 18px !important;
  box-shadow: 0 6px 28px rgba(124,58,237,0.07) !important;
}
html[data-theme="clean"] .shop-bal-val  { color: #7C3AED !important; font-weight: 800 !important; }
html[data-theme="clean"] .shop-bal-unit { color: #7C3AED !important; }
html[data-theme="clean"] .shop-bal-label,
html[data-theme="clean"] .shop-desc { color: #6B6578 !important; }
html[data-theme="clean"] .shop-cat {
  background: #ffffff !important;
  border: 1px solid rgba(26,21,35,0.1) !important;
  color: #6B6578 !important;
  border-radius: 10px !important;
}
html[data-theme="clean"] .shop-cat:hover:not(.active) {
  background: rgba(124,58,237,0.06) !important;
  color: #7C3AED !important;
  border-color: rgba(124,58,237,0.2) !important;
}
html[data-theme="clean"] .shop-cat.active {
  background: linear-gradient(135deg, #7C3AED, #EC4899) !important;
  border-color: transparent !important;
  color: #ffffff !important;
  box-shadow: 0 4px 14px rgba(124,58,237,0.35) !important;
}
html[data-theme="clean"] .shop-item {
  background: #ffffff !important;
  border: 1px solid rgba(26,21,35,0.07) !important;
  border-radius: 18px !important;
  box-shadow: 0 2px 10px rgba(26,21,35,0.06) !important;
}
html[data-theme="clean"] .shop-item:hover {
  border-color: rgba(124,58,237,0.22) !important;
  box-shadow: 0 8px 28px rgba(124,58,237,0.1) !important;
}
html[data-theme="clean"] .shop-item.owned {
  background: rgba(124,58,237,0.05) !important;
  border-color: rgba(124,58,237,0.18) !important;
}
html[data-theme="clean"] .shop-item.equipped {
  background: linear-gradient(135deg, rgba(124,58,237,0.08), rgba(236,72,153,0.05)) !important;
  border-color: rgba(124,58,237,0.25) !important;
}
html[data-theme="clean"] .shop-owned-badge    { background: #7C3AED !important; color: #fff !important; }
html[data-theme="clean"] .shop-equipped-badge {
  background: linear-gradient(135deg, #7C3AED, #EC4899) !important;
  color: #fff !important;
}
html[data-theme="clean"] .shop-item-name { color: #1A1523 !important; font-weight: 600 !important; }
html[data-theme="clean"] .shop-item-desc { color: #6B6578 !important; }
html[data-theme="clean"] .shop-item-cost { color: #7C3AED !important; font-weight: 700 !important; }
html[data-theme="clean"] .shop-buy-btn.buy {
  background: linear-gradient(135deg, #7C3AED, #EC4899) !important;
  color: #fff !important;
  border-radius: 10px !important;
  box-shadow: 0 3px 14px rgba(124,58,237,0.35) !important;
}
html[data-theme="clean"] .shop-buy-btn.equip {
  background: rgba(124,58,237,0.08) !important;
  color: #7C3AED !important;
  border: 1px solid rgba(124,58,237,0.22) !important;
}
html[data-theme="clean"] .shop-buy-btn.equipped-btn {
  background: transparent !important;
  color: #9E98AA !important;
  border: 1px solid rgba(0,0,0,0.08) !important;
}
html[data-theme="clean"] .shop-buy-btn.no-xp { background: #F0EDE8 !important; color: #9E98AA !important; }

/* ════════ FREUNDES-RANGLISTE ════════ */
html[data-theme="clean"] .fr-lb-row {
  background: #ffffff !important;
  border: 1px solid rgba(26,21,35,0.07) !important;
  border-radius: 14px !important;
  box-shadow: 0 2px 10px rgba(26,21,35,0.05) !important;
}
html[data-theme="clean"] .fr-lb-row:hover {
  border-color: rgba(124,58,237,0.2) !important;
  box-shadow: 0 6px 20px rgba(124,58,237,0.08) !important;
}
html[data-theme="clean"] .fr-lb-row.fr-lb-me {
  background: linear-gradient(135deg, rgba(124,58,237,0.07), rgba(236,72,153,0.04)) !important;
  border-color: rgba(124,58,237,0.18) !important;
}
html[data-theme="clean"] .fr-lb-avatar {
  background: linear-gradient(135deg, #7C3AED, #EC4899) !important;
  box-shadow: 0 4px 12px rgba(124,58,237,0.3) !important;
  border-color: rgba(124,58,237,0.2) !important;
}
html[data-theme="clean"] .fr-lb-row:hover .fr-lb-avatar { transform: none !important; }
html[data-theme="clean"] .fr-lb-name  { color: #1A1523 !important; font-weight: 600 !important; }
html[data-theme="clean"] .fr-lb-level { color: #9E98AA !important; }
html[data-theme="clean"] .fr-lb-xp    { color: #7C3AED !important; font-weight: 700 !important; }

/* ════════ FREUNDE MODAL ════════ */
html[data-theme="clean"] .fr-modal {
  background: #ffffff !important;
  border: 1px solid rgba(124,58,237,0.1) !important;
  box-shadow: 0 24px 80px rgba(124,58,237,0.12), 0 8px 24px rgba(0,0,0,0.08) !important;
}
html[data-theme="clean"] .fr-modal-overlay {
  background: rgba(26,21,35,0.5) !important;
  backdrop-filter: blur(8px) !important;
}
html[data-theme="clean"] .fr-modal-head { border-bottom: 1px solid #F0EDE8 !important; }
html[data-theme="clean"] .fr-modal-title { color: #1A1523 !important; font-weight: 700 !important; }
html[data-theme="clean"] .fr-section-label { color: #9E98AA !important; font-size: 11px !important; font-weight: 600 !important; letter-spacing: 0.07em !important; }
html[data-theme="clean"] .fr-input {
  background: #FAF7FF !important;
  border: 1.5px solid rgba(124,58,237,0.15) !important;
  color: #1A1523 !important;
  border-radius: 10px !important;
}
html[data-theme="clean"] .fr-input:focus {
  border-color: #7C3AED !important;
  box-shadow: 0 0 0 3px rgba(124,58,237,0.12) !important;
}
html[data-theme="clean"] .fr-input::placeholder { color: #9E98AA !important; }
html[data-theme="clean"] .fr-add-btn {
  background: linear-gradient(135deg, #7C3AED, #EC4899) !important;
  color: #fff !important;
  border: none !important;
  border-radius: 10px !important;
  box-shadow: 0 3px 12px rgba(124,58,237,0.35) !important;
}
html[data-theme="clean"] .fr-item { border-color: #F0EDE8 !important; }
html[data-theme="clean"] .fr-item-av {
  background: linear-gradient(135deg, #7C3AED, #EC4899) !important;
  border-color: rgba(124,58,237,0.2) !important;
}
html[data-theme="clean"] .fr-item-name { color: #1A1523 !important; font-weight: 600 !important; }
html[data-theme="clean"] .fr-item-sub  { color: #6B6578 !important; }
html[data-theme="clean"] .fr-btn-sm.fr-btn-accept  { background: #7C3AED !important; color: #fff !important; border: none !important; }
html[data-theme="clean"] .fr-btn-sm.fr-btn-decline { background: #F0EDE8 !important; color: #3D3452 !important; border: 1px solid rgba(0,0,0,0.08) !important; }
html[data-theme="clean"] .fr-btn-sm.fr-btn-remove  { background: #FEF2F2 !important; color: #EF4444 !important; border: 1px solid #FECACA !important; }
html[data-theme="clean"] .fr-search-result { background: rgba(124,58,237,0.06) !important; border-color: rgba(124,58,237,0.18) !important; }
html[data-theme="clean"] .fr-empty { color: #9E98AA !important; }
html[data-theme="clean"] .fr-msg.ok  { color: #7C3AED !important; }
html[data-theme="clean"] .fr-msg.err { color: #EF4444 !important; }

/* ════════ AVATAR MODAL ════════ */
html[data-theme="clean"] .modal {
  background: #ffffff !important;
  border: 1px solid rgba(124,58,237,0.1) !important;
  box-shadow: 0 24px 80px rgba(124,58,237,0.12) !important;
}
html[data-theme="clean"] .modal-overlay {
  background: rgba(26,21,35,0.5) !important;
  backdrop-filter: blur(8px) !important;
}
html[data-theme="clean"] .modal-title { color: #1A1523 !important; font-weight: 700 !important; }
html[data-theme="clean"] .modal-section-title { color: #9E98AA !important; }
html[data-theme="clean"] .modal-close { background: #F0EDE8 !important; color: #3D3452 !important; }
html[data-theme="clean"] .modal-close:hover { background: #E8E3DC !important; }
html[data-theme="clean"] .av-modal-preview-inner {
  background: linear-gradient(135deg, #7C3AED, #EC4899) !important;
  box-shadow: 0 8px 28px rgba(124,58,237,0.3) !important;
}
html[data-theme="clean"] .em-btn { background: #F0EDE8 !important; border-radius: 10px !important; }
html[data-theme="clean"] .em-btn:hover { background: #E8E3DC !important; transform: none !important; }
html[data-theme="clean"] .em-btn.selected { border-color: #7C3AED !important; background: rgba(124,58,237,0.08) !important; }
html[data-theme="clean"] .fr-btn { background: linear-gradient(135deg, #7C3AED, #EC4899) !important; }
html[data-theme="clean"] .fr-btn.selected { outline-color: #7C3AED !important; }

/* ════════ TOAST ════════ */
html[data-theme="clean"] .toast {
  background: linear-gradient(135deg, #1A1523, #2D1B4E) !important;
  border: 1px solid rgba(124,58,237,0.3) !important;
  box-shadow: 0 12px 40px rgba(124,58,237,0.2), 0 4px 12px rgba(0,0,0,0.15) !important;
  border-radius: 14px !important;
}
html[data-theme="clean"] .toast-msg { color: #FAF7FF !important; }
html[data-theme="clean"] .toast-sub { color: #C4B5FD !important; }

/* ════════ PREMIUM BANNER ════════ */
html[data-theme="clean"] .premium-banner {
  background: linear-gradient(135deg, #1A1523 0%, #2E1065 50%, #1A1523 100%) !important;
  border: none !important;
  border-radius: 20px !important;
  box-shadow: 0 12px 40px rgba(124,58,237,0.25) !important;
}
html[data-theme="clean"] .premium-banner h3 { color: #ffffff !important; }
html[data-theme="clean"] .premium-banner p  { color: rgba(255,255,255,0.55) !important; }
html[data-theme="clean"] .btn-premium {
  background: linear-gradient(135deg, #7C3AED, #EC4899) !important;
  color: #ffffff !important;
  font-weight: 700 !important;
  border-radius: 10px !important;
  box-shadow: 0 4px 16px rgba(124,58,237,0.4) !important;
}
html[data-theme="clean"] .btn-premium:hover { transform: none !important; }

/* ════════ CALC WIDGET ════════ */
html[data-theme="clean"] .calc-widget {
  background: linear-gradient(135deg, rgba(124,58,237,0.07), rgba(236,72,153,0.04)) !important;
  border: 1px solid rgba(124,58,237,0.15) !important;
}
html[data-theme="clean"] .calc-widget.unlocked:hover {
  border-color: rgba(124,58,237,0.3) !important;
  box-shadow: 0 8px 24px rgba(124,58,237,0.1) !important;
}
html[data-theme="clean"] .calc-lock-overlay {
  background: rgba(247,245,242,0.9) !important;
  backdrop-filter: blur(6px) !important;
}
html[data-theme="clean"] .calc-unlock-btn {
  background: linear-gradient(135deg, #7C3AED, #EC4899) !important;
  color: #fff !important;
  box-shadow: 0 3px 14px rgba(124,58,237,0.35) !important;
}

/* ════════ DELETE MODAL ════════ */
html[data-theme="clean"] .del-modal {
  background: #ffffff !important;
  border: 1px solid #FEE2E2 !important;
  box-shadow: 0 24px 64px rgba(0,0,0,0.1) !important;
}
html[data-theme="clean"] .del-modal-overlay {
  background: rgba(26,21,35,0.5) !important;
  backdrop-filter: blur(8px) !important;
}
html[data-theme="clean"] .del-title { color: #EF4444 !important; }
html[data-theme="clean"] .del-desc  { color: #6B6578 !important; }
html[data-theme="clean"] .del-confirm-input {
  background: #FEF2F2 !important;
  border: 1.5px solid #FECACA !important;
  color: #EF4444 !important;
}
html[data-theme="clean"] .del-btn-cancel {
  background: #F0EDE8 !important;
  color: #3D3452 !important;
  border-color: transparent !important;
}
html[data-theme="clean"] .del-btn-delete {
  background: #FEF2F2 !important;
  color: #EF4444 !important;
  border-color: #FECACA !important;
}

/* ════════ NAV DROPDOWN ════════ */
html[data-theme="clean"] .nav-dropdown {
  background: #ffffff !important;
  border: 1px solid rgba(124,58,237,0.1) !important;
  box-shadow: 0 16px 50px rgba(124,58,237,0.1), 0 4px 12px rgba(0,0,0,0.06) !important;
  border-radius: 16px !important;
}
html[data-theme="clean"] .nav-dd-header { border-bottom: 1px solid #F0EDE8 !important; }
html[data-theme="clean"] .nav-dd-name   { color: #1A1523 !important; font-weight: 700 !important; }
html[data-theme="clean"] .nav-dd-email  { color: #9E98AA !important; }
html[data-theme="clean"] .nav-dd-item   { color: #3D3452 !important; font-weight: 500 !important; }
html[data-theme="clean"] .nav-dd-item:hover { background: #FAF7FF !important; color: #7C3AED !important; }
html[data-theme="clean"] .nav-dd-item.danger { color: #EF4444 !important; }
html[data-theme="clean"] .nav-dd-item.danger:hover { background: #FEF2F2 !important; }
html[data-theme="clean"] .nav-dd-sep { background: #F0EDE8 !important; }
html[data-theme="clean"] .fq-nav-avatar {
  background: linear-gradient(135deg, #7C3AED, #EC4899) !important;
  color: #fff !important;
  box-shadow: 0 2px 8px rgba(124,58,237,0.3) !important;
}

/* ════════ SCROLLBAR ════════ */
html[data-theme="clean"] ::-webkit-scrollbar { width: 5px; height: 5px; }
html[data-theme="clean"] ::-webkit-scrollbar-track { background: #F0EDE8; }
html[data-theme="clean"] ::-webkit-scrollbar-thumb { background: #C4B5FD; border-radius: 10px; }
html[data-theme="clean"] ::-webkit-scrollbar-thumb:hover { background: #A78BFA; }
`;

  if (THEME === 'clean') {
    const font = document.createElement('link');
    font.rel  = 'stylesheet';
    font.id   = 'fq-inter';
    font.href = 'https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap';
    (document.head || document.documentElement).appendChild(font);

    const style = document.createElement('style');
    style.id = 'fq-theme-style';
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  /* ════════════════════════════════
     THEME BUTTON – in Einstellungs-Dropdown
     Hängt sich per MutationObserver in das Dropdown ein
     das von components.js dynamisch erzeugt wird (fq-nav-dd).
     Kein Floating-Button mehr.
  ════════════════════════════════ */

  /* ════════════════════════════════
     THEME TOGGLE – in Einstellungs-Modal
     Hängt sich per MutationObserver in das Modal ein
     das von components.js gebaut wird (fq-set-overlay).
     Kein Floating-Button, keine Änderung an components.js.
  ════════════════════════════════ */

  function buildThemeSection() {
    const isClean = THEME === 'clean';

    const section = document.createElement('div');
    section.id = 'fq-theme-section';
    section.className = 'fq-set-section';
    // Gleicher Style wie andere Sections in components.js
    section.style.cssText = 'background:#0F3460;border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:18px 20px;margin-top:0';

    section.innerHTML = `
      <div class="fq-set-stitle" style="font-size:13px;font-weight:700;color:#F0F4FF;margin-bottom:14px;font-family:'Clash Display','DM Sans',sans-serif">
        🎨 Design-Modus
      </div>
      <div style="display:flex;gap:10px;">
        <button id="fq-theme-game-btn"
          style="flex:1;padding:12px 8px;border-radius:12px;border:2px solid ${!isClean ? '#00D48A' : 'rgba(255,255,255,0.1)'};
          background:${!isClean ? 'rgba(0,212,138,0.12)' : 'rgba(255,255,255,0.04)'};
          color:${!isClean ? '#00D48A' : '#8892B0'};
          font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all 0.2s;
          display:flex;flex-direction:column;align-items:center;gap:6px;">
          <span style="font-size:22px">🎮</span>
          <span>Game</span>
          <span style="font-size:10px;font-weight:400;opacity:0.7">Dunkel & gamifiziert</span>
          ${!isClean ? '<span style="font-size:9px;background:rgba(0,212,138,0.2);border:1px solid rgba(0,212,138,0.4);border-radius:50px;padding:1px 8px;color:#00D48A">AKTIV</span>' : ''}
        </button>
        <button id="fq-theme-clean-btn"
          style="flex:1;padding:12px 8px;border-radius:12px;border:2px solid ${isClean ? '#7C3AED' : 'rgba(255,255,255,0.1)'};
          background:${isClean ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.04)'};
          color:${isClean ? '#C4B5FD' : '#8892B0'};
          font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all 0.2s;
          display:flex;flex-direction:column;align-items:center;gap:6px;">
          <span style="font-size:22px">✦</span>
          <span>Clean</span>
          <span style="font-size:10px;font-weight:400;opacity:0.7">Hell & modern</span>
          ${isClean ? '<span style="font-size:9px;background:rgba(124,58,237,0.2);border:1px solid rgba(124,58,237,0.4);border-radius:50px;padding:1px 8px;color:#C4B5FD">AKTIV</span>' : ''}
        </button>
      </div>`;

    section.querySelector('#fq-theme-game-btn').onclick = () => {
      if (THEME !== 'game') { localStorage.setItem(KEY, 'game'); location.reload(); }
    };
    section.querySelector('#fq-theme-clean-btn').onclick = () => {
      if (THEME !== 'clean') { localStorage.setItem(KEY, 'clean'); location.reload(); }
    };

    return section;
  }

  function injectIntoSettings(modal) {
    if (modal.querySelector('#fq-theme-section')) return;
    // Vor der Gefahrenzone (letztes fq-set-section) einfügen
    const sections = modal.querySelectorAll('.fq-set-section');
    const lastSection = sections[sections.length - 1];
    if (lastSection) {
      modal.querySelector('.fq-set-section').parentNode.insertBefore(
        buildThemeSection(),
        lastSection
      );
    } else {
      modal.appendChild(buildThemeSection());
    }
  }

  function watchForSettings() {
    const obs = new MutationObserver(() => {
      const modal = document.getElementById('fq-set-overlay');
      if (modal) injectIntoSettings(modal);
    });
    obs.observe(document.body, { childList: true, subtree: true });

    // Falls Modal schon da
    const existing = document.getElementById('fq-set-overlay');
    if (existing) injectIntoSettings(existing);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watchForSettings);
  } else {
    watchForSettings();
  }

})();
