/* -------------------------------------------------------------------
   Polyoxometalate Explorer – anchored pop-up with spinner + Netlify fetch
   ------------------------------------------------------------------- */

(() => {
  /* ---------------- Configuration -------------------------------- */
  const ENDPOINT     = 'https://YOUR-NETLIFY-FUNCTION.netlify.app/'; // ← replace later
  const POPUP_WIDTH  = 380;   // fixed dialog width  (px)
  const OFFSET_X     = 20;    // px to the right of cursor
  const OFFSET_Y     = 20;    // px above  cursor

  /* --------------- DOM look-ups ---------------------------------- */
  const dialog    = document.getElementById('detailsPopup');
  const titleEl   = document.getElementById('detailsTitle');
  const contentEl = document.getElementById('detailsContent');
  const closeBtn  = document.getElementById('closePopup');
  if (!dialog || !titleEl || !contentEl || !closeBtn) {
    console.error('details.js: required DOM elements missing');
    return;
  }

  /* ---------------- Spinner styles (inject once) ------------------ */
  (function injectSpinnerCSS() {
    if (document.getElementById('spinner-styles')) return;      // already injected
    const style     = document.createElement('style');
    style.id        = 'spinner-styles';
    style.textContent = `
      .spinner {
        width: 24px; height: 24px;
        border: 3px solid rgba(0,0,0,.25);
        border-top-color: #000;          /* black sweep */
        border-radius: 50%;
        animation: spin .8s linear infinite;
        margin-inline: auto;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      .loading-text { text-align: center; font-size: .875rem; margin-top: .5rem; color:#000; }
    `;
    document.head.appendChild(style);
  })();

  /* ---------------- Utility: position popup near cursor ----------- */
  function positionPopup(mouseX, mouseY) {
    // desired coordinates relative to viewport scroll
    let left = mouseX + OFFSET_X;
    let top  = mouseY - dialog.offsetHeight - OFFSET_Y;

    // keep inside viewport (8 px padding)
    const minLeft = window.scrollX + 8;
    const minTop  = window.scrollY + 8;
    const maxLeft = window.scrollX + document.documentElement.clientWidth  - POPUP_WIDTH - 8;
    const maxTop  = window.scrollY + document.documentElement.clientHeight - dialog.offsetHeight - 8;

    left = Math.min(Math.max(left, minLeft), maxLeft);
    top  = Math.min(Math.max(top,  minTop),  maxTop);

    dialog.style.position = 'absolute';
    dialog.style.width    = `${POPUP_WIDTH}px`;
    dialog.style.left     = `${left}px`;
    dialog.style.top      = `${top}px`;
  }

  /* ---------------- Fetch helper ---------------------------------- */
  async function fetchRemoteDetails(record) {
    try {
      const res = await fetch(ENDPOINT, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(record)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      try { return JSON.stringify(JSON.parse(text), null, 2); } // pretty JSON if possible
      catch { return text; }
    } catch (err) {
      return `Error fetching synthesis: ${err.message}`;
    }
  }

  /* ---------------- Show spinner + loading text ------------------- */
  function showLoading(recordId) {
    titleEl.textContent = recordId;
    contentEl.innerHTML =
      '<div class="spinner"></div>' +
      '<p class="loading-text">Synthesis procedure is being generated…</p>';
  }

  /* ---------------- Link-click handler ---------------------------- */
  async function handleLinkClick(evt) {
    const link = evt.target.closest('.details-link');
    if (!link) return;
    evt.preventDefault();

    const recordId = link.dataset.id;
    const record   = (window.POM_DATA || []).find(d => String(d.pomId) === recordId);
    if (!record) return;

    // show spinner, open dialog, position near cursor
    showLoading(recordId);
    dialog.show();                             // non-modal
    positionPopup(evt.pageX, evt.pageY);

    // fetch remote details
    const remoteText = await fetchRemoteDetails(record);

    // display response & re-measure height
    contentEl.textContent = remoteText;
    positionPopup(evt.pageX, evt.pageY);       // realign if height grew
  }

  /* ---------------- Close button & ESC behaviour ------------------ */
  closeBtn.addEventListener('click', () => dialog.close());
  dialog.addEventListener('cancel', e => e.preventDefault());   // block ESC default

  /* ---------------- Global click listener ------------------------- */
  document.addEventListener('click', handleLinkClick, false);
})();
