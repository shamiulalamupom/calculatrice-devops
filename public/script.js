/* ============================================================
   TERMINAL · CALC MK II — Client
   Hands all evaluation off to the Node backend (/api/calculate).
   Keeps a mirror of history rendered from /api/history.
   ============================================================ */

(() => {
  'use strict';

  const expressionEl = document.querySelector('[data-expression]');
  const resultEl = document.querySelector('[data-result]');
  const historyEl = document.querySelector('[data-history]');
  const statusEl = document.querySelector('[data-status]');
  const ledEl = document.querySelector('[data-led]');
  const errorMetaEl = document.querySelector('[data-meta-error]');

  /** State */
  let buffer = '';        // user-typed expression
  let lastResult = null;  // last numeric result (for chaining)
  let justComputed = false;

  // Map for display formatting only (input characters are ASCII).
  const PRETTY = {
    '*': '×',
    '/': '÷',
    '-': '−',
  };

  /** Render the display from current state. */
  function render() {
    if (!buffer) {
      expressionEl.innerHTML = '&nbsp;';
      resultEl.textContent = lastResult !== null ? formatNumber(lastResult) : '0';
      return;
    }

    let pretty = buffer;
    for (const [k, v] of Object.entries(PRETTY)) {
      pretty = pretty.split(k).join(v);
    }
    expressionEl.textContent = pretty;

    // When the buffer is short we mirror to result too, so it feels live.
    if (!justComputed) {
      resultEl.textContent = pretty;
    }
  }

  function formatNumber(n) {
    if (!Number.isFinite(n)) return 'ERR';
    // Avoid scientific notation for normal magnitudes.
    if (Math.abs(n) >= 1e-6 && Math.abs(n) < 1e15) {
      // Trim trailing zeros while preserving precision.
      const s = Number(n.toPrecision(12)).toString();
      return s;
    }
    return n.toExponential(6);
  }

  function setStatus(text, kind) {
    statusEl.textContent = text;
    ledEl.classList.toggle('is-error', kind === 'error');
    errorMetaEl.hidden = kind !== 'error';
    resultEl.classList.toggle('is-error', kind === 'error');
  }

  function pop() {
    resultEl.classList.remove('is-pop');
    // Re-trigger animation
    void resultEl.offsetWidth;
    resultEl.classList.add('is-pop');
  }

  /** Input handlers */
  function input(token) {
    // After a computed result, typing a digit resets; typing an operator chains.
    if (justComputed) {
      if (/[0-9.(]/.test(token) || token === 'sqrt(') {
        buffer = '';
      } else if (lastResult !== null) {
        buffer = String(lastResult);
      }
      justComputed = false;
      setStatus('READY');
    }
    buffer += token;
    render();
  }

  function clearAll() {
    buffer = '';
    lastResult = null;
    justComputed = false;
    setStatus('READY');
    render();
  }

  function backspace() {
    if (justComputed) {
      clearAll();
      return;
    }
    // remove a multi-char function token if present
    if (buffer.endsWith('sqrt(')) {
      buffer = buffer.slice(0, -5);
    } else {
      buffer = buffer.slice(0, -1);
    }
    render();
  }

  async function equals() {
    const expr = buffer.trim();
    if (!expr) return;

    try {
      const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ expression: expr }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus(data.error ? data.error.toUpperCase().slice(0, 24) : 'ERROR', 'error');
        resultEl.textContent = 'ERR';
        justComputed = false;
        return;
      }

      lastResult = data.result;
      expressionEl.textContent = formatExpressionPretty(expr) + ' =';
      resultEl.textContent = formatNumber(data.result);
      buffer = String(data.result);
      justComputed = true;
      setStatus('OK');
      pop();
      // Refresh history (server is source of truth)
      loadHistory();
    } catch (err) {
      setStatus('NETWORK', 'error');
      resultEl.textContent = 'ERR';
    }
  }

  function formatExpressionPretty(expr) {
    let s = expr;
    for (const [k, v] of Object.entries(PRETTY)) {
      s = s.split(k).join(v);
    }
    return s;
  }

  /** History */
  async function loadHistory() {
    try {
      const res = await fetch('/api/history');
      const { history } = await res.json();
      renderHistory(history);
    } catch {
      // Silent — history is non-essential
    }
  }

  function renderHistory(history) {
    if (!history || history.length === 0) {
      historyEl.innerHTML = '<li class="history__empty">No entries yet.</li>';
      return;
    }
    historyEl.innerHTML = '';
    for (const entry of history) {
      const li = document.createElement('li');
      li.className = 'history__item';
      li.dataset.expression = entry.expression;
      li.dataset.result = entry.result;
      li.innerHTML = `
        <div class="history__item__expr">${escapeHtml(formatExpressionPretty(entry.expression))}</div>
        <div class="history__item__result">= ${escapeHtml(formatNumber(entry.result))}</div>
      `;
      li.addEventListener('click', () => {
        buffer = String(entry.result);
        justComputed = true;
        lastResult = entry.result;
        setStatus('RECALL');
        render();
      });
      historyEl.appendChild(li);
    }
  }

  async function clearHistory() {
    try {
      await fetch('/api/history', { method: 'DELETE' });
      loadHistory();
    } catch {}
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /** Wire up buttons */
  document.querySelectorAll('.key').forEach((btn) => {
    btn.addEventListener('click', () => {
      const inp = btn.dataset.input;
      const action = btn.dataset.action;
      if (inp !== undefined) input(inp);
      else if (action === 'clear') clearAll();
      else if (action === 'delete') backspace();
      else if (action === 'equals') equals();
    });
  });

  document.querySelector('[data-action="clear-history"]').addEventListener('click', clearHistory);

  /** Keyboard support */
  const KEY_MAP = {
    '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
    '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
    '.': '.', '+': '+', '-': '-', '*': '*', '/': '/',
    '(': '(', ')': ')', '%': '%', '^': '^',
  };

  document.addEventListener('keydown', (e) => {
    // Don't hijack when user is typing in another input (defensive — none currently)
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      flashKey('[data-action="equals"]');
      equals();
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      flashKey('[data-action="delete"]');
      backspace();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      flashKey('[data-action="clear"]');
      clearAll();
    } else if (KEY_MAP[e.key] !== undefined) {
      e.preventDefault();
      input(KEY_MAP[e.key]);
      flashKey(`[data-input="${KEY_MAP[e.key]}"]`);
    }
  });

  function flashKey(selector) {
    const el = document.querySelector(selector);
    if (!el) return;
    el.classList.add('is-pressed');
    setTimeout(() => el.classList.remove('is-pressed'), 90);
  }

  /** Boot */
  render();
  loadHistory();
})();
