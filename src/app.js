const express = require('express');
const { add, subtract, multiply, divide } = require('./calculator');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/add', (req, res) => {
  const { a, b } = req.query;

  const resultat = add(a, b);

  res.send({
    'resultat': resultat
  })
})

app.get('/sub', (req, res) => {
  const { a, b } = req.query;

  const resultat = subtract(a, b);

  res.send({
    'resultat': resultat
  })
})

app.get('/mul', (req, res) => {
  const { a, b } = req.query;

  const resultat = multiply(a, b);

  res.send({
    'resultat': resultat
  })
})

app.get('/div', (req, res) => {
  const { a, b } = req.query;

  const resultat = divide(a, b);

  res.send({
    'resultat': resultat
  })
})

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
