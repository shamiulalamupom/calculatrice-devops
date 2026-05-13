const express = require('express');
const client = require('prom-client');
const { add, subtract, multiply, divide } = require('./calculator');

const app = express();

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const requestCounter = new client.Counter({
  name: 'request_count',
  help: 'Nombre total de requêtes'
});

register.registerMetric(requestCounter);

const PORT = process.env.PORT || 3000;

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/add', (req, res) => {
  requestCounter.inc();
  
  const { a, b } = req.query;

  const resultat = add(a, b);

  res.send({
    'resultat': resultat
  })
})

app.get('/sub', (req, res) => {
  requestCounter.inc();
  
  const { a, b } = req.query;

  const resultat = subtract(a, b);

  res.send({
    'resultat': resultat
  })
})

app.get('/mul', (req, res) => {
  requestCounter.inc();
  
  const { a, b } = req.query;

  const resultat = multiply(a, b);

  res.send({
    'resultat': resultat
  })
})

app.get('/div', (req, res) => {
  requestCounter.inc();
  
  const { a, b } = req.query;

  const resultat = divide(a, b);

  res.send({
    'resultat': resultat
  })
})

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);

  res.end(await register.metrics());
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
