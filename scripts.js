'use strict';

const STAKEHOLDERS = {
  customer:   { label: 'Customer',   hint: 'Benefit-led release notes in plain language' },
  gtm:        { label: 'GTM',        hint: 'Persona signals and positioning for sales & marketing' },
  services:   { label: 'Services',   hint: 'Edge cases, assumptions, and escalation triggers' },
  leadership: { label: 'Leadership', hint: 'Goals, metrics, and strategic context' }
};

// Tracks cards currently in the DOM: { stakeholder: { status, content, element } }
const outputs = {};

// Uploaded PRD files: [{ name, content }]
let uploadedFiles = [];

function init() {
  const dropZone  = document.getElementById('file-drop-zone');
  const fileInput = document.getElementById('prd-files');

  dropZone.addEventListener('click',   () => fileInput.click());
  dropZone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });

  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('is-dragging');
  });
  dropZone.addEventListener('dragleave', e => {
    if (!dropZone.contains(e.relatedTarget)) dropZone.classList.remove('is-dragging');
  });
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('is-dragging');
    loadFiles([...e.dataTransfer.files]);
  });

  fileInput.addEventListener('change', () => {
    loadFiles([...fileInput.files]);
    fileInput.value = ''; // reset so same file can be re-added after removal
  });

  document.querySelectorAll('input[name="stakeholder"]').forEach(cb => {
    cb.addEventListener('change', updateGenerateButton);
  });

  document.getElementById('generate-btn').addEventListener('click', generate);
  document.getElementById('download-all-btn').addEventListener('click', downloadAll);
}

function loadFiles(files) {
  const mdFiles = files.filter(f => f.name.toLowerCase().endsWith('.md'));
  if (mdFiles.length === 0) return;

  Promise.all(mdFiles.map(readFile)).then(results => {
    const existing = new Set(uploadedFiles.map(f => f.name));
    results.forEach(r => { if (!existing.has(r.name)) uploadedFiles.push(r); });
    renderFileList();
    updateGenerateButton();
  });
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve({ name: file.name, content: e.target.result });
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function renderFileList() {
  const list = document.getElementById('file-list');
  list.hidden = uploadedFiles.length === 0;
  list.innerHTML = uploadedFiles.map((f, i) => `
    <li class="file-item">
      <span class="file-name">${f.name}</span>
      <button class="file-remove" data-index="${i}" aria-label="Remove ${f.name}">✕</button>
    </li>
  `).join('');

  list.querySelectorAll('.file-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      uploadedFiles.splice(+btn.dataset.index, 1);
      renderFileList();
      updateGenerateButton();
    });
  });
}

function updateGenerateButton() {
  const selected = getSelected();
  const btn  = document.getElementById('generate-btn');
  const hint = document.getElementById('btn-hint');

  if (uploadedFiles.length === 0) {
    btn.disabled     = true;
    hint.textContent = 'Upload a PRD to continue';
  } else if (selected.length === 0) {
    btn.disabled     = true;
    hint.textContent = 'Select at least one stakeholder';
  } else {
    btn.disabled     = false;
    const fileLabel  = uploadedFiles.length === 1 ? '1 file' : `${uploadedFiles.length} files`;
    hint.textContent = `Generate ${selected.length} output${selected.length > 1 ? 's' : ''} from ${fileLabel}`;
  }
}

function getSelected() {
  return [...document.querySelectorAll('input[name="stakeholder"]:checked')].map(cb => cb.value);
}

async function generate() {
  const selected = getSelected();
  const btn      = document.getElementById('generate-btn');

  btn.disabled = true;
  btn.classList.add('is-generating');
  document.getElementById('btn-hint').textContent = `Generating ${selected.length} output${selected.length > 1 ? 's' : ''}…`;

  showOutputGrid(selected);

  await Promise.all(selected.map(s => generateFor(s, uploadedFiles)));

  btn.classList.remove('is-generating');
  updateGenerateButton();
}

function showOutputGrid(stakeholders) {
  document.getElementById('output-empty').hidden = true;
  document.querySelector('.output-panel').scrollTop = 0;
  document.getElementById('output-toolbar').hidden = false;
  const grid = document.getElementById('output-grid');
  grid.hidden = false;

  stakeholders.forEach(s => {
    if (outputs[s] && outputs[s].element) {
      resetCard(outputs[s].element);
      outputs[s].status  = 'loading';
      outputs[s].content = '';
    } else {
      const card = createCard(s);
      grid.appendChild(card);
      outputs[s] = { status: 'loading', content: '', element: card };
    }
  });
}

