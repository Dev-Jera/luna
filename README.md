# Luna

Luna is a consent-first social intelligence MVP that helps people form meaningful friendships, romantic relationships, and professional connections. It combines explainable compatibility scoring with optional Google Gemini-assisted introductions and real-time chat.

## Included

- React, TypeScript, Redux Toolkit, Tailwind CSS, and a responsive discovery/chat UI
- Django REST Framework API with JWT access and refresh tokens
- Profiles, connection goals, explainable matches, conversations, messages, and explicit AI-consent data models
- Django Channels websocket delivery with JWT-authenticated connections
- Celery compatibility-refresh tasks and Redis/PostgreSQL production services
- SQLite, eager tasks, and in-memory Channels defaults for a low-friction local demo

## Quick start (local)

```bash
npm install
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt
python backend/manage.py migrate
python backend/manage.py runserver
```

In a second terminal:

```bash
npm run dev
```

Open `http://localhost:5173`, create an account, and complete the profile through `PATCH /api/profiles/me/`. The UI also has a no-login demo preview.

Create the full hackathon dataset with:

```bash
python backend/manage.py seed_luna
```

Then sign in as `amani` with password `luna-demo-2026`. The command is repeatable and creates six realistic profiles, explainable matches, an accepted connection, a conversation, and an unread notification.

## Docker stack

Copy `.env.example` to `.env`, then run:

```bash
docker compose up --build
```

## API map

- `POST /api/auth/register/`
- `POST /api/auth/token/` and `/api/auth/token/refresh/`
- `GET|PATCH /api/profiles/me/`
- `GET /api/matches/`
- `POST /api/matches/{id}/accept/`
- `GET /api/conversations/`
- `POST /api/conversations/{id}/messages/`
- `WS /ws/chat/{conversation_id}/?token={access_token}`

## AI integration boundary

Luna uses **Google Gemini** through the Gemini API. Configure `GEMINI_API_KEY`, `GEMINI_BASE_URL`, and `GEMINI_MODEL` in `.env`. The default model is `gemini-3.1-flash-lite`; you can change it without touching application code.

Luna uses Africa's Talking SMS for phone verification, password recovery, opt-in connection notifications, unread-message reminders, and safety alerts. For sandbox development set `AFRICASTALKING_USERNAME=sandbox`, add the sandbox API key, and keep the sandbox messaging URL from `.env.example`. SMS copy never includes match details or private message content.

`backend/core/ai/gemini.py` is the provider boundary and `backend/core/ai/prompts.py` contains the structured, consent-safe prompts. Celery runs profile analysis, match explanation enrichment, and introduction drafting. With no API key, local development uses deterministic fallbacks.

Gemini never sends a chat message directly. Every participant must first consent to Luna's AI assistance, and the requesting user must review and approve the editable introduction draft before it is sent as that user. Private conversation history is not included in Gemini prompts.

## Safety and privacy

- Users can pause discovery without deleting their account.
- Blocking is mutual at the access layer: matches, REST conversations, and websocket access are removed for both sides.
- Reports are private and stored for moderator review.
- Revoking conversation AI consent disables Luna and discards pending introduction drafts.
- Messages are rate limited and capped at 2,000 characters.
- Users can export their account data or permanently delete the account after password confirmation.

## Production readiness

- JWT access and refresh tokens use HttpOnly, SameSite-strict cookies and are never exposed to frontend JavaScript.
- Expired access sessions refresh automatically; logout deletes both cookies.
- Conversations track per-user read state and create message notifications.
- Local rule-based moderation flags urgent threats and repeated-link spam without sending private messages to Gemini.
- Safety and approved-AI actions create audit events, while application logs use structured JSON without request bodies.
- GitHub Actions validates migrations, Django deployment checks, backend tests, frontend unit tests, and the production build.

## Controlled pilot operations

- Registration requires confirmation that the user is 18+ and acceptance of the current Terms, Privacy Notice, and Community Guidelines version.
- Moderators can review and resolve private reports at `/api/moderation/reports/`; aggregate, non-PII operating metrics are available to administrators at `/api/ops/metrics/`.
- Liveness and readiness endpoints are `/health/` and `/ready/`.
- OpenAPI and Swagger documentation are available at `/api/schema/` and `/api/docs/`.
- `docker compose -f docker-compose.prod.yml up --build` runs the hardened Nginx, Daphne, Celery, Redis, and PostgreSQL deployment stack.
- `npm run test:e2e` runs the Chromium guided-demo journey. CI installs Chromium automatically.
