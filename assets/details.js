/* ------- anchored pop-up with spinner + Netlify fetch --------- */
(() => {




  /* ---------------- Configuration -------------------------------- */
  
  const ENDPOINT    = '/.netlify/functions/synthesize';
  const POPUP_WIDTH = 380;
  const OFFSET_X    = 20;
  const OFFSET_Y    = 20;




  /* --------------- Procedure Language Input --------------------*/
  
  function getLanguage() {
  const el = document.getElementById('languageInput');
  const v = el && el.value ? el.value.trim() : '';
  return v || 'English';                                  // default if empty or missing
}
  
  
  
  
  /* ------------- load Procedures json ---------------*/
  
  let PROCEDURE_MAP = null;
  
  async function getProcedure (id) {
    if (!id) return null;
    if (!PROCEDURE_MAP) {
      const data = await (await fetch('/data/procedures_20250526.json')).json();
  
      if (Array.isArray(data.procedures)) {
        PROCEDURE_MAP = Object.fromEntries(
          data.procedures.map(p => [String(p.procedure_information.id), p])
        );
  
      } else if (Array.isArray(data)) {
        PROCEDURE_MAP = Object.fromEntries(
          data.map(p => [String(p.procedure_information.id), p])
        );
  
      } else {
        PROCEDURE_MAP = data;
      }
    }
    return PROCEDURE_MAP[String(id)];
  }
  
  
  
  
  /* --------------- DOM look-ups ---------------------------------- */
  
  const dialog    = document.getElementById('detailsPopup');
  const titleEl   = document.getElementById('detailsTitle');
  const contentEl = document.getElementById('detailsContent');
  const closeBtn  = document.getElementById('closePopup');
  if (!dialog || !titleEl || !contentEl || !closeBtn) {
    console.error('details.js: required DOM elements missing');
    return;
  }
  
  
  
  
  /* ---------------- Spinner styles ------------------ */
  
  (function injectSpinnerCSS () {
    if (document.getElementById('spinner-styles')) return;
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
  
  
  
  
  /* ---------------- position pop-up near cursor ---------- */
  
  function positionPopup (clientX, clientY) {
    const pageX = window.scrollX + clientX;
    const pageY = window.scrollY + clientY;
  
  
    
    let left = pageX + OFFSET_X;
    const minLeft = window.scrollX + 8;
    const maxLeft = window.scrollX + document.documentElement.clientWidth - POPUP_WIDTH - 8;
    left = Math.min(Math.max(left, minLeft), maxLeft);
  
  
    
    const roomAbove  = clientY;
    const needsAbove = dialog.offsetHeight + OFFSET_Y + 8;
  
    let top;
    if (roomAbove >= needsAbove) {
      top = pageY - dialog.offsetHeight - OFFSET_Y;
    } else {
      top = pageY + OFFSET_Y;
    }
  
    const minTop = window.scrollY + 8;
    const maxTop = window.scrollY + document.documentElement.clientHeight - dialog.offsetHeight - 8;
    top = Math.min(Math.max(top, minTop), maxTop);
  
    dialog.style.position = 'absolute';
    dialog.style.margin   = '0';
    dialog.style.width    = `${POPUP_WIDTH}px`;
    dialog.style.left     = `${left}px`;
    dialog.style.top      = `${top}px`;
  }
  
  
  
  
  /* ---------------- Fetch helper ---------------------------------- */
  
async function fetchRemoteDetails(record) {
  try {
    const body = {
      pomId    : record.pomId,
      procedure: await getProcedure(record.procedureID),
      language : getLanguage()
    };

    if (!body.procedure) return 'No synthesis information available for this POM.';

    const res = await fetch(ENDPOINT, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify(body)
    });

    const { text, error } = await res.json().catch(() => ({}));
    if (!res.ok) return `Server error ${res.status}: ${error || text || 'no details'}`;
    return text;

  } catch (err) {
    return `Error fetching synthesis: ${err.message}`;
  }
}
  
  
  
  
  /* ---------------- Show spinner + loading text ------------------- */
  
  function showLoading (recordId) {
    titleEl.textContent = recordId;
    contentEl.innerHTML =
      '<div class="spinner"></div>' +
      '<p class="loading-text">Synthesis procedure is being generated…</p>';
  }
  
  
  
  
  /* ---------------- Link-click handler ---------------------------- */
  
  async function handleLinkClick (evt) {
    const link = evt.target.closest('.details-link');
    if (!link) return;
    evt.preventDefault();
  
    const recordId = link.dataset.id;
    const record   = (window.POM_DATA || []).find(d => String(d.pomId) === recordId);
    if (!record) return;
  
    showLoading(recordId);
    dialog.show();
    positionPopup(evt.clientX, evt.clientY);
  
    const remoteText = await fetchRemoteDetails(record);
  
    contentEl.textContent = remoteText;
    positionPopup(evt.clientX, evt.clientY);
  }
  
  
  
  
  /* ---------------- Close button & ESC behaviour ------------------ */
  
  closeBtn.addEventListener('click', () => dialog.close());
  dialog.addEventListener('cancel', e => e.preventDefault());
  
  
  
  
  /* ---------------- Global click listener ------------------------- */
  
  document.addEventListener('click', handleLinkClick, false);
  
  
  
  
})();