function createCard(stakeholder) {
  const { label, hint } = STAKEHOLDERS[stakeholder];
  const card = document.createElement('div');
  card.className           = 'output-card';
  card.dataset.stakeholder = stakeholder;

  card.innerHTML = `
    <div class="card-header">
      <div class="card-title-group">
        <h2 class="card-title">${label}</h2>
        <span class="card-hint">${hint}</span>
      </div>
      <button class="download-btn" disabled aria-label="Download ${label} output as markdown">Download .md</button>
    </div>
    <div class="card-body">
      <div class="card-loading" role="status" aria-label="Generating ${label} output">
        <div class="shimmer shimmer--lg"></div>
        <div class="shimmer shimmer--md"></div>
        <div class="shimmer shimmer--sm"></div>
        <div class="shimmer shimmer--md"></div>
        <div class="shimmer shimmer--lg"></div>
      </div>
      <textarea class="output-textarea" hidden spellcheck="false"
        aria-label="${label} output — editable before download"></textarea>
      <div class="card-error" hidden>
        <p class="error-msg"></p>
        <button class="retry-btn">Retry</button>
      </div>
    </div>
  `;

  card.querySelector('.download-btn').addEventListener('click', () => download(stakeholder));
  card.querySelector('.retry-btn').addEventListener('click', () => retry(stakeholder));

  return card;
}

function resetCard(card) {
  card.querySelector('.card-loading').hidden    = false;
  card.querySelector('.output-textarea').hidden = true;
  card.querySelector('.card-error').hidden      = true;
  card.querySelector('.download-btn').disabled  = true;
}

async function generateFor(stakeholder, files) {
  try {
    const res = await fetch('/api/generate', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ prdTexts: files, stakeholder })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

    outputs[stakeholder].status  = 'done';
    outputs[stakeholder].content = data.content;
    setDone(outputs[stakeholder].element, stakeholder, data.content);
  } catch (err) {
    setError(outputs[stakeholder].element, err.message);
    outputs[stakeholder].status = 'error';
  }
}

function setDone(card, stakeholder, content) {
  card.querySelector('.card-loading').hidden = true;
  card.querySelector('.card-error').hidden   = true;

  const ta = card.querySelector('.output-textarea');
  ta.hidden = false;
  ta.value  = content;
  ta.style.height = 'auto';
  ta.style.height = Math.min(ta.scrollHeight, 560) + 'px';

  ta.addEventListener('input', () => { outputs[stakeholder].content = ta.value; });

  const btn = card.querySelector('.download-btn');
  btn.disabled = false;
  updateDownloadAllBtn();
}

function setError(card, message) {
  card.querySelector('.card-loading').hidden    = true;
  card.querySelector('.output-textarea').hidden = true;

  const errEl = card.querySelector('.card-error');
  errEl.hidden = false;
  errEl.querySelector('.error-msg').textContent = `Generation failed: ${message}`;
}

function retry(stakeholder) {
  if (uploadedFiles.length === 0) return;

  resetCard(outputs[stakeholder].element);
  outputs[stakeholder].status  = 'loading';
  outputs[stakeholder].content = '';
  generateFor(stakeholder, uploadedFiles);
}

function download(stakeholder) {
  const content = outputs[stakeholder]?.content;
  if (!content) return;

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `release-handover-${stakeholder}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function updateDownloadAllBtn() {
  const all     = Object.values(outputs);
  const done    = all.filter(o => o.status === 'done');
  const loading = all.filter(o => o.status === 'loading');
  const btn     = document.getElementById('download-all-btn');
  const hint    = document.getElementById('download-all-hint');
  const enabled = loading.length === 0 && done.length > 0;
  btn.disabled     = !enabled;
  hint.textContent = enabled ? `${done.length} .md ${done.length === 1 ? 'file' : 'files'}` : '';
}

function getExportFolderName() {
  const prdCount  = uploadedFiles.length;
  const doneCount = Object.values(outputs).filter(o => o.status === 'done').length;
  const prdLabel  = prdCount === 1 ? '1 PRD' : `${prdCount} PRDs`;
  const stLabel   = doneCount === 1 ? '1 stakeholder' : `${doneCount} stakeholders`;
  const ts        = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/:/g, '-');
  return `${prdLabel} - ${stLabel} - ${ts}`;
}

async function downloadAll() {
  const done = Object.entries(outputs).filter(([, o]) => o.status === 'done');
  if (done.length === 0) return;

  const folderName = getExportFolderName();
  const zip        = new JSZip();
  const folder     = zip.folder(folderName);

  done.forEach(([stakeholder, o]) => {
    folder.file(`release-handover-${stakeholder}.md`, o.content);
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${folderName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', init);
