/* -------------------------------------------------------------------
   Polyoxometalate Explorer – anchored pop‑up with spinner + Netlify fetch
   ------------------------------------------------------------------- */

(() => {
  /* ---------------- Configuration -------------------------------- */
  const ENDPOINT = 'https://YOUR-NETLIFY-FUNCTION.netlify.app/'; // ← replace later
  const POPUP_WIDTH = 380;                                       // fixed width (px)

  /* --------------- DOM look‑ups ---------------------------------- */
  const dialog    = document.getElementById('detailsPopup');
  const titleEl   = document.getElementById('detailsTitle');
  const contentEl = document.getElementById('detailsContent');
  const closeBtn  = document.getElementById('closePopup');

  if (!dialog || !titleEl || !contentEl || !closeBtn) {
    console.error('details.js: required DOM elements missing');
    return;
  }

  /* ---------------- Spinner styles (inject once) ------------------ */
  (function injectSpinnerCSS () {
    if (document.getElementById('spinner-styles')) return; // already injected

    const style = document.createElement('style');
    style.id = 'spinner-styles';
    style.textContent = `
      .spinner { width: 24px; height: 24px; border: 3px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; margin-inline: auto; }
      @keyframes spin { to { transform: rotate(360deg); }}
      .loading-text { text-align: center; font-size: 0.875rem; margin-top: .5rem; }
    `;
    document.head.appendChild(style);
  })();

  /* ---------------- Utility: position popup above link ------------ */
  function positionPopup(anchorRect) {
    const scrollY = window.scrollY || window.pageYOffset;
    const scrollX = window.scrollX || window.pageXOffset;

    // Center horizontally on anchor; place 12px above it.
    const top  = anchorRect.top  + scrollY - dialog.offsetHeight - 12;
    const left = anchorRect.left + scrollX + anchorRect.width / 2 - POPUP_WIDTH / 2;

    dialog.style.position = 'absolute'; // override default dialog centering
    dialog.style.width    = POPUP_WIDTH + 'px';
    dialog.style.left     = Math.max(8, left) + 'px';
    dialog.style.top      = Math.max(8, top)  + 'px';
  }

  /* ---------------- Fetch helper ---------------------------------- */
  async function fetchRemoteDetails(record) {
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const text = await res.text();
      try { return JSON.stringify(JSON.parse(text), null, 2); } // pretty JSON
      catch { return text; }
    } catch (err) {
      return `Error fetching synthesis: ${err.message}`;
    }
  }

  /* ---------------- Show spinner + loading text ------------------- */
  function showLoading(recordId) {
    titleEl.textContent = `${recordId}`;
    contentEl.innerHTML = '<div class="spinner"></div><p class="loading-text">Synthesis procedure is being generated…</p>';
  }

  /* ---------------- Link‑click handler ---------------------------- */
  async function handleLinkClick (evt) {
    const link = evt.target.closest('.details-link');
    if (!link) return;
    evt.preventDefault();

    const id      = link.dataset.id;
    const record  = (window.POM_DATA || []).find(d => String(d.pomId) === id);
    if (!record) return;

    showLoading(id);
    dialog.show(); // non‑modal so we can reposition freely

    // position after show() so offsetHeight is known
    positionPopup(link.getBoundingClientRect());

    const remoteText = await fetchRemoteDetails(record);

    // inject response & let height expand
    contentEl.textContent = remoteText;

    // reposition again in case height changed (keep arrow aligned)
    positionPopup(link.getBoundingClientRect());
  }

  /* ---------------- Close button ---------------------------------- */
  closeBtn.addEventListener('click', () => dialog.close());

  /* block ESC key default (keeps content if user presses esc) */
  dialog.addEventListener('cancel', e => e.preventDefault());

  /* ---------------- Global click listener ------------------------- */
  document.addEventListener('click', handleLinkClick, false);
})();
