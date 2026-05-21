'use strict';

const STAKEHOLDERS = {
  customer:   { label: 'Customer',   hint: 'Benefit-led release notes in plain language' },
  gtm:        { label: 'GTM',        hint: 'Persona signals and positioning for sales & marketing' },
  services:   { label: 'Services',   hint: 'Edge cases, assumptions, and escalation triggers' },
  leadership: { label: 'Leadership', hint: 'Goals, metrics, and strategic context' }
};

// Tracks cards currently in the DOM: { stakeholder: { status, content, element } }
const outputs = {};

function init() {
  const prdInput   = document.getElementById('prd-input');
  const generateBtn = document.getElementById('generate-btn');

  prdInput.addEventListener('input', () => {
    updateWordCount(prdInput.value);
    updateGenerateButton();
  });

  document.querySelectorAll('input[name="stakeholder"]').forEach(cb => {
    cb.addEventListener('change', updateGenerateButton);
  });

  generateBtn.addEventListener('click', generate);
}

function updateWordCount(text) {
  const el    = document.getElementById('word-count');
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  if (words === 0) { el.textContent = ''; el.className = 'word-count'; return; }

  el.textContent = `${words.toLocaleString()} words`;
  if (words > 4000) {
    el.className  = 'word-count word-count--warn';
    el.textContent += ' — long PRDs may affect output quality';
  } else {
    el.className = 'word-count';
  }
}

function updateGenerateButton() {
  const prd      = document.getElementById('prd-input').value.trim();
  const selected = getSelected();
  const btn      = document.getElementById('generate-btn');
  const hint     = document.getElementById('btn-hint');

  if (!prd) {
    btn.disabled   = true;
    hint.textContent = 'Paste a PRD to continue';
  } else if (selected.length === 0) {
    btn.disabled   = true;
    hint.textContent = 'Select at least one stakeholder';
  } else {
    btn.disabled   = false;
    hint.textContent = `Generate ${selected.length} output${selected.length > 1 ? 's' : ''}`;
  }
}

function getSelected() {
  return [...document.querySelectorAll('input[name="stakeholder"]:checked')].map(cb => cb.value);
}

async function generate() {
  const prd      = document.getElementById('prd-input').value.trim();
  const selected = getSelected();
  const btn      = document.getElementById('generate-btn');

  btn.disabled = true;
  btn.classList.add('is-generating');
  document.getElementById('btn-hint').textContent = `Generating ${selected.length} output${selected.length > 1 ? 's' : ''}`;

  showOutputGrid(selected);

  await Promise.all(selected.map(s => generateFor(s, prd)));

  btn.classList.remove('is-generating');
  updateGenerateButton();
}

function showOutputGrid(stakeholders) {
  document.getElementById('output-empty').hidden = true;
  document.querySelector('.output-panel').scrollTop = 0;
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
  card.className          = 'output-card';
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
  card.querySelector('.card-loading').hidden  = false;
  card.querySelector('.output-textarea').hidden = true;
  card.querySelector('.card-error').hidden    = true;
  card.querySelector('.download-btn').disabled = true;
}

async function generateFor(stakeholder, prd) {
  try {
    const res = await fetch('/api/generate', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ prdText: prd, stakeholder })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

    setDone(outputs[stakeholder].element, stakeholder, data.content);
    outputs[stakeholder].status  = 'done';
    outputs[stakeholder].content = data.content;
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
}

function setError(card, message) {
  card.querySelector('.card-loading').hidden   = true;
  card.querySelector('.output-textarea').hidden = true;

  const errEl = card.querySelector('.card-error');
  errEl.hidden = false;
  errEl.querySelector('.error-msg').textContent = `Generation failed: ${message}`;
}

function retry(stakeholder) {
  const prd = document.getElementById('prd-input').value.trim();
  if (!prd) return;

  resetCard(outputs[stakeholder].element);
  outputs[stakeholder].status  = 'loading';
  outputs[stakeholder].content = '';
  generateFor(stakeholder, prd);
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

document.addEventListener('DOMContentLoaded', init);
