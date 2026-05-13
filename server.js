const express = require('express');
const path = require('path');
const { evaluate } = require('mathjs');

const app = express();
const PORT = process.env.PORT || 3000;
const HISTORY_LIMIT = 50;

const history = [];

app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Healthcheck — used by Docker
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Evaluate a mathematical expression safely via mathjs
app.post('/api/calculate', (req, res) => {
  const { expression } = req.body || {};

  if (typeof expression !== 'string' || !expression.trim()) {
    return res.status(400).json({ error: 'expression must be a non-empty string' });
  }

  if (expression.length > 200) {
    return res.status(400).json({ error: 'expression too long' });
  }

  try {
    // mathjs.evaluate is sandboxed — does not have access to JS globals like eval()
    const result = evaluate(expression);

    // Reject non-finite or non-numeric results (mathjs can return matrices, units, etc.)
    if (typeof result !== 'number' || !Number.isFinite(result)) {
      return res.status(400).json({ error: 'result is not a finite number' });
    }

    const entry = {
      expression,
      result,
      at: new Date().toISOString(),
    };

    history.unshift(entry);
    if (history.length > HISTORY_LIMIT) history.length = HISTORY_LIMIT;

    res.json({ result, entry });
  } catch (err) {
    res.status(400).json({ error: 'invalid expression', detail: err.message });
  }
});

app.get('/api/history', (_req, res) => {
  res.json({ history });
});

app.delete('/api/history', (_req, res) => {
  history.length = 0;
  res.json({ ok: true });
});

// Graceful shutdown so Docker stop is fast (SIGTERM)
const server = app.listen(PORT, () => {
  console.log(`calculator listening on :${PORT}`);
});

const shutdown = (signal) => {
  console.log(`received ${signal}, shutting down`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
