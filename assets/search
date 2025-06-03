/* -------------------------------------------------------------------
   Polyoxometalate Explorer – search & table rendering logic
   ------------------------------------------------------------------- */

(() => {
  /**
   * Configuration (edit only here)
   * -----------------------------------------------------------------
   * linkKey   – the property that becomes a clickable <a> link in the table
   * dataFile  – primary dataset (all basic POM records)
   */
  const CONFIG = {
    linkKey: document.getElementById('resultsTable').dataset.linkKey || 'pomId',
    dataFile: 'data/Curated_POMs.json',
  };

  let fullDataset = [];

  /* -------------------------------
     Fetch JSON dataset & bootstrap
     -------------------------------*/
  async function init() {
    try {
      const response = await fetch(CONFIG.dataFile);
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      fullDataset = await response.json();

      // Expose globally so details.js can read it
      window.POM_DATA = fullDataset;

      hydrateLabelSelect();
      renderTable(fullDataset);
      bindFormEvents();
    } catch (err) {
      console.error('Failed to load dataset', err);
    }
  }

  /* -------------------------------
     Populate the "Label" <select>
     -------------------------------*/
  function hydrateLabelSelect() {
    const select = document.getElementById('searchLabel');
    if (!select) return;

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

  /* -------------------------------
     Form helpers
     -------------------------------*/
  function collectFilters() {
    const form = document.getElementById('searchForm');
    const fd = new FormData(form);

    return {
      pomId: fd.get('pomId').trim(),
      formula: fd.get('formula').trim(),
      elements: fd.get('elements').split(',').map(e => e.trim()).filter(Boolean),
      mass: fd.get('mass').trim(),
      charge: fd.get('charge').trim(),
      label: fd.get('label').trim(),
      material: fd.get('material').trim(),
      doi: fd.get('doi').trim(),
    };
  }

  function matchesFilters(item, f) {
    // Helper: safe lower‑case string compare
    const contains = (field, value) => String(field || '').toLowerCase().includes(value.toLowerCase());

    if (f.pomId && !contains(item.pomId, f.pomId)) return false;
    if (f.formula && !contains(item.formula, f.formula)) return false;

    if (f.elements.length) {
      const itemEls = Array.isArray(item.elements)
        ? item.elements.map(e => e.toLowerCase())
        : String(item.elements || '').toLowerCase().split(/[,\s]+/);
      for (const el of f.elements) if (!itemEls.includes(el.toLowerCase())) return false;
    }

    if (f.mass && Number(item.mass) !== Number(f.mass)) return false;
    if (f.charge && String(item.charge) !== String(f.charge)) return false;
    if (f.label && item.label !== f.label) return false;
    if (f.material && !contains(item.material, f.material)) return false;
    if (f.doi && !contains(item.doi, f.doi)) return false;

    return true;
  }

  /* -------------------------------
     Render table rows
     -------------------------------*/
  function renderTable(dataset) {
    const tbody = document.querySelector('#resultsTable tbody');
    const linkKey = CONFIG.linkKey;
    tbody.innerHTML = '';

    const rowsFrag = document.createDocumentFragment();
    dataset.forEach(item => {
      const tr = document.createElement('tr');
      const elementsCell = Array.isArray(item.elements) ? item.elements.join(', ') : (item.elements || '');
      tr.innerHTML = `
        <td>${linkKey in item ? `<a href="#" class="details-link" data-id="${item[linkKey]}">${item[linkKey]}</a>` : (item[linkKey] || '')}</td>
        <td>${item.formula || ''}</td>
        <td>${elementsCell}</td>
        <td>${item.mass ?? ''}</td>
        <td>${item.charge ?? ''}</td>
        <td>${item.label ?? ''}</td>
        <td>${item.material ?? item.materialFormula ?? ''}</td>
        <td>${item.doi ?? ''}</td>
      `;
      rowsFrag.appendChild(tr);
    });

    tbody.appendChild(rowsFrag);
  }

  /* -------------------------------
     Bind form submit / reset
     -------------------------------*/
  function bindFormEvents() {
    const form = document.getElementById('searchForm');
    if (!form) return;

    form.addEventListener('submit', ev => {
      ev.preventDefault();
      const filters = collectFilters();
      const filtered = fullDataset.filter(item => matchesFilters(item, filters));
      renderTable(filtered);
    });

    form.addEventListener('reset', () => {
      // allow reset to finish, then re-render everything
      setTimeout(() => renderTable(fullDataset), 0);
    });
  }

  /* Kick things off */
  document.addEventListener('DOMContentLoaded', init);
})();
