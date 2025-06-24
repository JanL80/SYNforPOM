/* -------------------------------------------------------------------
   Polyoxometalate Explorer – search & table rendering logic
   ------------------------------------------------------------------- */

(() => {

  const CONFIG = {
    linkKey: document.getElementById('resultsTable').dataset.linkKey || 'procedureID',
    dataFile: 'data/Curated_POMs.json',
  };

   
   /* ---------- load of Procedures.json -----------------------------------------------*/
let PROCEDURE_SET = null;

async function ensureProcedureSet () {
  if (PROCEDURE_SET) return PROCEDURE_SET;          // already in memory

  const resp  = await fetch('data/procedures_20250526.json');
  const data  = await resp.json();                  // ← use “data”, not “json”
  let ids     = [];

  if (Array.isArray(data.procedures)) {             // layout (a)
    ids = data.procedures.map(p => p.procedure_information.id);

  } else if (Array.isArray(data)) {                 // layout (b)
    ids = data.map(p => p.procedure_information.id);

  } else {                                          // layout (c)
    ids = Object.keys(data);
  }

  PROCEDURE_SET = new Set(ids.map(String));
  return PROCEDURE_SET;
}

  let fullDataset = [];
   
  /* ------------------ Fetch JSON dataset & bootstrap -------------------------------*/
  async function init() {
    try {
      const response = await fetch(CONFIG.dataFile);
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);

      const raw = await response.json();
      fullDataset = Object.entries(raw).map(([id, rec]) => {
        const matBlock = rec['POM Material Formula']
          ? Object.values(rec['POM Material Formula'])[0]
          : {};
        return {
          pomId: id,
          formula: rec['POM Formula'] || rec['Molecular Formula'] || '',
          elements: rec['Contains Elements']
            ? Object.keys(rec['Contains Elements'])
            : [],
          mass: rec['Molecular Mass'] || '',
          charge: rec['Charge'] ?? '',
          label: Array.isArray(rec['Labels']) ? rec['Labels'][0] : rec['Labels'] || '',
          material: matBlock['POM Material Formula'] || '',
          doi: matBlock['DOI'] || '',
          procedureID: matBlock['procedure_id'] || ''
        };
      });

      window.POM_DATA = fullDataset;

      hydrateLabelSelect();
      initLabelPicker();
      renderTable(fullDataset);
      bindFormEvents();
    } catch (err) {
      console.error('Failed to load dataset', err);
    }
  }

  /* -------------- Populate the "Label" <select> -------------------------------*/
  function hydrateLabelSelect() {
    const select = document.getElementById('searchLabel');
    if (!select) return;
     
    const anyOpt        = document.createElement('option');
    anyOpt.value        = '';
    anyOpt.textContent  = 'Any'; 
    anyOpt.selected     = true;    
    anyOpt.dataset.any  = 'true'; 
    select.appendChild(anyOpt);
     
    const uniqueLabels = [...new Set(fullDataset.map(d => d.label).filter(Boolean))].sort();
    const frag = document.createDocumentFragment();
    uniqueLabels.forEach(label => {
      const option = document.createElement('option');
      option.value = label;
      option.textContent = label;
      frag.appendChild(option);
    });
    select.appendChild(frag);
  }


   let activeLabels = new Set();
 
function initLabelPicker () {
  const list = document.getElementById('searchLabel');
  const box  = document.getElementById('chosenLabels');

  function redraw () {
    box.innerHTML = '';
    activeLabels.forEach(lbl => {
      const pill = document.createElement('span');
      pill.className = 'pill';
      pill.textContent = lbl;

      const btn = document.createElement('button');
      btn.textContent = '×';
      btn.addEventListener('click', () => {
        activeLabels.delete(lbl);
        redraw();
      });

      pill.prepend(btn);
      box.appendChild(pill);
    });
  }

  /* click on an option → add it */
  list.addEventListener('change', () => {
  const val = list.value;
  if (val === '') {
    activeLabels.clear();
    box.innerHTML = '';
    list.selectedIndex = 0;
    return;
  }
  if (activeLabels.has(val)) return;

    activeLabels.add(val);
    redraw();
  });
}

  


   
/* ------------------------- Form helpers ------------------------- */
function collectFilters () {
  const fd = new FormData(document.getElementById('searchForm'));
  return {
    pomId   : fd.get('pomId').trim(),
    formula : fd.get('formula').trim(),
    elements: fd.get('elements').split(',').map(e => e.trim()).filter(Boolean),
    massMin : fd.get('massMin').trim(),
    massMax : fd.get('massMax').trim(),
    chargeMin: fd.get('chargeMin').trim(),
    hasProcedure: fd.has('hasProcedure'),
    chargeMax: fd.get('chargeMax').trim(),
    labels : [...activeLabels],
    material: fd.get('material').trim(),
    doi     : fd.get('doi').trim(),
  };
}

  function matchesFilters(item, f) {
    const contains = (field, value) => String(field || '').toLowerCase().includes(value.toLowerCase());

    if (f.pomId && !contains(item.pomId, f.pomId)) return false;
    if (f.formula && !contains(item.formula, f.formula)) return false;

    if (f.elements.length) {
      const itemEls = Array.isArray(item.elements)
        ? item.elements.map(e => e.toLowerCase())
        : String(item.elements || '').toLowerCase().split(/[\\s,]+/);
      for (const el of f.elements) if (!itemEls.includes(el.toLowerCase())) return false;}

    if ((f.massMin && Number(item.mass) < Number(f.massMin)) ||
         (f.massMax && Number(item.mass) > Number(f.massMax))) {
        return false;}
    if ((f.chargeMin && Number(item.charge) < Number(f.chargeMin)) ||
         (f.chargeMax && Number(item.charge) > Number(f.chargeMax))) {
        return false;}
    if (f.labels.length && !f.labels.includes(item.label)) return false;
    if (f.material && !contains(item.material, f.material)) return false;
    if (f.doi && !contains(item.doi, f.doi)) return false;
    
     if (f.hasProcedure && !PROCEDURE_SET.has(String(item.procedureID))) { 
        return false;}

    return true;
  }

  /* -------------------------- Render table rows -------------------------------*/
  function renderTable(dataset) {
    const tbody = document.querySelector('#resultsTable tbody');
    const linkKey = CONFIG.linkKey;
    tbody.innerHTML = '';

    const frag = document.createDocumentFragment();
    dataset.forEach(item => {
      const tr = document.createElement('tr');
      const elementsCell = Array.isArray(item.elements) ? item.elements.join(', ') : item.elements || '';
      tr.innerHTML = `
        <td>${linkKey in item ? `<a href="#" class="details-link" data-id="${item[linkKey]}">${item[linkKey]}</a>` : ''}</td>
        <td>${elementsCell}</td>
        <td>${item.mass}</td>
        <td>${item.charge}</td>
        <td>${item.label}</td>
        <td>${item.formula}</td>
        <td>${item.material}</td>
        <td>${item.doi}</td>
      `;
      frag.appendChild(tr);
    });
    tbody.appendChild(frag);
  }

  /* ------------------------ Bind form submit / reset -------------------------------*/
  function bindFormEvents() {
    const form = document.getElementById('searchForm');
    form.addEventListener('submit', async e => {
       e.preventDefault();
       const filters = collectFilters();
       if (filters.hasProcedure) await ensureProcedureSet();
       renderTable(fullDataset.filter(item => matchesFilters(item, filters)));
    });
    form.addEventListener('reset', () => {
      activeLabels.clear();
      document.getElementById('chosenLabels').innerHTML = '';
      const list = document.getElementById('searchLabel');
      [...list.options].forEach(o => (o.selected = false));
      list.selectedIndex = 0;
      setTimeout(() => renderTable(fullDataset), 0);
});

  }

  /* Kick it off */
  document.addEventListener('DOMContentLoaded', init);
})();
