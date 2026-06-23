/* ============================================================
   בלסי סטור — Accessibility toolbar (stand-alone)
   ============================================================
   This file injects the accessibility floating button + slide-in
   panel into ANY page that loads it. The CSS lives in styles.css
   under the "ACCESSIBILITY TOOLBAR" section.

   Designed to be safe to include on every page (index, terms,
   privacy, accessibility) — it checks if the toolbar HTML already
   exists in the page (e.g. index.html has it inline) before
   creating it, so no duplicates.

   Required for WCAG 2.0 AA / IS 5568 compliance.
   ============================================================ */
(function () {
  'use strict';

  const A11Y_STORAGE_KEY = 'balasi_a11y_prefs';
  const A11Y_TOGGLES = ['high-contrast','dark-contrast','readable-font','highlight-links','highlight-headings','cursor-lg','reduce-motion'];

  function loadA11yPrefs() {
    try { return JSON.parse(localStorage.getItem(A11Y_STORAGE_KEY) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function saveA11yPrefs(prefs) {
    try { localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(prefs)); } catch (e) {}
  }

  function applyA11yPrefs(prefs) {
    if (prefs['high-contrast'] && prefs['dark-contrast']) delete prefs['dark-contrast'];
    A11Y_TOGGLES.forEach(name => {
      document.body.classList.toggle('a11y-' + name, !!prefs[name]);
    });
    document.documentElement.classList.remove('a11y-size-115','a11y-size-130','a11y-size-150');
    if (prefs.textSize && prefs.textSize !== 100) {
      document.documentElement.classList.add('a11y-size-' + prefs.textSize);
    }
    document.querySelectorAll('.a11y-toggle').forEach(btn => {
      btn.setAttribute('aria-pressed', prefs[btn.dataset.a11y] ? 'true' : 'false');
    });
    document.querySelectorAll('.a11y-size').forEach(btn => {
      btn.setAttribute('aria-checked',
        (prefs.textSize || 100) === Number(btn.dataset.a11ySize) ? 'true' : 'false');
    });
  }

  function setA11yToggle(name, value) {
    const prefs = loadA11yPrefs();
    if (value) {
      prefs[name] = true;
      if (name === 'high-contrast') delete prefs['dark-contrast'];
      if (name === 'dark-contrast') delete prefs['high-contrast'];
    } else {
      delete prefs[name];
    }
    saveA11yPrefs(prefs);
    applyA11yPrefs(prefs);
  }

  function setA11yTextSize(size) {
    const prefs = loadA11yPrefs();
    prefs.textSize = size;
    saveA11yPrefs(prefs);
    applyA11yPrefs(prefs);
  }

  function resetA11yPrefs() {
    localStorage.removeItem(A11Y_STORAGE_KEY);
    applyA11yPrefs({});
  }

  function openA11yPanel() {
    const panel = document.getElementById('a11yPanel');
    const fab = document.getElementById('a11yFab');
    if (!panel) return;
    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add('open'));
    if (fab) fab.setAttribute('aria-expanded', 'true');
    let backdrop = document.querySelector('.a11y-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'a11y-backdrop';
      backdrop.addEventListener('click', closeA11yPanel);
      document.body.appendChild(backdrop);
    }
    requestAnimationFrame(() => backdrop.classList.add('show'));
    setTimeout(() => { document.getElementById('a11yClose')?.focus(); }, 50);
  }

  function closeA11yPanel() {
    const panel = document.getElementById('a11yPanel');
    const fab = document.getElementById('a11yFab');
    if (panel) panel.classList.remove('open');
    document.querySelector('.a11y-backdrop')?.classList.remove('show');
    if (fab) fab.setAttribute('aria-expanded', 'false');
    setTimeout(() => { if (panel) panel.hidden = true; }, 250);
    fab?.focus();
  }

  /* HTML for the toolbar — only injected if not already present */
  function injectA11yHTML() {
    if (document.getElementById('a11yFab')) return; // already in DOM (e.g., index.html)

    const fab = document.createElement('button');
    fab.className = 'a11y-fab';
    fab.id = 'a11yFab';
    fab.setAttribute('aria-label', 'פתח תפריט נגישות');
    fab.setAttribute('aria-expanded', 'false');
    fab.setAttribute('aria-controls', 'a11yPanel');
    fab.innerHTML = `
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-7 5h14v2h-5v3l3 7-2 1-3-7-3 7-2-1 3-7V9H5V7z"/>
      </svg>
      <span class="a11y-fab-label">נגישות</span>`;
    document.body.appendChild(fab);

    const panel = document.createElement('div');
    panel.className = 'a11y-panel';
    panel.id = 'a11yPanel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'a11yPanelTitle');
    panel.hidden = true;
    panel.innerHTML = `
      <div class="a11y-panel-head">
        <h3 id="a11yPanelTitle">⚙️ אפשרויות נגישות</h3>
        <button class="a11y-close" id="a11yClose" aria-label="סגור תפריט נגישות">×</button>
      </div>
      <div class="a11y-panel-body">
        <div class="a11y-group">
          <div class="a11y-group-title">תצוגה</div>
          <button class="a11y-toggle" data-a11y="high-contrast" aria-pressed="false">
            <span class="a11y-icon" aria-hidden="true">🌓</span>
            <span class="a11y-label-wrap"><b>ניגודיות גבוהה</b><span>שחור-לבן עם קונטרסט מקסימלי</span></span>
          </button>
          <button class="a11y-toggle" data-a11y="dark-contrast" aria-pressed="false">
            <span class="a11y-icon" aria-hidden="true">🌑</span>
            <span class="a11y-label-wrap"><b>רקע כהה</b><span>טקסט בהיר על רקע שחור</span></span>
          </button>
          <button class="a11y-toggle" data-a11y="readable-font" aria-pressed="false">
            <span class="a11y-icon" aria-hidden="true">🔤</span>
            <span class="a11y-label-wrap"><b>פונט נגיש</b><span>פונט קריא יותר ועם מרווח</span></span>
          </button>
        </div>
        <div class="a11y-group">
          <div class="a11y-group-title">גודל טקסט</div>
          <div class="a11y-text-size" role="radiogroup" aria-label="גודל טקסט">
            <button class="a11y-size" data-a11y-size="100" aria-checked="true" role="radio">רגיל</button>
            <button class="a11y-size" data-a11y-size="115" aria-checked="false" role="radio">115%</button>
            <button class="a11y-size" data-a11y-size="130" aria-checked="false" role="radio">130%</button>
            <button class="a11y-size" data-a11y-size="150" aria-checked="false" role="radio">150%</button>
          </div>
        </div>
        <div class="a11y-group">
          <div class="a11y-group-title">ניווט וסימון</div>
          <button class="a11y-toggle" data-a11y="highlight-links" aria-pressed="false">
            <span class="a11y-icon" aria-hidden="true">🔗</span>
            <span class="a11y-label-wrap"><b>הדגש לינקים</b><span>קווים תחתונים והדגשה צהובה</span></span>
          </button>
          <button class="a11y-toggle" data-a11y="highlight-headings" aria-pressed="false">
            <span class="a11y-icon" aria-hidden="true">📑</span>
            <span class="a11y-label-wrap"><b>הדגש כותרות</b><span>הוסף מסגרת ברורה לכותרות</span></span>
          </button>
          <button class="a11y-toggle" data-a11y="cursor-lg" aria-pressed="false">
            <span class="a11y-icon" aria-hidden="true">👆</span>
            <span class="a11y-label-wrap"><b>סמן עכבר גדול</b><span>סמן שחור גדול ובולט</span></span>
          </button>
        </div>
        <div class="a11y-group">
          <div class="a11y-group-title">תנועה</div>
          <button class="a11y-toggle" data-a11y="reduce-motion" aria-pressed="false">
            <span class="a11y-icon" aria-hidden="true">⏸</span>
            <span class="a11y-label-wrap"><b>עצור אנימציות</b><span>בטל אנימציות ומעברים אוטומטיים</span></span>
          </button>
        </div>
        <div class="a11y-actions">
          <button class="a11y-reset" id="a11yReset">↺ איפוס כל ההגדרות</button>
          <a href="accessibility.html" class="a11y-link">📜 הצהרת נגישות מלאה</a>
        </div>
        <div class="a11y-coordinator">
          <b>איש קשר לנושאי נגישות</b>
          <span>דוד בלסי · במקרה של בעיית נגישות באתר, צרו קשר ב-<a href="mailto:balasistore5@gmail.com?subject=נגישות">balasistore5@gmail.com</a></span>
        </div>
      </div>`;
    document.body.appendChild(panel);
  }

  function initA11yToolbar() {
    injectA11yHTML();
    const fab = document.getElementById('a11yFab');
    if (!fab) return;
    fab.addEventListener('click', openA11yPanel);
    document.getElementById('a11yClose')?.addEventListener('click', closeA11yPanel);
    document.querySelectorAll('.a11y-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.dataset.a11y;
        const isOn = btn.getAttribute('aria-pressed') === 'true';
        setA11yToggle(name, !isOn);
      });
    });
    document.querySelectorAll('.a11y-size').forEach(btn => {
      btn.addEventListener('click', () => setA11yTextSize(Number(btn.dataset.a11ySize)));
    });
    document.getElementById('a11yReset')?.addEventListener('click', resetA11yPrefs);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && document.getElementById('a11yPanel')?.classList.contains('open')) {
        closeA11yPanel();
      }
    });
    applyA11yPrefs(loadA11yPrefs());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initA11yToolbar);
  } else {
    initA11yToolbar();
  }

  // Expose for debugging from console
  window.balasiA11y = { setA11yToggle, setA11yTextSize, resetA11yPrefs, openA11yPanel, closeA11yPanel };
})();
