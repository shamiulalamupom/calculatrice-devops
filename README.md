# Calculatrice

## Run with Docker Compose

```bash
docker compose up --build -d
```

Ovrir http://localhost:3000

## Local (sans docker)

```bash
npm install
npm start
```

## L'architecture

- **Backend** (`server.js`): Express. Exposes `/api/calculate` (POST), `/api/history` (GET/DELETE), `/health`. Expressions are evaluated with `mathjs.evaluate`
- **Frontend** (`public/`): plain HTML/CSS/JS. Sends each `=` press to the backend. History is server-side, in memory, capped at 50 entries.