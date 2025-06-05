/* -------------------------------------------------------------------
   Polyoxometalate Explorer – anchored pop-up with spinner + Netlify fetch
   ------------------------------------------------------------------- */
(() => {
  /* ---------------- Configuration -------------------------------- */
  const ENDPOINT = '/.netlify/functions/synthesize';
  const POPUP_WIDTH  = 380;  // fixed dialog width (px)
  const OFFSET_X     = 20;   // px to the right of cursor
  const OFFSET_Y     = 20;   // gap between cursor & pop-up

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
    const style = document.createElement('style');
    style.id    = 'spinner-styles';
    style.textContent = `
      .spinner {
        width: 24px; height: 24px;
        border: 3px solid rgba(0,0,0,.25);
        border-top-color: #000;
        border-radius: 50%;
        animation: spin .8s linear infinite;
        margin-inline: auto;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      .loading-text { text-align: center; font-size: .875rem; margin-top: .5rem; color:#000; }
    `;
    document.head.appendChild(style);
  })();

  /* ---------------- Utility: position pop-up near cursor ---------- */
  function positionPopup(clientX, clientY) {
    /* Convert viewport ➜ document coordinates */
    const pageX = window.scrollX + clientX;
    const pageY = window.scrollY + clientY;

    /* ----- Horizontal: simple right-hand offset, then clamp -------- */
    let left = pageX + OFFSET_X;
    const minLeft = window.scrollX + 8;
    const maxLeft = window.scrollX + document.documentElement.clientWidth - POPUP_WIDTH - 8;
    left = Math.min(Math.max(left, minLeft), maxLeft);

    /* ----- Vertical: prefer above, fall back below ----------------- */
    const roomAbove = clientY;                                     // px from viewport top to cursor
    const needsAbove = dialog.offsetHeight + OFFSET_Y + 8;         // space we’d need

    let top;
    if (roomAbove >= needsAbove) {
      /* Enough room:  place the panel above the cursor */
      top = pageY - dialog.offsetHeight - OFFSET_Y;
    } else {
      /* Not enough room:  flip it below the cursor */
      top = pageY + OFFSET_Y;
    }

    /* Final vertical clamp so it never pokes off-screen */
    const minTop = window.scrollY + 8;
    const maxTop = window.scrollY + document.documentElement.clientHeight - dialog.offsetHeight - 8;
    top = Math.min(Math.max(top, minTop), maxTop);

    /* Apply position */
    dialog.style.position = 'absolute';
    dialog.style.margin   = '0';               // kill UA auto-centring
    dialog.style.width    = `${POPUP_WIDTH}px`;
    dialog.style.left     = `${left}px`;
    dialog.style.top      = `${top}px`;
  }


   
  /* ---------------- Fetch helper ---------------------------------- */
  async function fetchRemoteDetails(record) {
   try {
     /*  Build the body that synthesize.js expects:
         {
           pomData:        full Curated_POMs object,
           procedureData:  matching entry from Procedures.json,
           language:       user-preferred locale
         }
     */
     const body = {
       pomData: record,
       procedureData: (window.PROCEDURE_MAP || {})[record.pomId],
       language: navigator.language
     };

     const res = await fetch("/.netlify/functions/synthesize", {
       method : 'POST',
       headers: { 'Content-Type': 'application/json' },
       body   : JSON.stringify({ pomId, procedure })
     });
     if (!res.ok) throw new Error(`HTTP ${res.status}`);

     /* synthesize.js returns { text: "...", error?: "..." } */
     const { text, error } = await res.json();
     return error || text;
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

    /* Show spinner, open dialog, position near cursor */
    showLoading(recordId);
    dialog.show();                                   // non-modal
    positionPopup(evt.clientX, evt.clientY);

    /* Fetch remote details */
    const remoteText = await fetchRemoteDetails(record);

    /* Display response & re-measure height */
    contentEl.textContent = remoteText;
    positionPopup(evt.clientX, evt.clientY);         // realign if height grew
  }

  /* ---------------- Close button & ESC behaviour ------------------ */
  closeBtn.addEventListener('click', () => dialog.close());
  dialog.addEventListener('cancel', e => e.preventDefault());   // block ESC default

  /* ---------------- Global click listener ------------------------- */
  document.addEventListener('click', handleLinkClick, false);
})();
