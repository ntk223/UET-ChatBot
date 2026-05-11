# Backend Orchestrator Structure

Backend duoc scaffold theo kien truc decoupled tu tai lieu:

- Client Layer: REST + Socket.io
- Orchestrator Layer: Node.js (flow parser + state router + dialogue manager)
- NLU Layer: Rasa API (`/model/parse`)
- Data Layer: PostgreSQL + Redis

## Thu muc chinh

```text
backend/
  src/
    app.js
    index.js
    config/
      env.js
      postgres.js
      redis.js
    controllers/
      chat.controller.js
      health.controller.js
    middleware/
      error.middleware.js
    repositories/
      admission.repository.js
    routes/
      chat.routes.js
      health.routes.js
    services/
      dialogue/
      flow/
      integrations/
      nlu/
      router/
      state/
    templates/
      responseTemplates.js
      utterances.js
    utils/
      httpError.js
  data/flowchart/
    flowchart.json
  db/
    schema.sql
    seed.sql
  docker-compose.yml
  package.json
```

## Chay nhanh

1. Cai dependencies:

```bash
npm install
```

2. Tao file env:

```bash
cp .env.example .env
```

3. Khoi dong PostgreSQL + Redis:

```bash
docker compose up -d
```

4. Khoi tao schema + seed:

```bash
npm run db:init
```

5. Chay backend:

```bash
npm run dev
```

## Endpoint

- `GET /health`
- `POST /webhook`
- Socket.io event in: `chat:message`
- Socket.io event out: `chat:response`, `chat:error`
