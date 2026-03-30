/* ═══════════════════════════════════════════════════════════════
   lang.js  –  FinQuest Sprachumschalter (DE ↔ EN)
   Version 4.0  –  i18next + JSON-Backend (loc/en.json)

   Architektur:
     • Übersetzungen liegen in  loc/en.json  (1000+ Einträge)
     • loc/de.json ist leer – Deutsch ist die Quellsprache
     • Kein data-i18n nötig: Text-Node-Replacement wie bisher
     • i18next CDN-Skripte werden für EN-Nutzer dynamisch geladen
     • DeepL via Cloudflare Worker als Fallback für unbekannte Texte
     • Alle HTML-Seiten bleiben UNVERÄNDERT
═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const STORAGE_KEY = 'fq_lang';
  const LANG = localStorage.getItem(STORAGE_KEY) || 'de';

  /* ══════════════════════════════════════════════════════
     i18NEXT STATE
  ══════════════════════════════════════════════════════ */
  let _i18nReady  = false;   // true sobald i18next + en.json geladen
  let _i18nBundle = null;    // gecachtes Translation-Bundle für Substring-Suche
  let _i18nPromise = null;   // laufendes Lade-Promise

  /* ══════════════════════════════════════════════════════
     CDN-SKRIPTE DYNAMISCH LADEN
     Startet sofort beim Script-Parse (nicht erst DOMContentLoaded)
     → maximiert paralleles Laden während der DOM aufgebaut wird.
  ══════════════════════════════════════════════════════ */
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      // Bereits geladen? → sofort auflösen
      if (document.querySelector('script[src="' + src + '"]')) {
        return resolve();
      }
      var s = document.createElement('script');
      s.src = src;
      s.onload  = resolve;
      s.onerror = function () { reject(new Error('Konnte nicht laden: ' + src)); };
      document.head.appendChild(s);
    });
  }

  /* CDN-Versionen gepinnt für Stabilität */
  var CDN = {
    core:    'https://unpkg.com/i18next@23.16.8/i18next.min.js',
    backend: 'https://unpkg.com/i18next-http-backend@2.6.2/i18nextHttpBackend.min.js'
  };

  /* Lade-Chain startet sofort für EN-Nutzer */
  if (LANG === 'en') {
    _i18nPromise = loadScript(CDN.core)
      .then(function () { return loadScript(CDN.backend); })
      .then(function () {
        return i18next
          .use(window.i18nextHttpBackend)
          .init({
            /* Sprach-Konfiguration */
            lng:          'en',          // explizit setzen (LanguageDetector nicht nötig)
            fallbackLng:  false,         // kein Fallback: fehlender Key → Key zurückgeben
            supportedLngs: ['de', 'en'],

            /* Namespace */
            defaultNS: 'translation',
            ns:        ['translation'],

            /* KRITISCH: Trennzeichen deaktivieren.
               Deutsche Texte enthalten Punkte (z.B. "K × (1 + p)ⁿ"),
               Doppelpunkte ("Was ist: ...") und andere Sonderzeichen. */
            keySeparator:  false,
            nsSeparator:   false,

            /* HTTP-Backend: lädt loc/en.json via fetch()
               './' → relativer Pfad, funktioniert auf GitHub Pages und lokal.
               WARNUNG: file://-Protokoll wirft CORS-Fehler → Live-Server nutzen. */
            backend: {
              loadPath:       './loc/{{lng}}.json',
              requestOptions: { cache: 'default' }
            },

            /* Kein XSS-Escaping nötig: wir setzen textContent (kein innerHTML) */
            interpolation: { escapeValue: false },

            /* Fehlende Keys still ignorieren */
            saveMissing: false,
            debug:       false
          });
      })
      .then(function () {
        _i18nReady  = true;
        /* Bundle cachen für Substring-Matching (lange Texte) */
        _i18nBundle = i18next.getResourceBundle('en', 'translation') || {};
        /* Re-render theory box if a lesson modal is already open
           (handles timing: user opened lesson before i18next finished loading) */
        var overlay = document.getElementById('modalOverlay');
        if (overlay && overlay.classList.contains('open')) {
          var mTheory = document.getElementById('mTheory');
          if (mTheory && mTheory.dataset.rawTheory) {
            var translated = i18next.t(mTheory.dataset.rawTheory);
            if (translated !== mTheory.dataset.rawTheory) {
              mTheory.innerHTML = translated
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>');
            }
          }
        }
      })
      .catch(function (err) {
        console.warn('[FinQuest i18n] i18next konnte nicht geladen werden:', err.message);
        /* Seite bleibt auf Deutsch – kein crash */
      });
  }

  /* ══════════════════════════════════════════════════════
     DEEPL VIA CLOUDFLARE WORKER
     Wird nur aufgerufen wenn Text NICHT im Wörterbuch steht.
     Ergebnisse werden in localStorage gecacht →
     kein doppelter API-Aufruf für denselben Text.
  ══════════════════════════════════════════════════════ */
  const WORKER_URL = 'https://finquest-translate.mark-hasenjaeger.workers.dev';
  const CACHE_KEY  = 'fq_deepl_cache';

  function getCache() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; }
  }
  function setCache(de, en) {
    try {
      const c = getCache();
      c[de] = en;
      const keys = Object.keys(c);
      if (keys.length > 8000) delete c[keys[0]];
      localStorage.setItem(CACHE_KEY, JSON.stringify(c));
    } catch {}
  }

  const _pending = new Set();

  async function deepLTranslate(text) {
    if (!text || text.trim().length < 2) return null;
    if (_pending.has(text)) return null;
    const cache = getCache();
    if (cache[text]) return cache[text];
    _pending.add(text);
    try {
      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang: 'EN' }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const translated = data.translated;
      if (translated && translated !== text) {
        setCache(text, translated);
        return translated;
      }
    } catch {}
    finally { _pending.delete(text); }
    return null;
  }

  async function deepLNode(node) {
    if (!node || !node.textContent) return;
    const original = node.textContent.trim();
    if (!original || original.length < 2) return;
    if (shouldSkip(node)) return;
    const translated = await deepLTranslate(original);
    if (translated && node.textContent.trim() === original) {
      node.textContent = node.textContent.replace(original, translated);
    }
  }

  async function deepLPage(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (shouldSkip(node)) return NodeFilter.FILTER_REJECT;
        const t = node.textContent.trim();
        if (!t || t.length < 2) return NodeFilter.FILTER_SKIP;
        if (tr(node.textContent) !== node.textContent) return NodeFilter.FILTER_SKIP;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (let i = 0; i < nodes.length; i += 10) {
      await Promise.all(nodes.slice(i, i + 10).map(deepLNode));
    }
  }

  /* ══════════════════════════════════════════════════════
     REGEX-PATTERNS
     (Dynamische Texte mit eingebetteten Zahlen/Namen –
      können nicht in einer statischen JSON-Datei stehen.)
  ══════════════════════════════════════════════════════ */
  const PATTERNS = [
    { re: /^(🔥\s*)(\d+)\s+Tage(?:n)?\s+Streak$/,      en: m => `${m[1]}${m[2]}-Day Streak` },
    { re: /^(📅\s*)Seit\s+(\d+)\s+Tagen$/,              en: m => `${m[1]}For ${m[2]} days` },
    { re: /^(📅\s*)Seit heute$/,                         en: m => `${m[1]}Since today` },
    { re: /^Noch\s+([\d.,]+)\s+XP bis Level\s+(\d+)$/,  en: m => `Only ${m[1]} XP until Level ${m[2]}` },
    { re: /^(\d+)\s*\/\s*(\d+)\s+Lektionen\s*✅\s*Abgeschlossen$/, en: m => `${m[1]} / ${m[2]} Lessons ✅ Completed` },
    { re: /^(\d+)\s*\/\s*(\d+)\s+Lektionen\s*–\s*In Bearbeitung$/, en: m => `${m[1]} / ${m[2]} Lessons – In Progress` },
    { re: /^(\d+)\s*\/\s*(\d+)\s+Lektionen\s*–\s*Noch nicht gestartet$/, en: m => `${m[1]} / ${m[2]} Lessons – Not started yet` },
    { re: /^\+([\d.,]+)\s+XP verdient!$/,               en: m => `+${m[1]} XP earned!` },
    { re: /^([\d.,]+)\s+XP ausgegeben\.$/,              en: m => `${m[1]} XP spent.` },
    { re: /^(.+)\s+gekauft!$/,                           en: m => `${m[1]} purchased!` },
    { re: /^(.+)\s+angelegt!$/,                          en: m => `${m[1]} equipped!` },
    { re: /^(.+)\s+hat dich überholt!$/,                en: m => `${m[1]} has overtaken you!` },
    { re: /^Warte auf Bestätigung von\s+(.+)$/,          en: m => `Waiting for confirmation from ${m[1]}` },
    { re: /^(.+)\s+entfernt\.$/,                         en: m => `${m[1]} removed.` },
    { re: /^Freundschaft mit\s+(.+)\s+beenden\?$/,       en: m => `End friendship with ${m[1]}?` },
    { re: /^Zuletzt:\s+(.+)$/,                           en: m => `Last: ${m[1]}` },
    { re: /^(🪙\s*)Belohnung:\s+(.+)$/,                 en: m => `${m[1]}Reward: ${m[2]}` },
    { re: /^Frage\s+(\d+)\s*\/\s*(\d+)$/,               en: m => `Question ${m[1]} / ${m[2]}` },
    { re: /^(\d+)\s+Antworten$/,                         en: m => `${m[1]} answers` },
    { re: /^Lektion\s+(\d+)\s+von\s+(\d+)$/,            en: m => `Lesson ${m[1]} of ${m[2]}` },
    { re: /^(⚡\s*)Level\s+(\d+)$/,                      en: m => `${m[1]}Level ${m[2]}` },
    { re: /^(\d+)\s+von\s+(\d+)\s+Lektionen$/,          en: m => `${m[1]} of ${m[2]} lessons` },
    { re: /^Alle\s+(\d+)\s+Lektionen von\s+(.+)\s+abgeschlossen\s+–\s+(\d+)\s+XP verdient!$/, en: m => `All ${m[1]} lessons of ${m[2]} completed – ${m[3]} XP earned!` },
    { re: /^(\d+)\s+Spieler\s+verbunden$/,               en: m => `${m[1]} players connected` },
    { re: /^(\d+)\s+\/\s+(\d+)\s+haben\s+geantwortet$/,en: m => `${m[1]} / ${m[2]} have answered` },
  ];

  /* ══════════════════════════════════════════════════════
     KERN-FUNKTIONEN
  ══════════════════════════════════════════════════════ */
  function shouldSkip(node) {
    let el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    while (el && el !== document.body) {
      if (!el.classList) { el = el.parentElement; continue; }
      if (el.classList.contains('notranslate') || el.getAttribute('translate') === 'no' ||
          el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'CODE' || el.tagName === 'PRE')
        return true;
      el = el.parentElement;
    }
    return false;
  }

  /**
   * Übersetzt einen deutschen Text ins Englische.
   *
   * Reihenfolge:
   *   1. i18next exact match  (aus loc/en.json)
   *   2. PATTERNS             (dynamische Regex-Muster)
   *   3. Substring-Match      (für eingebettete Satzteile, min. 12 Zeichen)
   *
   * Wenn kein Match: gibt text unverändert zurück.
   */
  function tr(text) {
    const t = text.trim();
    if (!t || t.length < 2) return text;

    /* 1. Exakter Match via i18next */
    if (_i18nReady) {
      const translated = i18next.t(t);
      if (translated !== t) return text.replace(t, translated);
    }

    /* 2. Dynamische Regex-Patterns */
    for (const p of PATTERNS) {
      const m = t.match(p.re);
      if (m) return text.replace(t, p.en(m));
    }

    /* 3. Substring-Match für eingebettete Phrasen
       Nutzt das gecachte Bundle – nur verfügbar nach i18next-Init. */
    if (_i18nReady && _i18nBundle) {
      const sorted = Object.entries(_i18nBundle)
        .filter(([de]) => de.length >= 12)
        .sort((a, b) => b[0].length - a[0].length);
      for (const [de, en] of sorted) {
        if (t.includes(de)) return text.replace(de, en);
      }
    }

    return text;
  }

  function translateNode(root) {
    if (!root || shouldSkip(root)) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (shouldSkip(node)) return NodeFilter.FILTER_REJECT;
        if (!node.textContent.trim()) return NodeFilter.FILTER_SKIP;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n => { const t = tr(n.textContent); if (t !== n.textContent) n.textContent = t; });
    if (root.querySelectorAll) {
      root.querySelectorAll('[placeholder]').forEach(el => {
        if (shouldSkip(el)) return;
        const t = tr(el.placeholder);
        if (t !== el.placeholder) el.placeholder = t;
      });
    }
  }

  function translatePage() {
    translateNode(document.body);
    const t = tr(document.title);
    if (t !== document.title) document.title = t;
  }

  /* ══════════════════════════════════════════════════════
     MUTATIONOBSERVER  –  neue DOM-Elemente übersetzen
  ══════════════════════════════════════════════════════ */
  let _busy = false;
  const observer = new MutationObserver(mutations => {
    if (_busy) return;
    _busy = true;
    setTimeout(() => {
      mutations.forEach(m => m.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          translateNode(node);
          if (LANG === 'en') setTimeout(() => deepLPage(node), 300);
        }
      }));
      _busy = false;
    }, 0);
  });

  /* ══════════════════════════════════════════════════════
     SPRACH-BUTTON – bleibt im Einstellungs-Modal (components.js)
  ══════════════════════════════════════════════════════ */
  function injectLangButton() {
    // Der Sprach-Toggle ist im ⚙️ Einstellungs-Modal integriert.
    // Kein separater floating Button nötig.
  }

  /* ══════════════════════════════════════════════════════
     AUTOMATISCHER DEEPL-WÄCHTER (MUTATION OBSERVER)
  ══════════════════════════════════════════════════════ */
  let deepLTimer = null;

  const dynamicDeepLObserver = new MutationObserver((mutations) => {
    if (LANG !== 'en') return;
    let hasNewContent = false;
    for (let mutation of mutations) {
      if (
        mutation.addedNodes.length > 0 ||
        mutation.type === 'characterData' ||
        (mutation.type === 'attributes' && mutation.attributeName === 'class')
      ) {
        hasNewContent = true;
        break;
      }
    }
    if (hasNewContent) {
      clearTimeout(deepLTimer);
      deepLTimer = setTimeout(() => {
        if (typeof translatePage === 'function') translatePage();
        if (typeof deepLPage    === 'function') deepLPage(document.body);
      }, 500);
    }
  });

  /* ══════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════ */
  function init() {
    injectLangButton();

    if (LANG === 'en') {
      if (_i18nPromise) {
        /* Warte auf i18next + en.json, dann übersetzen */
        _i18nPromise.then(function () {
          translatePage();
          observer.observe(document.body, { childList: true, subtree: true });
          window.addEventListener('load', translatePage);
          setTimeout(translatePage, 500);
          setTimeout(translatePage, 1500);
          setTimeout(translatePage, 3000);

          /* DeepL als Fallback für Texte die nicht in en.json sind */
          setTimeout(() => deepLPage(document.body), 800);
          setTimeout(() => deepLPage(document.body), 2500);
          window.addEventListener('load', () => setTimeout(() => deepLPage(document.body), 600));
        });
      } else {
        /* Fallback falls _i18nPromise nicht existiert */
        observer.observe(document.body, { childList: true, subtree: true });
        window.addEventListener('load', translatePage);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* DynamicDeepL-Observer immer starten (prüft LANG intern) */
  window.addEventListener('DOMContentLoaded', () => {
    if (LANG === 'en') {
      dynamicDeepLObserver.observe(document.body, {
        childList:       true,
        subtree:         true,
        characterData:   true,
        attributes:      true,
        attributeFilter: ['class']
      });
    }
  });

})();
