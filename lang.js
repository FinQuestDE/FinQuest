/* ═══════════════════════════════════════════════════════════════
   lang.js  –  FinQuest Sprachumschalter (DE ↔ EN)
   Version 3.0  –  Vollständige Abdeckung aller Seiten & Kurse
═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const STORAGE_KEY = 'fq_lang';
  const LANG = localStorage.getItem(STORAGE_KEY) || 'de';

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
      // Cache auf max. 8000 Einträge begrenzen
      const keys = Object.keys(c);
      if (keys.length > 8000) delete c[keys[0]];
      localStorage.setItem(CACHE_KEY, JSON.stringify(c));
    } catch {}
  }

  // Texte die gerade an DeepL gesendet werden (verhindert Doppel-Requests)
  const _pending = new Set();

  async function deepLTranslate(text) {
    if (!text || text.trim().length < 2) return null;
    if (_pending.has(text)) return null;

    // Erst Cache prüfen
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

  // Übersetzt einen DOM-Knoten per DeepL und aktualisiert ihn direkt
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

  // Alle Textnodes einer Seite per DeepL übersetzen (Fallback für unbekannte Texte)
  async function deepLPage(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (shouldSkip(node)) return NodeFilter.FILTER_REJECT;
        const t = node.textContent.trim();
        if (!t || t.length < 2) return NodeFilter.FILTER_SKIP;
        // Nur Texte die das lokale Wörterbuch NICHT kennt
        if (tr(node.textContent) !== node.textContent) return NodeFilter.FILTER_SKIP;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    // Batched: max 10 gleichzeitig um Rate-Limits zu vermeiden
    for (let i = 0; i < nodes.length; i += 10) {
      await Promise.all(nodes.slice(i, i + 10).map(deepLNode));
    }
  }

  /* ══════════════════════════════════════════════════════
     WÖRTERBUCH
  ══════════════════════════════════════════════════════ */
  const DICT = {

    // ── Navigation & Buttons ────────────────────────────
    'Einloggen':                          'Log In',
    'Einloggen →':                        'Log In →',
    'Kostenlos starten':                  'Start for Free',
    'Kostenlos starten →':               'Start for Free →',
    'Ausloggen':                          'Log out',
    'Logout':                             'Log out',
    '🚪 Ausloggen':                       '🚪 Log out',
    '👤 Mein Profil':                     '👤 My Profile',
    '👤 Mein Dashboard':                  '👤 My Dashboard',
    '⚙️ Einstellungen':                   '⚙️ Settings',
    '🗑️ Konto löschen':                  '🗑️ Delete Account',
    '⚠️ Konto löschen':                  '⚠️ Delete Account',
    '👥 Freunde':                         '👥 Friends',
    '🔑 Passwort ändern':                 '🔑 Change Password',
    '👤 Benutzername ändern':             '👤 Change Username',
    '🗑️ Endgültig löschen':              '🗑️ Delete Permanently',
    'Speichern':                          'Save',
    '💾 Speichern':                       '💾 Save',
    'Suchen':                             'Search',
    '← Zurück':                          '← Back',
    '← Zurück zur Startseite':           '← Back to Homepage',
    '← Zurück zum Dashboard':            '← Back to Dashboard',
    '← Zurück zum Login':                '← Back to Login',
    '← Dashboard':                       '← Dashboard',
    'Menü öffnen':                        'Open Menu',
    'Abbrechen':                          'Cancel',
    '✕ Schließen':                       '✕ Close',
    'Weiter →':                          'Continue →',
    'Weiter':                             'Continue',

    // ── Footer ──────────────────────────────────────────
    'Produkt':                            'Product',
    'Support':                            'Support',
    'Unternehmen':                        'Company',
    'Rechtliches':                        'Legal',
    'Hilfe-Center':                       'Help Center',
    'Hilfe':                              'Help',
    'Community':                          'Community',
    'Blog':                               'Blog',
    'Premium':                            'Premium',
    'Preise':                             'Pricing',
    'Challenges':                         'Challenges',
    'Karriere':                           'Careers',
    'Presse':                             'Press',
    'Über uns':                           'About Us',
    'Für Schulen':                        'For Schools',
    'Impressum':                          'Legal Notice',
    'Datenschutz':                        'Privacy',
    'Kontakt':                            'Contact',
    'API-Status':                         'API Status',
    'Keine Finanzberatung. Alle Inhalte dienen ausschließlich der Bildung.':
      'No financial advice. All content is for educational purposes only.',
    '© 2025 FinQuest GmbH':             '© 2025 FinQuest GmbH',

    // ── Settings Modal ──────────────────────────────────
    'Aktuelles Passwort':                 'Current Password',
    'Neues Passwort (mind. 6 Zeichen)':  'New Password (min. 6 characters)',
    'Neues Passwort bestätigen':          'Confirm New Password',
    'Mind. 2 Zeichen erforderlich.':      'At least 2 characters required.',
    'Wird geprüft…':                      'Checking…',
    'Dieser Nutzername ist bereits vergeben.': 'This username is already taken.',
    '✅ Benutzername gespeichert!':        '✅ Username saved!',
    'Alle Felder ausfüllen.':             'Please fill in all fields.',
    'Neue Passwörter stimmen nicht überein.': 'New passwords do not match.',
    'Passwort muss mind. 6 Zeichen haben.': 'Password must be at least 6 characters.',
    'Wird geändert…':                     'Changing…',
    'Nicht eingeloggt':                   'Not logged in',
    '✅ Passwort erfolgreich geändert!':   '✅ Password changed successfully!',
    'Falsches aktuelles Passwort.':       'Incorrect current password.',
    'Bitte erst aus- und wieder einloggen.': 'Please log out and log in again.',
    'Wird gelöscht…':                     'Deleting…',
    'Bitte erst ausloggen und wieder einloggen, dann nochmal versuchen.':
      'Please log out and log in again, then try once more.',
    'LÖSCHEN':                            'DELETE',
    'Diese Aktion ist':                   'This action is',
    'unwiderruflich':                     'irreversible',

    // ── Dashboard ──────────────────────────────────────
    'Mein Dashboard – FinQuest':          'My Dashboard – FinQuest',
    'Mein Dashboard':                     'My Dashboard',
    'Gesamt XP':                          'Total XP',
    'XP verfügbar':                       'XP Available',
    '💜 FinCoins':                        '💜 FinCoins',
    'Kurse aktiv':                        'Active Courses',
    'Lektionen ✅':                       'Lessons ✅',
    'XP verfügbar für Shop':              'XP available for Shop',
    'Tage in Folge':                      'Days in a row',
    'heute':                              'today',
    'Avatar anpassen':                    'Customize Avatar',
    'Meine Kurse':                        'My Courses',
    'XP-Shop':                            'XP Shop',
    'Erfolge':                            'Achievements',
    '🔥 Lern-Streak':                     '🔥 Learning Streak',
    '⚡ Tages-Challenge':                 '⚡ Daily Challenge',
    '🏅 Achievements':                    '🏅 Achievements',
    'Alle →':                             'All →',
    '🏆 Rangliste':                       '🏆 Leaderboard',
    'Challenges →':                       'Challenges →',
    'Live-Quiz':                          'Live Quiz',
    '⚡ Zeitbasiert':                     '⚡ Time-based',
    'Starte ein Multiplayer-Quiz und teste dein Finanzwissen gegen echte Spieler – live und in Echtzeit.':
      'Start a multiplayer quiz and test your financial knowledge against real players – live and in real time.',
    'Noch keine Einträge. Schließe eine Lektion ab!':
      'No entries yet. Complete a lesson!',
    '🏅 Alle Erfolge':                    '🏅 All Achievements',
    '🔒 Noch gesperrt':                   '🔒 Still locked',
    '👥 Freundes-Rangliste':              '👥 Friends Leaderboard',
    '➕ Freunde verwalten':              '➕ Manage Friends',
    'Füge Freunde hinzu um sie hier zu sehen!': 'Add friends to see them here!',
    '➕ Ersten Freund hinzufügen':        '➕ Add First Friend',
    '(Du)':                               '(You)',
    'Dein XP-Guthaben':                   'Your XP Balance',
    'Deine FinCoins':                     'Your FinCoins',
    'Verdiene XP & FinCoins durch Kurse und Challenges! 🎨':
      'Earn XP & FinCoins through courses and challenges! 🎨',
    '✨ Alle':                            '✨ All',
    '🖼️ Rahmen':                         '🖼️ Frames',
    '🎨 Hintergründe':                    '🎨 Backgrounds',
    '🏷️ Titel':                          '🏷️ Titles',
    '🐾 Avatare':                         '🐾 Avatars',
    'Ausgerüstet ✓':                      'Equipped ✓',
    'Anlegen →':                          'Equip →',
    'Kaufen ✨':                          'Buy ✨',
    'Zu wenig XP':                        'Not enough XP',
    'AN':                                 'ON',
    '🏆 Max Level erreicht!':             '🏆 Max Level reached!',
    'Erste Lektion':                      'First Lesson',
    '3-Tage Streak':                      '3-Day Streak',
    '10 Lektionen':                       '10 Lessons',
    'Kurs komplett':                      'Course Complete',
    '3 Kurse aktiv':                      '3 Courses Active',
    'Alle Kurse':                         'All Courses',
    'Erster Kauf':                        'First Purchase',
    'Avatar gesetzt':                     'Avatar Set',
    'Top Streak 7':                       'Top Streak 7',
    'Milestone':                          'Milestone',
    'Schnell-Lektion':                    'Quick Lesson',
    'Quiz-Meister':                       'Quiz Master',
    'Neuer Kurs':                         'New Course',
    'Lern-Sprint':                        'Learning Sprint',
    'Schließe eine beliebige Lektion ab': 'Complete any lesson',
    'Beantworte 3 Fragen richtig in Folge': 'Answer 3 questions correctly in a row',
    'Starte einen noch nicht begonnenen Kurs': 'Start a course you haven\'t begun yet',
    'Schließe 2 Lektionen heute ab':      'Complete 2 lessons today',
    '🎁 Belohnung abholen!':              '🎁 Claim Reward!',
    'Challenge starten →':                'Start Challenge →',
    '🎉 Belohnung heute bereits abgeholt!': '🎉 Reward already claimed today!',
    'Nicht genug XP':                     'Not enough XP',
    'Verdiene mehr XP durch Lektionen!':  'Earn more XP through lessons!',
    'Tages-Challenge abgeschlossen!':     'Daily Challenge completed!',
    'Bereits abgeholt!':                  'Already claimed!',
    'Lerne weiter um die Führung zu halten!': 'Keep learning to maintain the lead!',
    'Bitte einloggen':                    'Please Log In',
    'Du musst eingeloggt sein, um dein Dashboard zu sehen.':
      'You must be logged in to see your dashboard.',
    'Jetzt einloggen →':                  'Log In Now →',
    'Werde FinQuest Premium':             'Become FinQuest Premium',
    'Lerne ohne Werbung, schalte exklusive Kurse frei und erhalte doppelte FinCoins.':
      'Learn without ads, unlock exclusive courses and earn double FinCoins.',
    'Premium testen →':                   'Try Premium →',
    '✏️ Avatar anpassen':                '✏️ Customize Avatar',
    'Emoji wählen':                       'Choose Emoji',
    'Rahmen wählen':                      'Choose Frame',
    'Hintergrundfarbe':                   'Background Color',
    'Freund hinzufügen':                  'Add Friend',
    '➕ Anfrage senden':                  '➕ Send Request',
    'Freundschaftsanfragen':              'Friend Requests',
    'Meine Freunde':                      'My Friends',
    'Lade Freunde…':                      'Loading friends…',
    'Noch keine Freunde. Suche nach Nutzernamen!': 'No friends yet. Search by username!',
    'Fehler beim Laden.':                 'Error loading.',
    'Kein Nutzer mit diesem Namen gefunden.': 'No user found with this name.',
    'Das bist du selbst 😅':              'That\'s yourself 😅',
    '✅ Bereits befreundet':              '✅ Already friends',
    '⏳ Anfrage gesendet':                '⏳ Request sent',
    '✓ Annehmen':                         '✓ Accept',
    'Entfernen':                          'Remove',

    // ── Kurs-Seiten (gemeinsame UI) ─────────────────────
    '📚 20 Lektionen':                   '📚 20 Lessons',
    '⚡ 1000 XP möglich':                '⚡ 1000 XP possible',
    '⏱️ ca. 20 Minuten':                 '⏱️ approx. 20 minutes',
    '📖 Deine Geschichte':               '📖 Your Story',
    'Kurs abgeschlossen!':                'Course Completed!',
    '🏆 Kurs abgeschlossen!':            '🏆 Course Completed!',
    'Weiter zum Dashboard →':            'Continue to Dashboard →',
    'Zum Dashboard →':                   'To Dashboard →',
    '🔄 Wiederholen':                    '🔄 Repeat',
    '⚡ Aufbau':                         '⚡ Foundation',
    '🚀 Fortgeschritten':                '🚀 Advanced',
    '🏆 Meisterlevel':                   '🏆 Master Level',
    'Wissenscheck 🧠':                   'Knowledge Check 🧠',
    '🌍 Einsteiger':                     '🌍 Beginner',
    '🐣 Einsteiger':                     '🐣 Beginner',
    'Einsteiger':                         'Beginner',
    'Mittelstufe':                        'Intermediate',
    'Fortgeschritten':                    'Advanced',
    '0 von 20 Lektionen':               '0 of 20 lessons',
    '0 / 1000 XP':                       '0 / 1000 XP',
    '25% geschafft! 🔥':                 '25% done! 🔥',
    'Halbzeit! Du bist auf dem richtigen Weg! ⚡': 'Halfway! You\'re on the right track! ⚡',
    '75%! Fast am Ziel! 🚀':             '75%! Almost there! 🚀',
    '🎉 Glückwunsch! +':                 '🎉 Congrats! +',
    '❌ Falsch. 💡':                     '❌ Wrong. 💡',
    '🔒 Schließe zuerst die vorherige Lektion ab!': '🔒 Complete the previous lesson first!',
    'Wähle eine Schatztruhe – dein Bonusbelohnung wartet!':
      'Choose a treasure chest – your bonus reward awaits!',
    'Wähle mich!':                        'Choose me!',
    'Bonus-XP!':                          'Bonus XP!',
    'von':                                'of',

    // ── Kursnamen ───────────────────────────────────────
    'Geld 101':                           'Money 101',
    'Die Grundlagen der Finanzwelt':      'The Basics of Finance',
    'Schulden & Kredit':                  'Debt & Credit',
    'Investieren für Anfänger':           'Investing for Beginners',
    'Immobilien verstehen':               'Understanding Real Estate',
    'Steuern einfach erklärt':            'Taxes Simply Explained',
    'FIRE-Bewegung':                      'FIRE Movement',
    'Rente & Altersvorsorge':             'Pension & Retirement',
    'Zinseszins':                         'Compound Interest',
    'ETFs verstehen & nutzen':            'Understanding & Using ETFs',
    '✅ Abgeschlossen':                   '✅ Completed',
    '– In Bearbeitung':                   '– In Progress',
    '– Noch nicht gestartet':             '– Not started yet',

    // ── Kurs-Lektionstitel ──────────────────────────────
    'Was ist Geld?':                      'What is Money?',
    'Was ist Inflation?':                 'What is Inflation?',
    'Wie funktioniert eine Bank?':        'How Does a Bank Work?',
    'Girokonto & Zinsen':                 'Checking Account & Interest',
    'Zinseszins – das 8. Weltwunder':     'Compound Interest – the 8th Wonder',
    'Steuern auf Kapitalerträge':         'Taxes on Capital Gains',
    'Haushaltsbuch & Budgetierung':       'Budget Book & Budgeting',
    'Dein erster Schritt zur Finanzfreiheit': 'Your First Step to Financial Freedom',
    'Warum Geld auf dem Konto fault':     'Why Money Rots in Your Account',
    'Der Notgroschen – dein finanzielles Airbag': 'Emergency Fund – Your Financial Airbag',
    'Netto vs. Brutto – was du wirklich verdienst': 'Net vs. Gross – What You Really Earn',
    'Deflation – das weniger bekannte Gegenteil': 'Deflation – The Lesser-Known Opposite',
    'Wechselkurse einfach erklärt':       'Exchange Rates Simply Explained',
    'Aktien, Anleihen, Immobilien – der Überblick': 'Stocks, Bonds, Real Estate – the Overview',
    'Behavioral Finance – wenn Gefühle Fehler machen': 'Behavioral Finance – When Emotions Make Mistakes',
    'Freistellungsauftrag richtig nutzen': 'Using Your Tax Exemption Order Correctly',
    'FinTech & Neobanken – lohnt sich der Wechsel?': 'FinTech & Neobanks – Is the Switch Worth It?',
    'Liquiditätsfalle & Opportunitätskosten': 'Liquidity Trap & Opportunity Costs',
    'Dein persönlicher Finanzplan in 5 Schritten': 'Your Personal Financial Plan in 5 Steps',
    'Finanzwissen als Superkraft':         'Financial Knowledge as a Superpower',

    // ETF-Kurs Lektionstitel
    'Was ist ein ETF?':                   'What is an ETF?',
    'ETF vs. Aktie vs. Fonds':           'ETF vs. Stock vs. Fund',
    'Der MSCI World – der König der ETFs': 'The MSCI World – the King of ETFs',
    'Kosten: TER & versteckte Gebühren':  'Costs: TER & Hidden Fees',
    'Thesaurierend vs. Ausschüttend':     'Accumulating vs. Distributing',
    'Der ETF-Sparplan':                   'The ETF Savings Plan',
    'Risiko & Diversifikation':           'Risk & Diversification',
    'Dein erstes ETF-Depot einrichten':   'Setting Up Your First ETF Portfolio',

    // FIRE-Kurs Lektionstitel
    'Was ist FIRE?':                      'What is FIRE?',
    'Die 4%-Regel':                       'The 4% Rule',
    'Sparrate – der wichtigste Hebel':    'Savings Rate – The Most Important Lever',
    'Ausgaben senken':                    'Reducing Expenses',
    'Investieren für FIRE':               'Investing for FIRE',
    'Einnahmen erhöhen':                  'Increasing Income',
    'Absicherung bei FIRE':               'Insurance for FIRE',
    'Sequence-of-Returns-Risiko':         'Sequence of Returns Risk',

    // Investieren-Kurs Lektionstitel
    'Warum investieren?':                 'Why Invest?',
    'Risiko & Rendite':                   'Risk & Return',
    'Depot eröffnen':                     'Opening a Portfolio',
    'ETF-Sparplan einrichten':            'Setting Up an ETF Savings Plan',
    'Aktien verstehen':                   'Understanding Stocks',
    'Anleihen & sichere Häfen':           'Bonds & Safe Havens',
    'Rebalancing':                        'Rebalancing',

    // Immobilien-Kurs Lektionstitel
    'Mieten vs. Kaufen':                  'Renting vs. Buying',
    'Kaufnebenkosten':                    'Purchase Ancillary Costs',
    'Wie eine Hypothek funktioniert':     'How a Mortgage Works',
    'Eigenkapital & Beleihung':           'Equity & Loan-to-Value',
    'Immobilie als Investment':           'Real Estate as Investment',
    'Laufende Kosten':                    'Ongoing Costs',
    'Kaufvertrag prüfen':                 'Reviewing the Purchase Contract',
    'Selbst bewohnen oder vermieten?':    'Live in It or Rent It Out?',

    // Renten-Kurs Lektionstitel
    'Das 3-Säulen-Modell':               'The 3-Pillar Model',
    'Die gesetzliche Rentenversicherung': 'The Statutory Pension Insurance',
    'Die Rentenlücke':                    'The Pension Gap',
    'Betriebliche Altersvorsorge (bAV)':  'Company Pension (bAV)',
    'Riester-Rente':                      'Riester Pension',
    'Rürup-Rente':                        'Rürup Pension',
    'ETF-Depot als private Vorsorge':     'ETF Portfolio as Private Provision',
    'Dein Altersvorsorge-Plan':           'Your Retirement Plan',

    // Schulden-Kurs Lektionstitel
    'Gute vs. schlechte Schulden':        'Good vs. Bad Debt',
    'Wie Zinsen wirklich funktionieren':  'How Interest Really Works',
    'Die Schneeball-Methode':             'The Snowball Method',
    'Kreditkarten richtig nutzen':        'Using Credit Cards Correctly',
    'Ratenkredit vs. Dispokredit':        'Installment Credit vs. Overdraft',
    'Schufa verstehen':                   'Understanding Credit Scores',
    'Umschuldung & Refinanzierung':       'Refinancing & Debt Restructuring',
    'Der Weg zur Schuldenfreiheit':       'The Path to Debt Freedom',

    // Steuern-Kurs Lektionstitel
    'Warum Steuern verstehen lohnt':      'Why Understanding Taxes Pays Off',
    'Werbungskosten absetzen':            'Deducting Work-Related Expenses',
    'Sonderausgaben & außergewöhnliche Belastungen': 'Special Expenses & Extraordinary Burdens',
    'Kapitalerträge & Abgeltungssteuer':  'Capital Gains & Withholding Tax',
    'Steuervorteile für Immobilien':      'Tax Benefits for Real Estate',
    'Altersvorsorge & Steuern':           'Retirement & Taxes',
    'Steuererklärung mit ELSTER':         'Tax Return with ELSTER',
    '5 meistübersehene Steuerposten':     '5 Most Overlooked Tax Items',

    // Zinseszins-Kurs Lektionstitel
    'Was ist Zinseszins?':                'What is Compound Interest?',
    'Die Zinseszins-Formel':              'The Compound Interest Formula',
    'Zeit ist dein wichtigstes Asset':    'Time is Your Most Important Asset',
    'Die 72er-Regel':                     'The Rule of 72',
    'Zinseszins bei Sparplänen':          'Compound Interest with Savings Plans',
    'Negativer Zinseszins – die Schuldenfalle': 'Negative Compound Interest – The Debt Trap',
    'Zinseszins vs. Inflation':           'Compound Interest vs. Inflation',
    'Zinseszins für sich arbeiten lassen': 'Putting Compound Interest to Work',

    // ── Kurs-Untertitel ─────────────────────────────────
    'Geld ist kein Zaubertrick – es ist Vertrauen in Papierform.':
      'Money is no magic trick – it\'s trust in paper form.',
    'Heute kostet ein Kaffee 3€. In 10 Jahren vielleicht 4€.':
      'Today a coffee costs €3. In 10 years maybe €4.',
    'Banken erschaffen buchstäblich Geld.': 'Banks literally create money.',
    'Nicht alle Konten sind gleich.':     'Not all accounts are the same.',
    'Albert Einstein soll ihn so genannt haben.': 'Albert Einstein allegedly called it that.',
    'Das Finanzamt möchte auch ein Stück.': 'The tax office wants a piece too.',
    'Wer nicht weiß wohin sein Geld fließt, wundert sich.':
      'Those who don\'t know where their money goes are always surprised.',
    'Nicht Wissen – Handeln macht den Unterschied.':
      'Not knowledge – action makes the difference.',
    'Das Sparbuch ist kein Freund mehr.':  'The savings account is no longer your friend.',
    'Bevor du investierst, brauche dieses Sicherheitsnetz.':
      'Before you invest, you need this safety net.',
    'Der Unterschied kann dich überraschen.': 'The difference might surprise you.',
    'Wenn Preise fallen, ist das nicht immer gut.':
      'When prices fall, that\'s not always good.',
    '1 Euro = wie viel Dollar eigentlich?': '1 Euro = how many dollars exactly?',
    'Welche Anlageklasse passt zu dir?':   'Which asset class suits you?',
    'Dein Gehirn ist kein rationaler Investor.': 'Your brain is not a rational investor.',
    '1.000€ steuerfrei – aber nur wenn du es richtig machst.':
      '€1,000 tax-free – but only if you do it right.',
    'Revolut, N26, Trade Republic – was steckt dahinter?':
      'Revolut, N26, Trade Republic – what\'s behind them?',
    'Geld das nicht arbeitet, kostet dich Geld.':
      'Money that doesn\'t work costs you money.',
    'Vom Chaos zur Klarheit – so geht\'s.': 'From chaos to clarity – here\'s how.',
    'Was dich von 95% der Menschen unterscheidet.':
      'What sets you apart from 95% of people.',
    'Exchange Traded Fund – ein Korb voller Aktien zu Mini-Kosten.':
      'Exchange Traded Fund – a basket of stocks at minimal cost.',
    'Was ist der Unterschied – und warum gewinnen ETFs meistens?':
      'What\'s the difference – and why do ETFs usually win?',
    '1.400+ Unternehmen aus 23 Ländern in einem einzigen ETF.':
      '1,400+ companies from 23 countries in a single ETF.',
    '0,2% klingt wenig – über 30 Jahre kostet es Tausende.':
      '0.2% sounds small – over 30 years it costs thousands.',
    'Reinvestieren oder auszahlen lassen – was ist besser?':
      'Reinvest or pay out – which is better?',
    'Ab 1€ automatisch investieren – so geht passives Investieren.':
      'Automatically invest from €1 – this is passive investing.',
    'Warum ein ETF sicherer ist als 10 Einzelaktien.':
      'Why an ETF is safer than 10 individual stocks.',
    'Broker wählen, ETF auswählen, Sparplan starten – in 3 Schritten.':
      'Choose broker, select ETF, start savings plan – in 3 steps.',
    'Finanzielle Unabhängigkeit ist Mathematik, kein Traum.':
      'Financial independence is math, not a dream.',
    'Die Grundformel der FIRE-Bewegung.':  'The basic formula of the FIRE movement.',
    'Nicht dein Gehalt entscheidet – was du behältst.':
      'Not your salary decides – what you keep.',
    'Jeden Euro den du nicht ausgibst, musst du 25× nicht ansparen.':
      'Every euro you don\'t spend, you don\'t need to save 25× over.',
    'Das FIRE-Portfolio – simpel und effektiv.':
      'The FIRE portfolio – simple and effective.',
    'Sparen hat eine Grenze. Einnahmen nicht.':
      'Saving has a limit. Income doesn\'t.',
    'Der oft unterschätzte Teil.':         'The often underestimated part.',
    'Der gefährlichste Feind des Frührentners.':
      'The most dangerous enemy of the early retiree.',
    'Sparen allein macht nicht reich.':    'Saving alone won\'t make you rich.',
    'Kein Risiko, keine Rendite – aber Diversifikation hilft.':
      'No risk, no return – but diversification helps.',
    'Die wichtigste Erfindung für private Anleger.':
      'The most important invention for private investors.',
    'Das Konto für deine Wertpapiere.':   'The account for your securities.',
    '25€ im Monat reichen zum Starten.':   '€25 per month is enough to start.',
    'Mit einer Aktie wirst du Miteigentümer.': 'With a stock you become a co-owner.',
    'Nicht alles muss riskant sein.':      'Not everything has to be risky.',
    'Das Portfolio einmal jährlich anpassen.': 'Adjust the portfolio once a year.',
    'Es gibt keine universelle Antwort – nur Rechnung.':
      'There\'s no universal answer – only math.',
    '7–12% on top – die vergessen viele.':
      '7–12% on top – many people forget this.',
    'Die meisten wissen nicht was sie unterschreiben.':
      'Most people don\'t know what they\'re signing.',
    'Je mehr Eigenkapital, desto bessere Konditionen.':
      'The more equity, the better the terms.',
    'Vermietung kann sich lohnen – oder nicht.':
      'Renting out can pay off – or not.',
    'Eigentümer zahlen mehr als nur die Hypothek.':
      'Owners pay more than just the mortgage.',
    'Nie blind unterschreiben.':           'Never sign blindly.',
    'Zwei Logiken, zwei Rechnungen.':      'Two logics, two calculations.',
    'Die gesetzliche Rente ist nur eine von drei Säulen.':
      'The statutory pension is just one of three pillars.',
    'Umlageverfahren: Die Jungen zahlen für die Alten.':
      'Pay-as-you-go: The young pay for the old.',
    'Was die gesetzliche Rente wirklich zahlt – ein Schockmoment.':
      'What the statutory pension really pays – a shocking moment.',
    'Dein Arbeitgeber zahlt mit – wenn du es richtig machst.':
      'Your employer pays too – if you do it right.',
    'Staatliche Förderung – aber für wen lohnt sie sich wirklich?':
      'State subsidies – but who does it really pay off for?',
    'Besonders interessant für Selbstständige und Gutverdiener.':
      'Particularly interesting for the self-employed and high earners.',
    'Flexibler als Versicherungen – und oft rentabler.':
      'More flexible than insurance – and often more profitable.',
    'Wie du jetzt anfängst – in 3 konkreten Schritten.':
      'How to start now – in 3 concrete steps.',
    'Nicht jede Schuld ist gleich schlecht.': 'Not every debt is equally bad.',
    'Kleine Zinsen, große Wirkung über Zeit.': 'Small interest, big effect over time.',
    'Psychologie schlägt manchmal Mathematik.': 'Psychology sometimes beats mathematics.',
    'Kreditkarten sind ein Werkzeug – nicht der Feind.':
      'Credit cards are a tool – not the enemy.',
    'Welcher Kredit für welchen Zweck?':   'Which credit for which purpose?',
    'Dein finanzieller Lebenslauf.':       'Your financial CV.',
    'Alte Schulden günstiger machen.':     'Making old debts cheaper.',
    'Ein Plan schlägt Willenskraft.':      'A plan beats willpower.',
    'Das Finanzamt erklärt dir nicht wie du Geld sparen kannst.':
      'The tax office won\'t explain how to save money.',
    'Alles was du für die Arbeit ausgibst.': 'Everything you spend on work.',
    'Versicherungen, Spenden und mehr.':   'Insurance, donations and more.',
    'Das Finanzamt mitverdienen lassen – oder nicht.':
      'Let the tax office share the gains – or not.',
    'Vermieter haben viele Hebel.':        'Landlords have many levers.',
    'Der Staat fördert Vorsorge.':         'The state promotes retirement savings.',
    'Kostenlos, sicher, einfacher als du denkst.':
      'Free, secure, easier than you think.',
    'Geld das die meisten liegenlassen.':  'Money most people leave on the table.',
    'Zinsen auf Zinsen – das Prinzip hinter jedem Vermögen.':
      'Interest on interest – the principle behind every fortune.',
    'K × (1 + p)ⁿ – so berechnest du dein zukünftiges Kapital.':
      'K × (1 + p)ⁿ – this is how you calculate your future capital.',
    '10 Jahre früher starten macht einen riesigen Unterschied.':
      'Starting 10 years earlier makes a huge difference.',
    'Mit einer simplen Rechnung weißt du wann sich dein Geld verdoppelt.':
      'With a simple calculation you know when your money will double.',
    'Monatlich 100€ können zu echtem Reichtum werden.':
      '€100 per month can grow into real wealth.',
    'Zinseszins wirkt auch gegen dich – bei Krediten und Dispokonto.':
      'Compound interest also works against you – with loans and overdrafts.',
    'Auf dem Sparbuch verlierst du trotz Zinsen – warum?':
      'You lose on your savings account despite interest – why?',
    'Wie du den Effekt maximal nutzt – heute noch.':
      'How to maximally use the effect – starting today.',

    // ── Quiz-Fragen ─────────────────────────────────────
    'Warum ist Geld nützlicher als direkter Tauschhandel?':
      'Why is money more useful than direct barter?',
    'Was passiert mit deiner Kaufkraft wenn die Inflation steigt?':
      'What happens to your purchasing power when inflation rises?',
    'Wie verdienen Banken hauptsächlich Geld?':
      'How do banks mainly make money?',
    'Was ist ein Dispokredit?':            'What is an overdraft facility?',
    'Was verdoppelt die Kraft des Zinseszinses am meisten?':
      'What most doubles the power of compound interest?',
    'Wie hoch ist der Sparerpauschbetrag für eine Einzelperson?':
      'How high is the saver\'s allowance for an individual?',
    'Wie viel sieht die 50/30/20-Regel fürs Sparen vor?':
      'How much does the 50/30/20 rule allocate for saving?',
    'Was sollte man laut dem 3-Schritte-Plan zuerst aufbauen?':
      'What should you build first according to the 3-step plan?',
    'Was passiert mit 10.000€ auf dem Sparbuch bei 3% Inflation und 0% Zinsen?':
      'What happens to €10,000 in a savings account with 3% inflation and 0% interest?',
    'Wie viel sollte ein Notgroschen idealerweise betragen?':
      'How much should an emergency fund ideally be?',
    'Was ist der Bruttolohn?':             'What is the gross salary?',
    'Warum ist Deflation für eine Wirtschaft gefährlich?':
      'Why is deflation dangerous for an economy?',
    'Was beeinflusst Wechselkurse?':       'What influences exchange rates?',
    'Was bedeutet "Liquidität" bei Anlagen?': 'What does "liquidity" mean for investments?',
    'Was beschreibt "Loss Aversion"?':     'What describes "Loss Aversion"?',
    'Was passiert ohne Freistellungsauftrag?': 'What happens without a tax exemption order?',
    'Bis zu welchem Betrag sind Bankeinlagen in Deutschland gesetzlich geschützt?':
      'Up to what amount are bank deposits legally protected in Germany?',
    'Was sind Opportunitätskosten?':       'What are opportunity costs?',
    'Welchen Schritt sollte man VOR dem Investieren erledigen?':
      'Which step should you complete BEFORE investing?',
    'Was ist laut diesem Kurs der wichtigste Faktor beim Vermögensaufbau?':
      'What is the most important factor in wealth building according to this course?',
    'Was bildet ein ETF nach?':            'What does an ETF replicate?',
    'Wie viele aktiv verwaltete Fonds schlagen langfristig ihren Vergleichsindex?':
      'How many actively managed funds beat their benchmark index in the long run?',
    'Aus wie vielen Ländern ungefähr stammen die Unternehmen im MSCI World?':
      'From approximately how many countries do the companies in the MSCI World come from?',
    'Was bedeutet TER bei einem ETF?':     'What does TER mean for an ETF?',
    'Welcher ETF-Typ eignet sich besser für den Vermögensaufbau über viele Jahre?':
      'Which ETF type is better suited for wealth building over many years?',
    'Was ist der Cost-Averaging-Effekt beim ETF-Sparplan?':
      'What is the cost-averaging effect with an ETF savings plan?',
    'Warum ist ein ETF auf 1.400 Unternehmen sicherer als 3 Einzelaktien?':
      'Why is an ETF covering 1,400 companies safer than 3 individual stocks?',
    'Was bedeutet das Akronym FIRE?':      'What does the acronym FIRE stand for?',
    'Wie berechnet man die FIRE-Zahl?':    'How do you calculate the FIRE number?',
    'Was passiert wenn man die Sparrate von 10% auf 50% erhöht?':
      'What happens when you increase the savings rate from 10% to 50%?',
    'Was bedeuten die 25× bei FIRE?':      'What do the 25× mean in FIRE?',
    'Was ist laut FIRE-Community das effektivste Portfolio?':
      'What is the most effective portfolio according to the FIRE community?',
    'Was ist Lifestyle Inflation?':        'What is lifestyle inflation?',
    'Warum BU-Versicherung VOR FIRE abschließen?':
      'Why take out disability insurance BEFORE FIRE?',
    'Was passiert mit Geld das nur auf dem Sparkonto liegt?':
      'What happens to money that just sits in a savings account?',
    'Was reduziert das Risiko am effektivsten?':
      'What reduces risk most effectively?',
    'Was ist ein Wertpapierdepot?':        'What is a securities depot?',
    'Was beschreibt den Cost-Averaging-Effekt?':
      'What describes the cost-averaging effect?',
    'Was ist der Unterschied zwischen Kursgewinn und Dividende?':
      'What is the difference between capital gain and dividend?',
    'Was ist eine Anleihe?':               'What is a bond?',
    'Was sagt ein Kaufpreisfaktor von 35 aus?':
      'What does a purchase price factor of 35 indicate?',
    'Welche Nebenkosten fallen beim Immobilienkauf NICHT an?':
      'Which ancillary costs are NOT incurred when buying a property?',
    'Was ist der Tilgungssatz?':           'What is the repayment rate?',
    'Was sollte mindestens aus Eigenkapital finanziert werden?':
      'What should be financed from equity at minimum?',
    'Wie berechnet man die Bruttomietrendite?':
      'How do you calculate the gross rental yield?',
    'Wie viel sollte man jährlich für Instandhaltung einplanen?':
      'How much should you budget annually for maintenance?',
    'Was sollte man VOR dem Unterschreiben unbedingt prüfen?':
      'What should you absolutely check BEFORE signing?',
    'Wie viele Säulen hat das deutsche Altersvorsorgesystem?':
      'How many pillars does the German pension system have?',
    'Wie wird die gesetzliche Rente in Deutschland finanziert?':
      'How is the statutory pension in Germany financed?',
    'Was beschreibt die "Rentenlücke"?':   'What describes the "pension gap"?',
    'Was ist "Entgeltumwandlung" bei der bAV?':
      'What is "salary conversion" in the company pension?',
    'Wie hoch ist die Grundzulage bei der Riester-Rente pro Jahr?':
      'How high is the basic allowance for the Riester pension per year?',
    'Für wen ist die Rürup-Rente besonders geeignet?':
      'For whom is the Rürup pension particularly suitable?',
    'Was ist ein Vorteil des ETF-Depots gegenüber Rentenversicherungen?':
      'What is an advantage of the ETF portfolio over pension insurance?',
    'Welche Schulden gelten als "gut"?':   'Which debts are considered "good"?',
    'Was zeigt der effektive Jahreszins?': 'What does the effective annual interest rate show?',
    'Bei welcher Methode tilgst du zuerst die Schuld mit den höchsten Zinsen?':
      'Which method do you use to pay off the debt with the highest interest first?',
    'Was ist die wichtigste Regel bei Kreditkarten?':
      'What is the most important rule with credit cards?',
    'Was ist teurer – Dispo oder Ratenkredit?':
      'What is more expensive – overdraft or installment credit?',
    'Was beeinflusst den Schufa-Score NICHT?':
      'What does NOT affect the credit score?',
    'Was ist der Hauptvorteil einer Umschuldung?':
      'What is the main advantage of debt restructuring?',
    'Wie viele Deutsche geben freiwillig eine Steuererklärung ab?':
      'How many Germans voluntarily file a tax return?',
    'Wie hoch ist die Homeoffice-Pauschale pro Tag?':
      'How high is the home office flat rate per day?',
    'Was gehört zu den Sonderausgaben?':   'What counts as special expenses?',
    'Was muss man bei der Bank einrichten für steuerfreie Erträge bis 1.000€?':
      'What do you need to set up at the bank for tax-free income up to €1,000?',
    'Was bedeutet AfA bei Immobilien?':    'What does AfA mean for real estate?',
    'Bis wann muss die Steuererklärung ohne Steuerberater abgegeben werden?':
      'By when must the tax return be submitted without a tax advisor?',
    'Was unterscheidet Zinseszins von einfachen Zinsen?':
      'What distinguishes compound interest from simple interest?',
    'Was ist "n" in der Zinseszins-Formel K_n = K_0 × (1 + p)ⁿ?':
      'What is "n" in the compound interest formula K_n = K_0 × (1 + p)ⁿ?',
    'Warum schneidet Anna trotz weniger eingezahltem Geld besser ab als Bernd?':
      'Why does Anna perform better than Bernd despite paying in less money?',
    'Wie lange dauert es bei 6% Zinsen, bis sich ein Kapital verdoppelt (72er-Regel)?':
      'How long does it take at 6% interest for capital to double (Rule of 72)?',
    'Wie viel Endkapital ergibt ein Sparplan von 100€/Monat bei 7% über 30 Jahre (ca.)?':
      'How much final capital does a savings plan of €100/month at 7% over 30 years yield (approx.)?',
    'Welche Strategie beim Schuldenabbau ist mathematisch optimal?':
      'Which debt repayment strategy is mathematically optimal?',
    'Was bedeutet "reale Rendite"?':       'What does "real return" mean?',

    // ── Quiz-Antwortoptionen ─────────────────────────────
    'Es ist schwerer zu transportieren':  'It is harder to transport',
    'Es funktioniert als universelles Tauschmittel': 'It works as a universal medium of exchange',
    'Es riecht besser als Fisch':         'It smells better than fish',
    'Es wird von der Regierung erfunden':  'It is invented by the government',
    'Sie sinkt':                          'It decreases',
    'Sie steigt':                         'It increases',
    'Sie bleibt gleich':                  'It stays the same',
    'Sie verdoppelt sich':                'It doubles',
    'Durch Gebühren allein':              'Through fees alone',
    'Durch Goldverkäufe':                 'Through gold sales',
    'Durch staatliche Zuschüsse':         'Through government subsidies',
    'Durch den Unterschied zwischen Kredit- und Einlagenzinsen':
      'Through the difference between lending and deposit rates',
    'Ein kostenloses Extra':              'A free extra',
    'Ein Sparkonto':                      'A savings account',
    'Ein Überziehungskredit mit hohen Zinsen': 'An overdraft with high interest rates',
    'Eine staatliche Förderung':          'A government subsidy',
    'Ein höherer Anfangsbetrag':          'A higher starting amount',
    'Mehr Zeit im Markt':                 'More time in the market',
    'Häufigeres Umschichten':             'More frequent rebalancing',
    'Höhere Risikobereitschaft':          'Higher risk tolerance',
    'Sie verlieren Kaufkraft':            'They lose purchasing power',
    'Sie werden mehr wert':               'They become more valuable',
    'Das Geld verschwindet':              'The money disappears',
    '1 Wochenlohn':                       '1 week\'s salary',
    '1 Monatslohn':                       '1 month\'s salary',
    '3–6 Monatsgehälter':                 '3–6 months\' salary',
    '1 Jahresgehalt':                     '1 year\'s salary',
    'Der Lohn nach allen Abzügen':        'The salary after all deductions',
    'Das monatliche Nettoeinkommen':      'The monthly net income',
    'Das Gehalt vor Steuern und Abgaben': 'The salary before taxes and deductions',
    'Der Mindestlohn':                    'The minimum wage',
    'Weil Güter zu teuer werden':         'Because goods become too expensive',
    'Weil Zinsen steigen':                'Because interest rates rise',
    'Weil Banken schließen':              'Because banks close',
    'Weil Menschen weniger kaufen und die Wirtschaft schrumpft':
      'Because people buy less and the economy shrinks',
    'Angebot und Nachfrage nach Währungen weltweit': 'Supply and demand for currencies worldwide',
    'Nur die EZB':                        'Only the ECB',
    'Nur das Wirtschaftswachstum':        'Only economic growth',
    'Die Wettervorhersage':               'The weather forecast',
    'Hohe Rendite':                       'High return',
    'Niedriges Risiko':                   'Low risk',
    'Steuerfreie Erträge':                'Tax-free returns',
    'Wie schnell man eine Anlage in Cash umwandeln kann':
      'How quickly you can convert an investment into cash',
    'Man liebt Verluste':                 'One loves losses',
    'Verluste fühlen sich stärker an als gleich große Gewinne':
      'Losses feel stronger than equal gains',
    'Man meidet alle Risiken':            'One avoids all risks',
    'Man investiert nur in sichere Anlagen': 'One only invests in safe assets',
    'Nichts – die Bank weiß Bescheid':    'Nothing – the bank knows',
    'Die Bank behält automatisch Steuern ein': 'The bank automatically withholds taxes',
    'Man zahlt weniger Steuern':          'You pay less taxes',
    'Das Konto wird gesperrt':            'The account is blocked',
    'Bankgebühren':                       'Bank fees',
    'Steuerliche Verluste':               'Tax losses',
    'Der Wert der entgangenen Alternativen': 'The value of foregone alternatives',
    'Inflation':                          'Inflation',
    'Aktien analysieren':                 'Analyze stocks',
    'Ein Hauskauf planen':                'Plan a house purchase',
    'Eine Steuerberatung buchen':         'Book a tax consultation',
    'Einen Notgroschen aufbauen':         'Build up an emergency fund',
    'Hohes Gehalt':                       'High salary',
    'Geheimtipps kennen':                 'Knowing insider tips',
    'Die perfekte Aktie finden':          'Finding the perfect stock',
    'Früh starten und konsequent bleiben': 'Starting early and staying consistent',
    'Einen Index':                        'An index',
    'Einzelne Aktien':                    'Individual stocks',
    'Rohstoffe':                          'Commodities',
    'Immobilien':                         'Real estate',
    'Ca. 15%':                            'Approx. 15%',
    'Ca. 30%':                            'Approx. 30%',
    'Ca. 50%':                            'Approx. 50%',
    'Über 90%':                           'Over 90%',
    'Total Expense Ratio (Gesamtkostenquote)': 'Total Expense Ratio (overall cost rate)',
    'Thesaurierender ETF':                'Accumulating ETF',
    'Ausschüttender ETF':                 'Distributing ETF',
    'Aktiv verwalteter Fonds':            'Actively managed fund',
    'Beide sind identisch':               'Both are identical',
    'Bei niedrigen Kursen kauft man automatisch mehr Anteile':
      'At low prices you automatically buy more shares',
    'Breite Streuung minimiert das Einzelunternehmensrisiko':
      'Broad diversification minimizes single company risk',
    'Financial Independence, Retire Early': 'Financial Independence, Retire Early',
    'Fast Income Reinvestment Engine':    'Fast Income Reinvestment Engine',
    'Free Interest Rate Exchange':        'Free Interest Rate Exchange',
    'Fixed Income Real Estate':           'Fixed Income Real Estate',
    'Jahresausgaben × 25':               'Annual expenses × 25',
    'Monatliche Ausgaben × 12':          'Monthly expenses × 12',
    'Wunschrente × 12':                  'Target pension × 12',
    'Zeit sinkt von ~43 auf ~17 Jahre':   'Time drops from ~43 to ~17 years',
    'Zeit halbiert sich':                 'Time halves',
    'Zeit bleibt gleich':                 'Time stays the same',
    'Gehalt steigt sofort':               'Salary rises immediately',
    'Jeden Euro den du nicht ausgibst, musst du 25× nicht ansparen':
      'Every euro you don\'t spend, you don\'t need to save 25× over',
    'Ausgaben die mit dem Gehalt proportional steigen':
      'Expenses that rise proportionally with salary',
    'Mehr verdienen aber gleichzeitig mehr ausgeben':
      'Earning more but also spending more at the same time',
    'Alle Ausgaben sofort auf null':      'All expenses to zero immediately',
    'Danach günstiger':                   'Cheaper after',
    'Danach illegal':                     'Illegal after',
    'Danach kein Beruf mehr absicherbar und höhere Prämien':
      'No longer insurable and higher premiums after',
    'Breiter ETF-Sparplan langfristig':   'Broad ETF savings plan long-term',
    'Aktien und Gold':                    'Stocks and gold',
    'Alles in Immobilien investieren':    'Invest everything in real estate',
    'Tagesgeld und Festgeld':             'Overnight money and fixed deposits',
    'Inflation frisst stilles Geld – realer Verlust':
      'Inflation eats silent money – real loss',
    'Es wächst auf 20.000€':             'It grows to €20,000',
    'Es bleibt bei 10.000€':             'It stays at €10,000',
    'Es verdoppelt sich':                 'It doubles',
    'Ein Konto nur für Wertpapiere':      'An account only for securities',
    'Ein Sparkonto mit Rendite':          'A savings account with returns',
    'Ein Konto wo Aktien, ETFs etc. verwahrt werden':
      'An account where stocks, ETFs etc. are held',
    'Ein staatliches Investitionskonto':  'A government investment account',
    'Immer zum günstigen Kurs kaufen':    'Always buy at a low price',
    'Durch regelmäßiges Kaufen wird der Durchschnittspreis ausgeglichen':
      'Through regular buying the average price is balanced out',
    'Rabatt bei Großeinkäufen':           'Discount on bulk purchases',
    'Kurse vorhersagen':                  'Predict prices',
    'Kursgewinn entsteht durch Wertsteigerung, Dividende durch Ausschüttung':
      'Capital gain arises from appreciation, dividend from distribution',
    'Beides ist dasselbe':                'Both are the same',
    'Dividende ist steuerfrei':           'Dividend is tax-free',
    'Kursgewinn ist verboten':            'Capital gain is forbidden',
    'Ein Darlehen an Staat oder Unternehmen mit Rückzahlung und Zinsen':
      'A loan to a government or company with repayment and interest',
    'Ein Aktienanteil':                   'A share of stock',
    'Ein Rohstoffzertifikat':             'A commodity certificate',
    'Ein Immobilienfonds':                'A real estate fund',
    'Das Verhältnis Kaufpreis zu Jahreskaltmiete':
      'The ratio of purchase price to annual cold rent',
    'Hohe Rendite bei Vermietung':        'High return from renting',
    'Günstige Finanzierung':              'Cheap financing',
    'Gute Lage':                          'Good location',
    'Mehrwertsteuer':                     'VAT',
    'Grunderwerbsteuer':                  'Property transfer tax',
    'Notarkosten':                        'Notary fees',
    'Maklerprovision':                    'Estate agent commission',
    'Anteil der monatlichen Rate der zurückgezahlten Schuld':
      'Share of the monthly payment that repays the debt',
    'Der Zinssatz des Kredits':           'The interest rate of the loan',
    'Die Laufzeit des Kredits':           'The term of the loan',
    'Die monatliche Rate':                'The monthly installment',
    'Mindestens die Nebenkosten':         'At least the ancillary costs',
    'Gar kein Eigenkapital':              'No equity at all',
    'Maximal 10%':                        'At most 10%',
    '100%':                               '100%',
    'Jahreskaltmiete ÷ Kaufpreis × 100': 'Annual cold rent ÷ purchase price × 100',
    'Kaufpreis ÷ Jahreskaltmiete':       'Purchase price ÷ annual cold rent',
    'Monatliche Miete × 12':             'Monthly rent × 12',
    'Kaufpreis ÷ monatliche Miete':      'Purchase price ÷ monthly rent',
    '0,5% pro Jahr':                     '0.5% per year',
    '1–1,5% pro Jahr':                   '1–1.5% per year',
    '5% pro Jahr':                       '5% per year',
    '10% pro Jahr':                      '10% per year',
    'Grundbuch, alle Kosten und ggf. Sachverständigengutachten':
      'Land register, all costs and possibly an expert report',
    'Nur den Preis verhandeln':           'Just negotiate the price',
    'Den Architekturstil prüfen':         'Check the architectural style',
    'Die Farbe der Wände':                'The color of the walls',
    '3 Säulen':                          '3 pillars',
    '2 Säulen':                          '2 pillars',
    '4 Säulen':                          '4 pillars',
    'Eine Säule':                         'One pillar',
    'Kapitaldeckungsverfahren':           'Funded system',
    'Umlageverfahren':                    'Pay-as-you-go system',
    'Steuerfinanziert':                   'Tax-financed',
    'Privatwirtschaftlich':               'Private sector',
    'Wunschrente minus gesetzliche Rente': 'Target pension minus statutory pension',
    'Aktuelles Gehalt minus Rentenbeitrag': 'Current salary minus pension contribution',
    'Gesamtes Vermögen':                  'Total assets',
    'Gesetzliche Rente allein':           'Statutory pension alone',
    'Bruttolohn direkt in Rente umwandeln': 'Convert gross salary directly into pension',
    'Nettolohn in ETF investieren':       'Invest net salary in ETF',
    'Aktien kaufen':                      'Buy stocks',
    'Sparbuch anlegen':                   'Open a savings account',
    '175€ pro Jahr':                      '€175 per year',
    '300€ pro Jahr':                      '€300 per year',
    '500€ pro Jahr':                      '€500 per year',
    '1.000€ pro Jahr':                    '€1,000 per year',
    'Für Selbstständige':                 'For the self-employed',
    'Für alle':                           'For everyone',
    'Für Studenten':                      'For students',
    'Für Rentner':                        'For retirees',
    'Flexibel und vererbbar':             'Flexible and inheritable',
    'Garantierte Rendite':                'Guaranteed return',
    'Staatliche Förderung':               'Government subsidy',
    'Keine Kosten':                       'No costs',
    'Bildungskredit für ein Studium':     'Education loan for studies',
    'Autokredit für ein neues Fahrzeug':  'Car loan for a new vehicle',
    'Konsumkredit für Urlaub':            'Consumer credit for a holiday',
    'Kreditkartenschulden':               'Credit card debt',
    'Den Gesamtzins inklusive aller Nebenkosten':
      'The total interest including all ancillary costs',
    'Den monatlichen Zinssatz':           'The monthly interest rate',
    'Den Nominalzins vor Kosten':         'The nominal interest before costs',
    'Den staatlich garantierten Maximalzins': 'The state-guaranteed maximum interest rate',
    'Avalanche-Methode':                  'Avalanche Method',
    'Schneeball-Methode':                 'Snowball Method',
    'Beide gleich gut':                   'Both equally good',
    'Raten-Methode':                      'Installment Method',
    'Immer den vollen Betrag monatlich zahlen':
      'Always pay the full amount monthly',
    'Möglichst wenig zahlen':             'Pay as little as possible',
    'Die Karte für Großeinkäufe nutzen':   'Use the card for large purchases',
    'Zinsen akzeptieren':                 'Accept interest',
    'Dispo ist teurer':                   'Overdraft is more expensive',
    'Ratenkredit ist teurer':             'Installment credit is more expensive',
    'Gehalt':                             'Salary',
    'Wohnort':                            'Place of residence',
    'Zahlungsverhalten und offene Schulden': 'Payment behavior and outstanding debts',
    'Alter':                              'Age',
    'Niedrigerer Zinssatz für den gleichen Kredit':
      'Lower interest rate for the same loan',
    'Schnellere Rückzahlung':             'Faster repayment',
    'Mehr Kreditsumme':                   'More loan amount',
    'Kreditfreiheit':                     'Credit freedom',
    'Nur ~55% geben ab – dabei bekommen ~90% Geld zurück':
      'Only ~55% file – yet ~90% get money back',
    'Fast alle':                          'Almost everyone',
    'Nur Selbstständige':                 'Only the self-employed',
    'Niemand freiwillig':                 'Nobody voluntarily',
    '6€ pro Tag':                         '€6 per day',
    '10€ pro Tag':                        '€10 per day',
    '20€ pro Tag':                        '€20 per day',
    '50€ pauschal':                       '€50 flat rate',
    'Kranken- und Pflegeversicherungsbeiträge':
      'Health and long-term care insurance contributions',
    'Nur Spenden':                        'Only donations',
    'Nur Kirchensteuer':                  'Only church tax',
    'Nur Riester-Beiträge':              'Only Riester contributions',
    'Den Freistellungsauftrag':           'The tax exemption order',
    'Eine Steuernummer':                  'A tax number',
    'Einen Sparplan':                     'A savings plan',
    'Ein Festgeldkonto':                  'A fixed deposit account',
    'Absetzung für Abnutzung':            'Depreciation for wear',
    'Steuerbefreiung für Eigennutzer':    'Tax exemption for owner-occupiers',
    'Sonderabschreibung für Neubau':      'Special depreciation for new builds',
    'Mehrwertsteuer auf Mieteinnahmen':   'VAT on rental income',
    '31. Juli':                           'July 31st',
    '31. März':                           'March 31st',
    '31. Dezember':                       'December 31st',
    '28. Februar':                        'February 28th',
    'Zinsen auf Zinsen werden berechnet': 'Interest is calculated on interest',
    'Zinsen bleiben immer gleich':        'Interest always stays the same',
    'Zinsen werden jährlich ausgezahlt':  'Interest is paid out annually',
    'Zinsen werden nie reinvestiert':     'Interest is never reinvested',
    'Die Anzahl der Perioden':            'The number of periods',
    'Das Startkapital':                   'The starting capital',
    'Das Endkapital':                     'The end capital',
    'Den Zinssatz':                       'The interest rate',
    'Anna hat früher angefangen':         'Anna started earlier',
    'Anna hat mehr gezahlt':              'Anna paid more',
    'Bernd hatte Pech':                   'Bernd was unlucky',
    'Anna hatte eine höhere Rendite':     'Anna had a higher return',
    '12 Jahre':                           '12 years',
    '6 Jahre':                            '6 years',
    '36 Jahre':                           '36 years',
    '72 Jahre':                           '72 years',
    'Ca. 100.000€':                       'Approx. €100,000',
    'Ca. 36.000€':                        'Approx. €36,000',
    'Ca. 121.000€':                       'Approx. €121,000',
    'Ca. 200.000€':                       'Approx. €200,000',
    'Avalanche: Höchste Zinsen zuerst':   'Avalanche: Highest interest first',
    'Gleichmäßig verteilen':              'Distribute evenly',
    'Kleinste Schuld zuerst':             'Smallest debt first',
    'Gar nicht tilgen':                   'Don\'t repay at all',
    'Nominalrendite minus Inflation':      'Nominal return minus inflation',
    'Rendite nach Steuern':               'Return after taxes',
    'Bruttorende vor Steuern':            'Gross return before taxes',
    'Rendite plus Inflation':             'Return plus inflation',

    // ── Quiz-Erklärungen ────────────────────────────────
    'Richtig! Geld ist ein universelles Tauschmittel – jeder akzeptiert es, egal was er braucht.':
      'Correct! Money is a universal medium of exchange – everyone accepts it, regardless of what they need.',
    'Korrekt! Steigende Inflation = sinkende Kaufkraft. Dein Geld wird weniger wert.':
      'Correct! Rising inflation = falling purchasing power. Your money becomes less valuable.',
    'Genau! Die Zinsspanne zwischen Einlagen und Krediten ist das Kerngeschäft jeder Bank.':
      'Exactly! The interest rate spread between deposits and loans is the core business of every bank.',
    'Richtig! Der Dispo ist praktisch, aber teuer. 10–15% Zinsen p.a. summieren sich schnell.':
      'Correct! The overdraft is convenient but expensive. 10–15% interest p.a. adds up quickly.',
    'Zeit ist der stärkste Faktor. Wer früh anfängt, gewinnt – auch mit kleinen Beträgen.':
      'Time is the strongest factor. Those who start early win – even with small amounts.',
    'Korrekt! 1.000€ Kapitalerträge pro Jahr sind steuerfrei – aber nur mit Freistellungsauftrag!':
      'Correct! €1,000 in capital gains per year are tax-free – but only with a tax exemption order!',
    'Genau! 20% sparen klingt viel – aber selbst 10% sind ein großer Schritt in die richtige Richtung.':
      'Exactly! 20% saving sounds like a lot – but even 10% is a big step in the right direction.',
    'Richtig! Der Notgroschen ist das Fundament. Ohne Sicherheitsnetz sind alle Investitionen riskanter.':
      'Correct! The emergency fund is the foundation. Without a safety net all investments are riskier.',
    'Kaufkraftverlust ist real – auch wenn die Zahl auf dem Konto gleich bleibt.':
      'Loss of purchasing power is real – even if the number in your account stays the same.',
    '3–6 Monatsgehälter als Puffer – das schützt dich vor teuren Notfallentscheidungen.':
      '3–6 months\' salary as a buffer – this protects you from expensive emergency decisions.',
    'Brutto = vor Abzügen. Netto = was du wirklich bekommst.':
      'Gross = before deductions. Net = what you actually receive.',
    'Deflation → Konsumzurückhaltung → Wirtschaftsabschwung. Ein gefährlicher Teufelskreis.':
      'Deflation → consumer restraint → economic downturn. A dangerous vicious cycle.',
    'Wechselkurse entstehen am freien Markt durch globales Angebot und Nachfrage.':
      'Exchange rates are formed on the free market through global supply and demand.',
    'Liquidität = Verkäuflichkeit. Aktien: hoch liquide. Immobilien: gering liquide.':
      'Liquidity = sellability. Stocks: highly liquid. Real estate: low liquidity.',
    'Loss Aversion: 100€ verlieren schmerzt mehr als 100€ gewinnen freut. Bekannt aus der Forschung von Kahneman & Tversky.':
      'Loss Aversion: losing €100 hurts more than gaining €100 pleases. Known from Kahneman & Tversky\'s research.',
    'Ohne Freistellungsauftrag zieht die Bank automatisch Abgeltungsteuer ab – auch wenn du unter 1.000€ bleibst.':
      'Without a tax exemption order the bank automatically withholds withholding tax – even if you stay below €1,000.',
    '100.000€ pro Person und Bank sind durch die gesetzliche Einlagensicherung geschützt.':
      '€100,000 per person per bank is protected by the statutory deposit guarantee.',
    'Opportunitätskosten sind das was du verlierst, indem du eine Alternative NICHT wählst.':
      'Opportunity costs are what you lose by NOT choosing an alternative.',
    'Notgroschen zuerst – ohne finanziellen Puffer zwingst du dich, im schlimmsten Moment zu verkaufen.':
      'Emergency fund first – without a financial buffer you force yourself to sell at the worst moment.',
    'Richtig! ETFs bilden einen Index nach – und investieren damit automatisch in alle enthaltenen Unternehmen.':
      'Correct! ETFs replicate an index – and thereby automatically invest in all included companies.',
    'Korrekt! Nur etwa 15% der aktiv verwalteten Fonds schlagen langfristig den Index – der Rest schneidet schlechter ab, obwohl sie viel mehr kosten.':
      'Correct! Only about 15% of actively managed funds beat the index in the long run – the rest perform worse despite costing much more.',
    'Richtig! Der MSCI World umfasst Unternehmen aus 23 Industrieländern – das macht ihn so breit diversifiziert.':
      'Correct! The MSCI World covers companies from 23 developed countries – that\'s what makes it so broadly diversified.',
    'Korrekt! TER steht für Total Expense Ratio – die jährliche Kostenquote, die direkt aus dem Fondsvermögen entnommen wird.':
      'Correct! TER stands for Total Expense Ratio – the annual cost ratio taken directly from the fund assets.',
    'Richtig! Thesaurierende ETFs reinvestieren Dividenden automatisch – das maximiert den Zinseszinseffekt und reduziert Steuerfrikation.':
      'Correct! Accumulating ETFs automatically reinvest dividends – this maximizes the compound interest effect and reduces tax friction.',
    'Korrekt! Durch den Cost-Averaging-Effekt kauft man bei niedrigen Kursen automatisch mehr Anteile – der Durchschnittspreis wird optimiert.':
      'Correct! Through the cost-averaging effect you automatically buy more shares at low prices – the average price is optimized.',
    'Genau! Durch die breite Diversifikation in hunderte von Unternehmen fällt das Einzelunternehmensrisiko fast weg – das Marktrisiko bleibt, aber ist kalkulierbar.':
      'Exactly! Through broad diversification into hundreds of companies, single company risk almost disappears – market risk remains but is calculable.',
    'Richtig! Financial Independence, Retire Early – finanzielle Unabhängigkeit, frühzeitiger Ruhestand.':
      'Correct! Financial Independence, Retire Early – financial independence, early retirement.',
    'Korrekt! Jahresausgaben × 25 = FIRE-Zahl. Das ist die Umkehrung der 4%-Entnahmeregel.':
      'Correct! Annual expenses × 25 = FIRE number. This is the inverse of the 4% withdrawal rule.',
    'Richtig! Höhere Sparrate = mehr investiert + weniger Ausgaben im Ruhestand = viel früher FIRE.':
      'Correct! Higher savings rate = more invested + lower expenses in retirement = much earlier FIRE.',
    'Genau! 100€/Jahr Ausgabe = 2.500€ mehr Kapital nötig. Jede Ausgabe kostet 25×.':
      'Exactly! €100/year expense = €2,500 more capital needed. Every expense costs 25×.',
    'Korrekt! Einfach, günstig, breit – ein MSCI World ETF schlägt die Mehrheit der aktiven Strategien.':
      'Correct! Simple, cheap, broad – an MSCI World ETF beats the majority of active strategies.',
    'Richtig! Mehr verdienen aber gleichzeitig mehr ausgeben – der klassische FIRE-Killer.':
      'Correct! Earning more but also spending more – the classic FIRE killer.',
    'Richtig! BU am günstigsten wenn man jung und gesund ist – danach steigen Preis und Ausschlüsse.':
      'Correct! Disability insurance is cheapest when young and healthy – prices and exclusions rise after.',
    'Richtig! Inflation frisst stilles Geld. Wer nicht investiert, verliert real an Kaufkraft.':
      'Correct! Inflation eats silent money. Those who don\'t invest lose real purchasing power.',
    'Korrekt! Diversifikation verteilt das Risiko. Einzelaktien können abstürzen – ein breites Portfolio erholt sich.':
      'Correct! Diversification spreads risk. Individual stocks can crash – a broad portfolio recovers.',
    'Korrekt! Das Depot ist dein "Konto" für Wertpapiere – ohne Depot kein Investieren.':
      'Correct! The depot is your "account" for securities – without a depot no investing.',
    'Genau! Bei niedrigen Kursen kaufst du mehr Anteile – das senkt deinen Durchschnittspreis.':
      'Exactly! At low prices you buy more shares – this lowers your average price.',
    'Richtig! Kursgewinne entstehen wenn der Preis steigt, Dividenden sind direkte Ausschüttungen.':
      'Correct! Capital gains arise when the price rises, dividends are direct distributions.',
    'Korrekt! Du bist der Kreditgeber – der Staat oder das Unternehmen ist dein Schuldner.':
      'Correct! You are the lender – the state or company is your debtor.',
    'Korrekt! Hoher Faktor = viel Kaufpreis im Verhältnis zur Miete. Mieten ist dann oft günstiger.':
      'Correct! High factor = high purchase price relative to rent. Renting is often cheaper then.',
    'Richtig! Auf private Immobilienkäufe fällt keine Mehrwertsteuer an.':
      'Correct! No VAT is levied on private property purchases.',
    'Genau! Höherer Tilgungssatz = schneller schuldenfrei = weniger Zinsen insgesamt.':
      'Exactly! Higher repayment rate = debt-free sooner = less interest overall.',
    'Richtig! Die Nebenkosten aus Eigenkapital ist das Minimum – besser 20–30% des Kaufpreises.':
      'Correct! Paying ancillary costs from equity is the minimum – better 20–30% of the purchase price.',
    'Korrekt! Jahreskaltmiete ÷ Kaufpreis × 100. Die erste Kennzahl für jede Anlageimmobilie.':
      'Correct! Annual cold rent ÷ purchase price × 100. The first key figure for every investment property.',
    'Richtig! 1–1,5% als Daumenregel. Bei älteren Immobilien eher mehr.':
      'Correct! 1–1.5% as a rule of thumb. For older properties rather more.',
    'Korrekt! Der Notar ist neutral – er prüft nicht ob der Deal gut für dich ist.':
      'Correct! The notary is neutral – they don\'t check whether the deal is good for you.',
    'Richtig! Gesetzliche Rente, betriebliche Altersvorsorge und private Vorsorge bilden die drei Säulen.':
      'Correct! Statutory pension, company pension and private provision form the three pillars.',
    'Korrekt! Das Umlageverfahren bedeutet: Die heutigen Beitragszahler finanzieren die heutigen Rentner direkt.':
      'Correct! The pay-as-you-go system means: today\'s contributors directly finance today\'s retirees.',
    'Genau! Die Rentenlücke zeigt, wie viel Einkommen im Alter fehlt – und warum private Vorsorge unverzichtbar ist.':
      'Exactly! The pension gap shows how much income is missing in old age – and why private provision is essential.',
    'Richtig! Bei der Entgeltumwandlung wird Bruttolohn direkt in Altersvorsorge umgewandelt – steuer- und sozialabgabengünstig.':
      'Correct! With salary conversion, gross salary is converted directly into retirement provision – tax and social contribution-efficient.',
    'Korrekt! Die Grundzulage beträgt 175€ pro Jahr – plus 300€ je Kind (Geburt ab 2008).':
      'Correct! The basic allowance is €175 per year – plus €300 per child (born from 2008).',
    'Richtig! Die Rürup-Rente ist ideal für Selbstständige ohne gesetzliche Rentenversicherung und für Gutverdiener zur Steueroptimierung.':
      'Correct! The Rürup pension is ideal for the self-employed without statutory pension insurance and for high earners for tax optimization.',
    'Genau! ETF-Depots sind flexibel, transparent und vererbbar – das ist ein klarer Vorteil gegenüber gebundenen Versicherungsprodukten.':
      'Exactly! ETF depots are flexible, transparent and inheritable – a clear advantage over tied insurance products.',
    'Richtig! Bildungsschulden investieren in deine Zukunft und können sich durch höheres Einkommen auszahlen.':
      'Correct! Education debts invest in your future and can pay off through higher income.',
    'Genau! Der EJZ ist die ehrliche Zahl. Immer EJZ vergleichen, nie den kleinen Nominalzins.':
      'Exactly! The effective annual rate is the honest number. Always compare the effective rate, never the nominal rate.',
    'Richtig! Die Avalanche-Methode spart mathematisch am meisten durch Fokus auf hohe Zinsen.':
      'Correct! The avalanche method saves the most mathematically by focusing on high interest.',
    'Korrekt! Nur bei voller monatlicher Rückzahlung fallen keine Zinsen an.':
      'Correct! Only with full monthly repayment are no interest charges incurred.',
    'Der Dispo ist fast immer teurer. Für planbare Ausgaben ist ein Ratenkredit die bessere Wahl.':
      'The overdraft is almost always more expensive. For plannable expenses, an installment credit is the better choice.',
    'Richtig! Das Gehalt fließt nicht in den Schufa-Score ein – nur dein Zahlungsverhalten zählt.':
      'Correct! Salary doesn\'t flow into the credit score – only your payment behavior counts.',
    'Genau! Umschuldung senkt die Zinsbelastung – gleicher Betrag, bessere Konditionen.':
      'Exactly! Debt restructuring lowers the interest burden – same amount, better terms.',
    'Korrekt! Nur ~55% geben ab – dabei bekommen ~90% Geld zurück. Lohnt sich fast immer.':
      'Correct! Only ~55% file – yet ~90% get money back. Almost always worth it.',
    'Richtig! 6€ pro Tag, max. 1.260€/Jahr – ohne Einzelbelege.':
      'Correct! €6 per day, max. €1,260/year – without individual receipts.',
    'Korrekt! Kranken- und Pflegeversicherungsbeiträge sind der wichtigste Sonderausgaben-Posten.':
      'Correct! Health and long-term care insurance contributions are the most important special expenses item.',
    'Genau! Ohne Freistellungsauftrag zieht die Bank automatisch Steuern ab.':
      'Exactly! Without a tax exemption order the bank automatically deducts taxes.',
    'Richtig! AfA = Absetzung für Abnutzung. 2% des Gebäudewerts p.a. steuerlich absetzbar.':
      'Correct! AfA = depreciation for wear. 2% of the building value p.a. tax-deductible.',
    'Korrekt! Selbstständige haben keine gesetzliche Rente – die Rürup-Rente ist ihr wichtigstes Steuersparmodell.':
      'Correct! The self-employed have no statutory pension – the Rürup pension is their most important tax-saving model.',
    'Richtig! Ohne Steuerberater: 31. Juli des Folgejahres. Zu spät = Verspätungszuschlag.':
      'Correct! Without a tax advisor: July 31st of the following year. Too late = late surcharge.',
    'Richtig! Beim Zinseszins wachsen Zinsen auf Zinsen – das ist der entscheidende Unterschied zur einfachen Verzinsung.':
      'Correct! With compound interest, interest grows on interest – that\'s the crucial difference from simple interest.',
    'Korrekt! "n" steht für die Anzahl der Perioden – meistens Jahre. Je größer n, desto mächtiger der Zinseszinseffekt.':
      'Correct! "n" stands for the number of periods – usually years. The larger n, the more powerful the compound interest effect.',
    'Genau! Der frühere Start gibt dem Zinseszins mehr Zeit zu wirken – das schlägt sogar mehr eingezahltes Kapital.':
      'Exactly! The earlier start gives compound interest more time to work – this even beats more capital paid in.',
    'Richtig! 72 ÷ 6 = 12 Jahre. Die 72er-Regel ist eine schnelle und überraschend genaue Faustregel.':
      'Correct! 72 ÷ 6 = 12 years. The Rule of 72 is a quick and surprisingly accurate rule of thumb.',
    'Korrekt! 100€/Monat × 360 Monate = 36.000€ eingezahlt, aber durch den Zinseszins wächst es auf ca. 121.000€.':
      'Correct! €100/month × 360 months = €36,000 paid in, but through compound interest it grows to approx. €121,000.',
    'Richtig! Zuerst die teuerste Schuld zu tilgen spart die meisten Zinsen – das ist die "Avalanche-Methode".':
      'Correct! Paying off the most expensive debt first saves the most interest – that\'s the "Avalanche Method".',
    'Korrekt! Die reale Rendite = nominale Rendite minus Inflation. Nur sie zeigt, ob du wirklich reicher wirst.':
      'Correct! The real return = nominal return minus inflation. Only this shows whether you are truly getting richer.',

    // ── Multiplayer ─────────────────────────────────────
    'Live-Quiz – FinQuest':              'Live Quiz – FinQuest',
    '🎮 Live Multiplayer Quiz':          '🎮 Live Multiplayer Quiz',
    'Finanz-Mythen':                      'Finance Myths',
    'Enttarnt':                           'Debunked',
    'Quiz-Größe wählen':                  'Choose Quiz Size',
    'Wie viele Fragen soll das Quiz haben?': 'How many questions should the quiz have?',
    '10 Fragen':                          '10 Questions',
    '15 Fragen':                          '15 Questions',
    '20 Fragen':                          '20 Questions',
    'Zeitbasiertes Punktesystem · Echtzeit-Leaderboard':
      'Time-based scoring · Real-time leaderboard',
    '✨ Spiel erstellen':                 '✨ Create Game',
    'Game PIN':                           'Game PIN',
    '👥 Spieler in der Lobby':           '👥 Players in Lobby',
    '▶ Spiel starten':                   '▶ Start Game',
    '0 Antworten':                        '0 Answers',
    '➡ Nächste Frage':                   '➡ Next Question',
    '🏁 Spiel beenden':                  '🏁 End Game',
    'Spiel beendet!':                     'Game over!',
    '🔄 Neues Spiel':                    '🔄 New Game',
    '🖥 Host':                           '🖥 Host',
    '📱 Player':                          '📱 Player',
    '📊 Dashboard':                      '📊 Dashboard',
    '⚡ Challenges':                     '⚡ Challenges',
    '🎮 Live-Quiz':                      '🎮 Live Quiz',

    // Multiplayer Quiz-Fragen
    'Was frisst die Kaufkraft deines Geldes auf dem Sparbuch am meisten auf?':
      'What most erodes the purchasing power of your savings account money?',
    'Was versteht man unter \'Inflation\'?':
      'What is meant by \'inflation\'?',
    'Was ist die EZB?':                   'What is the ECB?',
    'Was bedeutet \'Kaufkraft\'?':        'What does \'purchasing power\' mean?',
    'Welcher Effekt wird von Einstein als das "8. Weltwunder" bezeichnet?':
      'Which effect is described by Einstein as the "8th Wonder of the World"?',
    'Wie viele Unternehmen stecken im Index "MSCI World"?':
      'How many companies are in the "MSCI World" index?',
    'Was bedeutet die Abkürzung ETF?':    'What does the abbreviation ETF stand for?',
    'Welche Aussage über den DAX ist korrekt?':
      'Which statement about the DAX is correct?',
    'Was ist ein \'thesaurierender\' ETF?': 'What is an \'accumulating\' ETF?',
    'Was ist der S&P 500?':               'What is the S&P 500?',
    'Was bedeutet \'TER\' bei einem ETF?': 'What does \'TER\' mean for an ETF?',
    'Was ist eine Dividende?':            'What is a dividend?',
    'Was bedeutet \'Volatilität\' bei einer Aktie?':
      'What does \'volatility\' mean for a stock?',
    'Was ist das Kurs-Gewinn-Verhältnis (KGV)?':
      'What is the price-to-earnings ratio (P/E ratio)?',
    'Welche Anlageklasse hatte historisch die höchste langfristige Rendite?':
      'Which asset class has historically had the highest long-term return?',
    'Was bedeutet \'Diversifikation\' im Finanzkontext?':
      'What does \'diversification\' mean in a financial context?',
    'Was ist \'Rebalancing\' im Portfoliomanagement?':
      'What is \'rebalancing\' in portfolio management?',
    'Was ist ein \'Weltportfolio\' nach Kommer?':
      'What is a \'world portfolio\' according to Kommer?',
    'Was versteht man unter \'Asset Allocation\'?':
      'What is meant by \'asset allocation\'?',
    'Wie hoch ist der Sparerpauschbetrag für Einzelpersonen in Deutschland (2024)?':
      'How high is the saver\'s allowance for individuals in Germany (2024)?',
    'Wie hoch ist die Abgeltungsteuer auf Kapitalerträge in Deutschland?':
      'How high is the withholding tax on capital gains in Germany?',
    'Was ist ein \'Freistellungsauftrag\' bei der Bank?':
      'What is a \'tax exemption order\' at the bank?',
    'Was ist der \'effektive Jahreszins\'?': 'What is the \'effective annual interest rate\'?',
    'Was ist eine Bonität?':               'What is a credit rating?',
    'Was versteht man unter \'Tilgung\' bei einem Kredit?':
      'What is meant by \'repayment\' on a loan?',
    'Was bedeutet das Akronym \'FIRE\' in der Finanzwelt?':
      'What does the acronym \'FIRE\' mean in finance?',
    'Was ist die gesetzliche Rentenversicherung in Deutschland?':
      'What is the statutory pension insurance in Germany?',
    'Was ist ein ETF-Sparplan?':           'What is an ETF savings plan?',
    'Was bedeutet \'Cost-Average-Effekt\'?': 'What does \'cost-averaging effect\' mean?',
    'Was ist Bitcoin?':                    'What is Bitcoin?',
    'Was ist eine Blockchain?':            'What is a blockchain?',
    'Was gilt für die Volatilität von Kryptowährungen im Vergleich zu klassischen Anlagen?':
      'What applies to the volatility of cryptocurrencies compared to classic investments?',
    'Was ist die Grunderwerbsteuer in Deutschland?':
      'What is the property transfer tax in Germany?',
    'Was ist eine \'Eigenbedarfskündigung\'?': 'What is a \'personal use notice\'?',
    'Was bedeutet \'Beleihungswert\' bei einer Immobilie?':
      'What does \'loan-to-value\' mean for a property?',
    'Welche Versicherung gilt als die wichtigste Basisabsicherung für Privatpersonen?':
      'Which insurance is considered the most important basic coverage for private individuals?',
    'Was ist eine Berufsunfähigkeitsversicherung (BU)?':
      'What is disability insurance (DI)?',
    'Was ist das Bruttoinlandsprodukt (BIP)?':
      'What is the gross domestic product (GDP)?',
    'Was ist eine Rezession?':             'What is a recession?',
    'Was bedeutet \'Deflation\'?':         'What does \'deflation\' mean?',
    'Was ist eine Anleihe (Obligation)?':  'What is a bond (obligation)?',
    'Was passiert in der Regel mit dem Kurs einer bestehenden Anleihe, wenn die Zinsen steigen?':
      'What usually happens to the price of an existing bond when interest rates rise?',
    'Was ist ein Robo-Advisor?':           'What is a Robo-Advisor?',
    'Was beschreibt die \'50-30-20-Regel\' beim Budgetieren?':
      'What describes the \'50-30-20 rule\' for budgeting?',
    'Was ist ein Tagesgeldkonto?':         'What is an overnight money account?',
    'Was unterscheidet einen aktiv verwalteten Fonds von einem ETF?':
      'What distinguishes an actively managed fund from an ETF?',
    'Was ist die Rürup-Rente (Basisrente)?': 'What is the Rürup pension (basic pension)?',
    'Was versteht man unter \'Humankapital\' in der Finanzplanung?':
      'What is meant by \'human capital\' in financial planning?',
    'Was beschreibt \'Loss Aversion\' (Verlustaversion)?':
      'What describes \'Loss Aversion\'?',
    'Was ist \'Market Timing\'?':          'What is \'Market Timing\'?',

    // Multiplayer Antwortoptionen
    'Steuern':                            'Taxes',
    'Bankgebühren':                       'Bank fees',
    'Aktienmarkt':                        'Stock market',
    'Steigende Aktienkurse':              'Rising stock prices',
    'Allgemeiner Preisanstieg':           'General price increase',
    'Sinkende Zinsen':                    'Falling interest rates',
    'Wachsendes BIP':                     'Growing GDP',
    'Eine deutsche Großbank':             'A major German bank',
    'Die Europäische Zentralbank':        'The European Central Bank',
    'Ein ETF-Anbieter':                   'An ETF provider',
    'Eine Versicherung':                  'An insurance company',
    'Wie viel man verdient':              'How much you earn',
    'Wie viel man mit Geld kaufen kann':  'How much you can buy with money',
    'Der Aktienwert eines Unternehmens':  'The stock value of a company',
    'Das verfügbare Tagesgeld':           'The available overnight money',
    'Diversifikation':                    'Diversification',
    'Dividenden':                         'Dividends',
    'Krypto':                             'Crypto',
    'ca. 30':                             'approx. 30',
    'ca. 500':                            'approx. 500',
    'über 10.000':                        'over 10,000',
    'ca. 1.500':                          'approx. 1,500',
    'European Trade Fund':                'European Trade Fund',
    'Exchange Traded Fund':               'Exchange Traded Fund',
    'Equity Transfer Fee':                'Equity Transfer Fee',
    'Extended Tax Form':                  'Extended Tax Form',
    'Er enthält 100 internationale Firmen': 'It contains 100 international companies',
    'Er ist ein Anleihenindex':           'It is a bond index',
    'Er enthält die 40 größten deutschen Aktien': 'It contains the 40 largest German stocks',
    'Er wurde 1950 gegründet':            'It was founded in 1950',
    'Er schüttet Dividenden aus':         'It distributes dividends',
    'Er ist steuerbefreit':               'It is tax-exempt',
    'Er enthält nur Anleihen':            'It contains only bonds',
    'Er reinvestiert Erträge automatisch': 'It automatically reinvests earnings',
    '500 europäische Staatsanleihen':     '500 European government bonds',
    'Ein deutsches Rentenprodukt':        'A German pension product',
    'Ein Kryptowährungskorb':             'A cryptocurrency basket',
    'Ein Index der 500 größten US-Unternehmen': 'An index of the 500 largest US companies',
    'Total Expense Ratio (Gesamtkostenquote)': 'Total Expense Ratio',
    'Total Equity Ratio':                 'Total Equity Ratio',
    'Tatsächliche Einzelrendite':         'Actual individual return',
    'Trading Entry Rate':                 'Trading Entry Rate',
    'Ein Bankkredit':                     'A bank loan',
    'Ein Steuerabzug':                    'A tax deduction',
    'Eine Gewinnausschüttung an Aktionäre': 'A profit distribution to shareholders',
    'Ein Börsenindex':                    'A stock market index',
    'Die Dividendenrendite':              'The dividend yield',
    'Die Kursschwankungsbreite':          'The price volatility range',
    'Das Kurs-Gewinn-Verhältnis':         'The price-to-earnings ratio',
    'Die Marktkapitalisierung':           'The market capitalization',
    'Aktienkurs geteilt durch Jahresgewinn': 'Share price divided by annual profit',
    'Gewinn mal Kurs':                    'Profit times price',
    'Dividende durch Kurs':               'Dividend by price',
    'Umsatz durch Mitarbeiterzahl':       'Revenue by number of employees',
    'Tagesgeld':                          'Overnight money',
    'Gold':                               'Gold',
    'Aktien (globale Indizes)':           'Stocks (global indices)',
    'Staatsanleihen':                     'Government bonds',
    'Risiko auf viele Anlagen verteilen': 'Spread risk across many investments',
    'Alles auf eine Karte setzen':        'Put everything on one card',
    'Aktien kurzfristig traden':          'Trade stocks short-term',
    'Steuern optimieren':                 'Optimize taxes',
    'Alle Positionen verkaufen':          'Sell all positions',
    'Aktien auf Kredit kaufen':           'Buy stocks on credit',
    'Portfolio umbenennen':               'Rename portfolio',
    'Ursprüngliche Gewichtung wiederherstellen': 'Restore original weighting',
    'Portfolio nur aus deutschen Aktien': 'Portfolio only from German stocks',
    'Portfolio mit Rohstoffen und Gold':  'Portfolio with commodities and gold',
    'Aktien aus Entwicklungsländern':     'Stocks from developing countries',
    'Breit gestreutes globales ETF-Portfolio': 'Broadly diversified global ETF portfolio',
    'Aufteilung des Portfolios auf Anlageklassen': 'Allocation of portfolio to asset classes',
    'Steuerliche Erfassung von Vermögen': 'Tax recording of assets',
    'Kauf einzelner Aktien':              'Purchase of individual stocks',
    'Bankberatungsgespräch':              'Bank advisory meeting',
    '0 € – es gibt keinen':              '€0 – there is none',
    '5.000 € pro Jahr':                  '€5,000 per year',
    '1.000 € pro Jahr':                  '€1,000 per year',
    'Nur für Verheiratete':               'Only for married people',
    '15 %':                               '15%',
    '35 %':                               '35%',
    '25 %':                               '25%',
    '42 %':                               '42%',
    'Befreiung von Kontogebühren':        'Exemption from account fees',
    'Steuerbefreiung für Immobilien':     'Tax exemption for real estate',
    'Freigabe des Sparerpauschbetrags bei der Bank': 'Release of saver\'s allowance at the bank',
    'Schutz vor Kontopfändung':           'Protection against account seizure',
    'Der Gesamtzinssatz inklusive aller Kosten': 'The total interest rate including all costs',
    'Der Zinssatz ohne Nebenkosten':      'The interest rate without ancillary costs',
    'Der Zinssatz nach Steuern':          'The interest rate after taxes',
    'Ein Sonderzins für Studenten':       'A special rate for students',
    'Die Kreditwürdigkeit einer Person':  'A person\'s creditworthiness',
    'Ein Sparkontomodell':                'A savings account model',
    'Der aktuelle Leitzins':              'The current key interest rate',
    'Eine Versicherungsart':              'A type of insurance',
    'Die Rückzahlung des geliehenen Betrags': 'The repayment of the borrowed amount',
    'Die Zinszahlung':                    'The interest payment',
    'Die Kontoführungsgebühr':            'The account management fee',
    'Der Zinssatz':                       'The interest rate',
    'Financial Independence, Retire Early': 'Financial Independence, Retire Early',
    'Fast Income Reinvestment Engine':    'Fast Income Reinvestment Engine',
    'Free Interest Rate Exchange':        'Free Interest Rate Exchange',
    'Fixed Income Real Estate':           'Fixed Income Real Estate',
    'Ein privater Sparplan':              'A private savings plan',
    'Ein staatlicher ETF':                'A government ETF',
    'Ein Umlageverfahren – Junge zahlen für Ältere': 'A pay-as-you-go system – young pay for old',
    'Eine freiwillige Zusatzrente':       'A voluntary supplementary pension',
    'Einmaliger Kauf eines ETF':          'One-time purchase of an ETF',
    'Regelmäßiger automatischer Kauf von ETF-Anteilen': 'Regular automatic purchase of ETF shares',
    'Ein Tagesgeldkonto mit ETF-Zinsen':  'An overnight account with ETF interest',
    'Eine staatlich geförderte Rente':    'A state-subsidized pension',
    'Man kauft immer zum Höchstkurs':     'You always buy at the highest price',
    'Man spart Steuern durch Ratenzahlung': 'You save taxes through installment payments',
    'Ein Rabatt bei großen Käufen':       'A discount on large purchases',
    'Durch regelmäßiges Kaufen mittelt man den Einstiegspreis': 'Through regular buying you average the entry price',
    'Eine staatliche Digitalwährung':     'A state digital currency',
    'Eine dezentrale Kryptowährung ohne Mittelsmänner': 'A decentralized cryptocurrency without intermediaries',
    'Ein ETF auf Technologieaktien':      'An ETF on technology stocks',
    'Ein Zahlungssystem von PayPal':      'A PayPal payment system',
    'Eine Art Cloud-Speicher':            'A type of cloud storage',
    'Ein Bankprotokoll für Überweisungen': 'A bank protocol for transfers',
    'Ein dezentrales, unveränderliches digitales Hauptbuch': 'A decentralized, immutable digital ledger',
    'Eine verschlüsselte E-Mail':         'An encrypted email',
    'Kryptos sind stabiler als Aktien':   'Cryptos are more stable than stocks',
    'Kryptos haben keine Schwankungen':   'Cryptos have no fluctuations',
    'Kryptos folgen immer dem Goldkurs':  'Cryptos always follow the gold price',
    'Kryptos schwanken oft deutlich stärker als klassische Anlagen': 'Cryptos often fluctuate much more than classic investments',
    'Eine jährliche Steuer auf Mieteinnahmen': 'An annual tax on rental income',
    'Eine einmalige Steuer beim Kauf von Grundstücken oder Immobilien': 'A one-time tax on the purchase of land or property',
    'Eine Steuer auf Baugenehmigungen':   'A tax on building permits',
    'Eine kommunale Abgabe für Straßenreinigung': 'A municipal levy for street cleaning',
    'Kündigung wegen Mietrückstand':      'Termination due to rent arrears',
    'Kündigung des Kredits durch die Bank': 'Termination of the loan by the bank',
    'Kündigung durch den Vermieter, weil er selbst einziehen möchte': 'Termination by the landlord because they want to move in themselves',
    'Eine Sonderkündigung bei Jobverlust': 'A special termination on job loss',
    'Der Verkaufspreis der Immobilie':    'The selling price of the property',
    'Der Mietertrag pro Jahr':            'The rental yield per year',
    'Die Grundstücksgröße in m²':         'The plot size in m²',
    'Der von der Bank angesetzte Sicherheitswert für einen Kredit': 'The security value set by the bank for a loan',
    'Hausratversicherung':                'Household contents insurance',
    'Rechtsschutzversicherung':           'Legal expenses insurance',
    'Reiserücktrittversicherung':         'Travel cancellation insurance',
    'Private Haftpflichtversicherung':    'Personal liability insurance',
    'Schutz vor Arbeitslosigkeit':        'Protection against unemployment',
    'Absicherung bei dauerhafter Unfähigkeit, den eigenen Beruf auszuüben': 'Insurance against permanent inability to practice one\'s profession',
    'Eine staatliche Erwerbsminderungsrente': 'A state reduced earnings pension',
    'Schutz vor Unfällen am Arbeitsplatz': 'Protection against workplace accidents',
    'Der Staatsschuldenstand eines Landes': 'A country\'s national debt level',
    'Die Inflationsrate eines Landes':    'A country\'s inflation rate',
    'Der Gesamtwert aller in einem Land produzierten Güter und Dienstleistungen': 'The total value of all goods and services produced in a country',
    'Die Exportquote eines Landes':       'A country\'s export ratio',
    'Anhaltend hohe Inflation':           'Persistently high inflation',
    'Zwei aufeinanderfolgende Quartale mit negativem Wirtschaftswachstum': 'Two consecutive quarters of negative economic growth',
    'Ein Börsencrash von mehr als 20 %':  'A stock market crash of more than 20%',
    'Steigende Arbeitslosigkeit über 10 %': 'Rising unemployment above 10%',
    'Allgemeines Sinken des Preisniveaus': 'General fall in the price level',
    'Starker Anstieg des Preisniveaus':   'Strong rise in the price level',
    'Sinkende Aktienkurse':               'Falling stock prices',
    'Rückgang der Exporte':               'Decline in exports',
    'Ein Darlehen, das Anleger einem Staat oder Unternehmen gewähren': 'A loan that investors grant to a government or company',
    'Ein Anteil an einem Unternehmen':    'A share in a company',
    'Ein Sparplan bei der Bank':          'A savings plan at the bank',
    'Der Kurs steigt':                    'The price rises',
    'Der Kurs sinkt':                     'The price falls',
    'Der Kurs bleibt gleich':             'The price stays the same',
    'Der Kurs verdoppelt sich':           'The price doubles',
    'Ein KI-gestützter automatisierter Anlage- und Portfolioservice': 'An AI-supported automated investment and portfolio service',
    'Ein Roboter, der Bankberatungen übernimmt': 'A robot that takes over bank consultations',
    'Eine App für Budgetplanung':         'An app for budget planning',
    'Ein automatischer Kreditvermittler': 'An automatic credit intermediary',
    '50 % sparen, 30 % investieren, 20 % ausgeben': '50% save, 30% invest, 20% spend',
    '50 % Miete, 30 % Lebensmittel, 20 % Freizeit': '50% rent, 30% food, 20% leisure',
    '50 % ETFs, 30 % Aktien, 20 % Gold': '50% ETFs, 30% stocks, 20% gold',
    '50 % Grundbedürfnisse, 30 % Wünsche, 20 % Sparen & Investieren': '50% basic needs, 30% wants, 20% saving & investing',
    'Ein Konto nur für tägliche Ausgaben': 'An account only for daily expenses',
    'Ein Girokonto mit Tageslimit':       'A checking account with daily limit',
    'Ein kurzfristiges, täglich verfügbares Sparkonto mit variablem Zins': 'A short-term, daily available savings account with variable interest',
    'Ein Festgeldkonto mit festen Zinsen': 'A fixed deposit account with fixed interest',
    'ETFs haben immer höhere Kosten':     'ETFs always have higher costs',
    'ETFs werden täglich gehandelt, aktive Fonds monatlich': 'ETFs are traded daily, active funds monthly',
    'Aktive Fonds sind nur für institutionelle Anleger': 'Active funds are only for institutional investors',
    'Aktive Fonds versuchen den Markt zu schlagen, ETFs bilden ihn nur ab': 'Active funds try to beat the market, ETFs just replicate it',
    'Eine staatliche Grundrente für Geringverdiener': 'A state basic pension for low earners',
    'Ein Betriebsrentenmodell':           'A company pension model',
    'Eine steuerlich geförderte private Altersvorsorge vor allem für Selbstständige': 'A tax-subsidized private retirement provision primarily for the self-employed',
    'Eine Rentenversicherung ohne Steuervorteile': 'A pension insurance without tax benefits',
    'Der wirtschaftliche Wert der eigenen Arbeitskraft und zukünftigen Einnahmen': 'The economic value of one\'s own workforce and future income',
    'Der Wert aller Aktien, die man besitzt': 'The value of all stocks you own',
    'Das Humanitätsbudget einer Firma':   'A company\'s humanitarian budget',
    'Die Personalkosten eines Unternehmens': 'A company\'s personnel costs',
    'Die Tendenz, Verluste stärker zu gewichten als gleichhohe Gewinne': 'The tendency to weight losses more heavily than equal gains',
    'Die Strategie, immer Gewinne zu realisieren': 'The strategy of always realizing gains',
    'Der Wunsch nach risikolosen Anlagen': 'The desire for risk-free investments',
    'Die Aversion gegen Steuerzahlungen': 'The aversion to tax payments',
    'Die Eröffnungszeiten der Börse':     'The opening hours of the stock exchange',
    'Der Versuch, den perfekten Ein- und Ausstiegszeitpunkt am Markt zu treffen': 'The attempt to hit the perfect entry and exit point in the market',
    'Ein Handelsalgorithmus für Hochfrequenzhandel': 'A trading algorithm for high-frequency trading',
    'Die Berechnung der historischen Marktrendite': 'The calculation of historical market returns',

    // ── Finquest Landing Page ────────────────────────────
    'FinQuest – Finanzbildung für junge Menschen | Lernen wie Duolingo':
      'FinQuest – Financial Education for Young People | Learn like Duolingo',
    'FinQuest bringt dir Budgetplanung, Investieren und Steuern bei – in 5 Minuten täglich. Wie Duolingo, aber für dein Portemonnaie.':
      'FinQuest teaches you budgeting, investing and taxes – in 5 minutes daily. Like Duolingo, but for your wallet.',
    'Deine Reise zur finanziellen Freiheit beginnt hier. Gamifizierte Finanzbildung für junge Menschen.':
      'Your journey to financial freedom starts here. Gamified financial education for young people.',
    'Dein Lernpfad':                      'Your Learning Path',
    'Was du lernen wirst':                'What You Will Learn',
    'Starte kostenlos, wachse mit Premium': 'Start Free, Grow with Premium',
    'Was unsere Lernenden sagen':         'What Our Learners Say',
    'Verdiene Belohnungen':               'Earn Rewards',
    'So funktioniert\'s':                 'Here\'s How It Works',
    'So einfach geht\'s':                 'It\'s That Simple',
    'Wähle deinen Pfad':                  'Choose Your Path',
    'Von Budgetierung bis Bitcoin':       'From Budgeting to Bitcoin',
    '▶ Demo ansehen':                    '▶ Watch Demo',
    'Starten ⚡':                        'Start ⚡',
    'Jetzt kostenlos starten →':         'Start for free now →',
    'Über 50.000 Menschen haben ihre Finanzreise bereits gestartet.':
      'Over 50,000 people have already started their financial journey.',
    'Über 180 Lektionen in 9 strukturierten Lernpfaden – von den Grundlagen bis zur Finanzfreiheit.':
      'Over 180 lessons in 9 structured learning paths – from the basics to financial freedom.',
    'XP-Punkte, Streak-Feuer, Badges und FinCoins – jeder Fortschritt wird belohnt. Klettere in der Rangliste und schalte exklusive Inhalte frei.':
      'XP points, streak fire, badges and FinCoins – every progress is rewarded. Climb the leaderboard and unlock exclusive content.',
    'Drei Schritte zur finanziellen Freiheit.': 'Three steps to financial freedom.',
    'Einsteiger, Mittelstufe oder Fortgeschrittener – wir passen das Lernerlebnis genau an dein Niveau an. Ein kurzer Test zeigt dir deinen idealen Startpunkt.':
      'Beginner, intermediate or advanced – we tailor the learning experience exactly to your level. A short test shows your ideal starting point.',
    'Beamer-Ansicht für den Host und Smartphone-Ansicht für die Spieler – alles in einer einzigen URL.':
      'Projector view for the host and smartphone view for players – all in a single URL.',
    'Bis zu 1.000 Punkte pro Frage – wer schneller antwortet, bekommt mehr. Spannung bis zur letzten Sekunde.':
      'Up to 1,000 points per question – faster answers get more. Excitement until the last second.',
    'Spieler joinen mit einem 4-stelligen PIN vom Smartphone – kein App-Download, kein Server, sofort einsatzbereit.':
      'Players join with a 4-digit PIN from their smartphone – no app download, no server, ready to go.',
    'Bringe Finanzbildung in den Klassenraum oder Pitch – mit echtem Echtzeit-Multiplayer. Wie Kahoot, aber für Finanzen.':
      'Bring financial education into the classroom or pitch – with real real-time multiplayer. Like Kahoot, but for finance.',
    'Jederzeit kündbar. Keine versteckten Kosten. Keine Kreditkarte für den Testzeitraum nötig.':
      'Cancel anytime. No hidden costs. No credit card needed for the trial period.',
    'Was ist Inflation? Wie funktioniert eine Bank? Die Grundlagen der Finanzwelt verständlich erklärt.':
      'What is inflation? How does a bank work? The basics of finance explained clearly.',
    'Die mächtigste Kraft im Universum – für dein Geld. Die 72er-Regel, Sparpläne und warum Zeit dein größtes Asset ist.':
      'The most powerful force in the universe – for your money. The Rule of 72, savings plans and why time is your greatest asset.',
    'ETFs, Aktien, Risiko & Rendite. Lerne, wie du dein Geld für dich arbeiten lässt.':
      'ETFs, stocks, risk & return. Learn how to make your money work for you.',
    'Financial Independence, Retire Early. Die Strategien, mit denen du mit 40 finanziell frei wirst.':
      'Financial Independence, Retire Early. The strategies to become financially free at 40.',
    'Einkommenssteuer, Abschreibungen und wie du legal mehr Geld behältst. Kein Fachkauderwelsch.':
      'Income tax, depreciation and how to legally keep more money. No technical jargon.',
    '3-Säulen-Modell, Rentenlücke, Riester, Rürup und ETF-Depot. Damit du im Alter nicht von der Hand in den Mund lebst.':
      '3-pillar model, pension gap, Riester, Rürup and ETF depot. So you don\'t live hand-to-mouth in old age.',
    'Ich hatte früher Angst vor dem Thema Investieren. Nach 2 Wochen FinQuest habe ich meinen ersten ETF-Sparplan eröffnet. Das Gamification-System hat mich einfach am Ball gehalten!':
      'I used to be afraid of the topic of investing. After 2 weeks of FinQuest I opened my first ETF savings plan. The gamification system just kept me engaged!',
    'Als Lehrer empfehle ich FinQuest allen meinen Schülern. Endlich eine App, die Finanzbildung auf Augenhöhe erklärt – ohne Fachkauderwelsch, aber mit echtem Mehrwert.':
      'As a teacher I recommend FinQuest to all my students. Finally an app that explains financial education at eye level – without technical jargon, but with real value.',
    '50.000 Lernende':                    '50,000 Learners',
    'Empfohlen von 500+ Lehrern':         'Recommended by 500+ teachers',
    'Gamification':                       'Gamification',
    'Echtzeit via Firebase':              'Real-time via Firebase',
    'Zeitbasiertes Punktesystem':         'Time-based scoring',
    'Host & Player in einer Seite':       'Host & Player on one page',
    'Basiskurse':                         'Basic courses',
    '20 Lektionen · Einsteiger':          '20 Lessons · Beginner',
    '20 Lektionen · Mittelstufe':         '20 Lessons · Intermediate',
    '20 Lektionen · Fortgeschritten':     '20 Lessons · Advanced',
    'Spiele dein Leben.':                 'Play your life.',
    'Für immer kostenlos':               'Forever free',
    'Alles aus Free':                     'Everything from Free',
    'Finn Avatar-Anpassung':              'Finn Avatar Customization',
    '2× FinCoin-Belohnungen':            '2× FinCoin rewards',
    'Unbegrenzte Leben':                  'Unlimited lives',
    'Priorisierter Support':              'Priority support',
    'Offline-Modus':                      'Offline mode',
    'Tägliche Challenges':                'Daily Challenges',
    'Werbung angezeigt':                  'Ads shown',
    '✅ Werbefrei':                       '✅ Ad-free',
    'Bewertungen':                        'Reviews',
    'Studentin · München':               'Student · Munich',
    'Azubi · Berlin':                     'Apprentice · Berlin',
    'Wirtschaftslehrer · Hamburg':        'Economics teacher · Hamburg',
    '4.9 / 5 Sternen':                   '4.9 / 5 stars',

    // ── Login / Register ────────────────────────────────
    'Einloggen – FinQuest':              'Log In – FinQuest',
    'Kostenlos registrieren – FinQuest': 'Register for Free – FinQuest',
    'Willkommen zurück!':                'Welcome back!',
    'Logge dich ein und mach weiter, wo du aufgehört hast.':
      'Log in and continue where you left off.',
    'E-Mail-Adresse':                     'Email Address',
    'Passwort vergessen?':                'Forgot Password?',
    'Noch kein Konto?':                   'No account yet?',
    'Jetzt kostenlos registrieren':       'Register for free now',
    'Passwort zurücksetzen':              'Reset Password',
    'Wir schicken dir einen Reset-Link per E-Mail.':
      'We\'ll send you a reset link by email.',
    'Reset-Link senden →':               'Send Reset Link →',
    '📧 Wird gesendet…':                 '📧 Sending…',
    '✅ Bestätigungs-E-Mail wurde erneut gesendet. Schau in deinen Posteingang!':
      '✅ Confirmation email resent. Check your inbox!',
    'Konto erstellen':                    'Create Account',
    'Kostenlos starten. Kein Kreditkarte nötig.': 'Start for free. No credit card needed.',
    'Fortschritt über alle Geräte gespeichert': 'Progress saved across all devices',
    'XP-System & Achievements freischalten': 'Unlock XP system & achievements',
    'Alle Basiskurse kostenlos':          'All basic courses free',
    'Dein Name':                          'Your Name',
    'Passwort':                           'Password',
    'Passwort eingeben':                  'Enter Password',
    'Jetzt kostenlos starten →':         'Start for free now →',
    'Bereits ein Konto?':                 'Already have an account?',
    'Fast geschafft!':                    'Almost done!',
    'Schau auch in deinen Spam-Ordner.':  'Also check your spam folder.',
    'Erneut versuchen':                   'Try again',

    // ── Challenges ──────────────────────────────────────
    'Challenges – FinQuest':             'Challenges – FinQuest',
    '🎯 Challenges':                     '🎯 Challenges',
    'Tägliche':                           'Daily',
    'Herausforderungen':                  'Challenges',
    'Verdiene Bonus-XP, baue deinen Streak auf und klettere in der Rangliste.':
      'Earn bonus XP, build your streak and climb the leaderboard.',
    'XP gesamt':                          'XP total',
    'Challenges erledigt':                'Challenges completed',
    '⚡ Täglich – heute':                '⚡ Daily – today',
    '📅 Wöchentlich – diese Woche':      '📅 Weekly – this week',
    '🎓 Kurs-Challenges – schließe ganze Kurse ab':
      '🎓 Course Challenges – complete entire courses',
    '✓ Abgeholt':                        '✓ Claimed',
    '✓ Erledigt':                        '✓ Done',
    '🎁 Bereit!':                        '🎁 Ready!',
    'Fortschritt':                        'Progress',
    'Dashboard':                          'Dashboard',

    // ── Premium ─────────────────────────────────────────
    'Premium – FinQuest':                'Premium – FinQuest',
    '⭐ FinQuest Premium':               '⭐ FinQuest Premium',
    'Lerne ohne Ablenkung.':              'Learn without distraction.',
    'Werde finanziell frei.':            'Become financially free.',
    '40% sparen':                         'Save 40%',
    'Alle Basiskurse':                    'All basic courses',
    'XP & Streak-System':                'XP & Streak System',
    'Quizze & Achievements':              'Quizzes & Achievements',
    'Werbung vorhanden':                  'Ads included',
    'Offline lernen':                     'Learn offline',
    'Exklusive Kurse':                    'Exclusive courses',
    '2× XP-Belohnungen':                 '2× XP rewards',
    '⭐ Beliebteste Wahl':               '⭐ Most Popular',
    '4,99 €/Monat':                       '€4.99/month',
    'pro Monat':                          'per month',
    '7 Tage kostenlos testen':           'Try free for 7 days',
    'Keine Werbung':                      'No ads',
    'Jederzeit kündbar · Keine Kreditkarte für Test':
      'Cancel anytime · No credit card for trial',
    'Kein Kreditkarte nötig.':           'No credit card needed.',
    'Premium testen – 7 Tage gratis →':  'Try Premium – 7 days free →',
    'Keine Werbung, Offline-Modus, exklusive Kurse und doppelte XP-Belohnungen. Für die, die es ernst meinen.':
      'No ads, offline mode, exclusive courses and double XP rewards. For those who mean business.',
    'Wie es funktioniert':               'How it works',

    // ── Allgemein ────────────────────────────────────────
    'Live':                               'Live',
    'Neu':                                'New',
    'Lade...':                            'Loading...',
    'Lade…':                              'Loading…',
    'Fehler':                             'Error',
    'Fehler beim Laden.':                 'Error loading.',
    'Abbrechen':                          'Cancel',
  };

  /* ══════════════════════════════════════════════════════
     REGEX-PATTERNS
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

  function tr(text) {
    const t = text.trim();
    if (!t || t.length < 2) return text;
    if (DICT[t]) return text.replace(t, DICT[t]);
    for (const p of PATTERNS) {
      const m = t.match(p.re);
      if (m) return text.replace(t, p.en(m));
    }
    const sorted = Object.entries(DICT).filter(([de]) => de.length >= 12).sort((a, b) => b[0].length - a[0].length);
    for (const [de, en] of sorted) {
      if (t.includes(de)) return text.replace(de, en);
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
     MUTATIONOBSERVER
  ══════════════════════════════════════════════════════ */
  let _busy = false;
  const observer = new MutationObserver(mutations => {
    if (_busy) return;
    _busy = true;
    setTimeout(() => {
      mutations.forEach(m => m.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          translateNode(node);
          // DeepL Fallback für dynamisch geladene Inhalte
          if (LANG === 'en') setTimeout(() => deepLPage(node), 300);
        }
      }));
      _busy = false;
    }, 0);
  });

  /* ══════════════════════════════════════════════════════
     SPRACH-BUTTON (unten links)
  ══════════════════════════════════════════════════════ */
  function injectLangButton() {
    if (document.getElementById('fq-lang-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'fq-lang-btn';
    btn.setAttribute('translate', 'no');
    btn.className = 'notranslate';
    btn.innerHTML = LANG === 'de'
      ? '<span style="opacity:.6;font-size:11px;margin-right:2px">🌐</span> EN'
      : '<span style="opacity:.6;font-size:11px;margin-right:2px">🌐</span> DE';
    Object.assign(btn.style, {
      position:'fixed', bottom:'24px', left:'24px', zIndex:'9999',
      background:'rgba(22,33,62,0.95)', border:'1.5px solid rgba(0,212,138,0.35)',
      color:'#F0F4FF', fontFamily:'"DM Sans",sans-serif', fontSize:'13px',
      fontWeight:'700', padding:'9px 18px', borderRadius:'50px', cursor:'pointer',
      backdropFilter:'blur(10px)', boxShadow:'0 4px 20px rgba(0,0,0,0.45)',
      transition:'all 0.2s', lineHeight:'1', letterSpacing:'0.03em',
    });
    btn.onmouseenter = () => { btn.style.background='rgba(0,212,138,0.14)'; btn.style.borderColor='rgba(0,212,138,0.65)'; btn.style.transform='translateY(-2px)'; };
    btn.onmouseleave = () => { btn.style.background='rgba(22,33,62,0.95)'; btn.style.borderColor='rgba(0,212,138,0.35)'; btn.style.transform=''; };
    btn.onclick = () => { localStorage.setItem(STORAGE_KEY, LANG === 'de' ? 'en' : 'de'); location.reload(); };
    document.body.appendChild(btn);
  }

  /* ══════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════ */
  function init() {
    injectLangButton();
    if (LANG === 'en') {
      // 1. Sofort lokales Wörterbuch anwenden (kein Netzwerk, kein Flash)
      translatePage();
      observer.observe(document.body, { childList: true, subtree: true });
      window.addEventListener('load', translatePage);
      setTimeout(translatePage, 500);
      setTimeout(translatePage, 1500);
      setTimeout(translatePage, 3000);

      // 2. DeepL als Fallback für Texte die nicht im Wörterbuch stehen
      //    Läuft asynchron im Hintergrund – blockiert nichts
      setTimeout(() => deepLPage(document.body), 800);
      setTimeout(() => deepLPage(document.body), 2500);
      window.addEventListener('load', () => setTimeout(() => deepLPage(document.body), 600));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
/* ══════════════════════════════════════════════════════
     AUTOMATISCHER DEEPL-WÄCHTER (MUTATION OBSERVER)
     Überwacht die Seite auf dynamisch geladene Inhalte (z.B. Popups)
  ══════════════════════════════════════════════════════ */
  let deepLTimer = null;

  const dynamicDeepLObserver = new MutationObserver((mutations) => {
    // Nur reagieren, wenn die Sprache auf Englisch (en) gestellt ist
    if (LANG !== 'en') return;

    let hasNewContent = false;
    
    // Prüfen, ob wirklich neue Elemente zum HTML hinzugefügt wurden
    for (let mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        hasNewContent = true;
        break;
      }
    }

    if (hasNewContent) {
      // Wenn es neue Inhalte gibt, alten Timer löschen...
      clearTimeout(deepLTimer);
      
      // ...und einen neuen Timer starten. 
      // Wartet 500ms, bis das Modal/Fenster fertig aufgebaut ist, und übersetzt dann.
      deepLTimer = setTimeout(() => {
        if (typeof deepLPage === 'function') {
          deepLPage(document.body);
        }
      }, 500);
    }
  });

  // Wächter starten, sobald das Skript lädt
  window.addEventListener('DOMContentLoaded', () => {
    if (LANG === 'en') {
      dynamicDeepLObserver.observe(document.body, { 
        childList: true, 
        subtree: true 
      });
    }
  });

})();
