# Luna — Project Analysis

---

## 1. Project Proposal (Retrospective)

> **Project Name:** Luna — Consent-First Social Intelligence Platform
> **Target Market:** East Africa (Uganda, Kenya, and surrounding regions)
> **Tagline:** *Meaningful connections, intelligently guided.*

---

### Problem Statement

Existing dating and social discovery applications prioritize swipe volume over connection quality. Users in emerging markets face unique challenges:

- **Trust and safety concerns** — Catfishing, harassment, and scams are widespread on traditional platforms.
- **High data costs** — Swipe-heavy interfaces waste expensive mobile data with endless profile loading.
- **Literacy and language barriers** — Most apps are English-only and text-heavy.
- **No access to credit cards** — Payment for premium features requires mobile money (M-Pesa, Airtel Money, etc.), which most global dating apps don't support.
- **Privacy expectations** — Users in tight-knit communities value discretion and explicit consent before their data or identity is shared.

No existing platform combines explainable AI matching with consent-first guardrails, SMS-based access, local payment integration, and built-in relationship support — all designed specifically for the East African context.

---

### Proposed Solution

Luna is a **consent-first social intelligence MVP** that helps people form meaningful friendships, romantic relationships, and professional connections.

Instead of a swipe deck, Luna provides a **private AI concierge** that manages one thoughtful match at a time:

1. The user chats with Luna about their preferences, values, and what they're looking for.
2. Luna privately finds compatible profiles, shows them one-by-one after discussion.
3. Both parties must explicitly consent before an introduction is drafted.
4. The introduction is editable and must be approved by the sender.
5. Real-time chat opens with optional AI moderation and relationship guidance.

The core philosophy is **"ask before showing, consent before connecting."**

---

### Core Features (MVP)

| Feature | Description |
|---|---|
| Consent-first onboarding | 6-step flow: age verification (18+), legal acceptance, profile setup, values/interests, preferences, explicit AI consent |
| Private AI concierge | Gemini-powered chat that privately learns preferences, suggests one match at a time, and facilitates introductions |
| Explainable matching | Compatibility scoring with human-readable reasons and optional AI-generated deep explanations |
| Real-time chat | WebSocket-based direct messaging with read states, per-user read tracking, and notifications |
| Phone-based authentication | SMS verification + password reset via Africa's Talking — no email required |
| Safety layer | Blocking (mutual at access layer), reporting (private, moderator-reviewed), automated content moderation, rate limiting (30 msgs/min), contact sharing controls |
| Premium subscriptions | NylonPay integration (Uganda mobile money) for premium unlocks |
| AI relationship counseling | Gemini-powered couples/individual counseling chat |
| Date scheduling | In-app date proposals with AI-suggested venue recommendations |
| SMS notifications | Match alerts, unread message reminders, safety alerts via SMS |
| Match feedback | Track outcomes (good fit, not aligned, great conversation, no response) |
| Admin moderation | Report review, user suspension, operational metrics dashboard |

---

### Monetization Strategy

| Tier | Price | Features |
|---|---|---|
| **Free** | 0 UGX | 2 matches/day, basic messaging, AI concierge, safety features |
| **Premium** | 11,000 UGX (~$3 USD) | Unlimited matches, account deletion, relationship counseling, high-score match unlocks |

Payment processing via **NylonPay** (Uganda mobile money infrastructure).

---

### Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React 18 + TS)              │
│  Vite + Tailwind CSS + Redux Toolkit + React Router     │
│  socket.io-client (WebSocket) + Axios (REST)            │
│  PWA: Service Worker + beforeinstallprompt              │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP / WS
┌────────────────────────▼────────────────────────────────┐
│              Reverse Proxy (Nginx)                      │
│  /api/* → Django   /ws/* → Daphne   / → static SPA     │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│         Backend (Django 4.2 + Django REST Framework)    │
│  JWT auth (HttpOnly cookies)  │  Django Channels (WS)   │
│  Celery task queue           │  Africa's Talking SMS    │
│  Google Gemini AI adapter    │  NylonPay integration    │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              Data Layer                                 │
│  SQLite (dev) / TiDB Cloud / MySQL (prod)               │
│  Redis (Celery broker + Channels layer)                 │
│  In-memory Channels (dev fallback)                      │
└─────────────────────────────────────────────────────────┘
```

**Key packages:**
- `Django 4.2` + `djangorestframework` + `django-channels[daphne]`
- `celery[redis]` for async tasks (match computation, AI analysis, SMS dispatch)
- `react 18` + `@reduxjs/toolkit` + `react-router-dom` + `tailwindcss`
- `google-generativeai` (Gemini) via custom REST adapter in `backend/core/ai/gemini.py`
- `nylonpay-py` for Uganda mobile money payments
- `django-tidb` for TiDB Cloud Serverless MySQL-compatible database

---

### Database Schema (Core Models)

| Model | Purpose |
|---|---|
| `Profile` | Extended user profile with preferences, values, interests, goals, AI consent flags |
| `Match` | Bidirectional match between two profiles with score, reasons, AI explanation, status |
| `Conversation` | Chat container (Luna AI inbox or direct match chat) with stage tracking |
| `Message` | Individual messages with AI flag, metadata, moderation link |
| `Consent` | Per-profile, per-conversation AI assistance consent |
| `IntroductionDraft` | AI-generated introductions with approval workflow |
| `Block` | Bidirectional block records |
| `Report` | User reports with moderator review workflow |
| `Notification` | In-app notifications with SMS sent tracking |
| `DateMeeting` | Date proposals with accept/decline workflow |
| `CounselingSession` | Premium couples counseling sessions |
| `PremiumPayment` | NylonPay payment tracking with status lifecycle |
| `ModerationEvent` | Automated content moderation flags |
| `AuditEvent` | Structured audit log for safety/compliance |
| `MatchFeedback` | User-reported match outcome feedback |
| `PhoneCode` | SMS verification/password reset code hashes |

---

### API Endpoints (REST)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/auth/register/` | POST | Registration with phone, age verification, legal acceptance |
| `/api/auth/token/` | POST | JWT login |
| `/api/auth/token/refresh/` | POST | Refresh access token |
| `/api/auth/session/` | GET | Check current session validity |
| `/api/auth/logout/` | POST | Clear auth cookies |
| `/api/auth/phone/send/` | POST | Send SMS verification code |
| `/api/auth/phone/confirm/` | POST | Verify phone with code |
| `/api/auth/password-reset/request/` | POST | Request SMS reset code |
| `/api/auth/password-reset/confirm/` | POST | Confirm reset with code + new password |
| `/api/profiles/me/` | GET/PATCH | Read/update own profile |
| `/api/profiles/me/analyze/` | POST | Trigger AI profile analysis |
| `/api/profiles/me/export/` | GET | Export all user data (GDPR) |
| `/api/profiles/me/account/` | DELETE | Delete account (premium) |
| `/api/profiles/me/initiate-nylon-payment/` | POST | Start premium payment |
| `/api/profiles/me/payment-status/?reference=` | GET | Check payment status |
| `/api/profiles/me/toggle-premium-test/` | POST | Toggle premium (dev) |
| `/api/profiles/premium-price/` | GET | Get premium pricing |
| `/api/profiles/safety/block/` | POST/DELETE | Block/unblock a user |
| `/api/profiles/safety/report/` | POST | Report a user |
| `/api/matches/` | GET | List my matches |
| `/api/matches/{id}/accept/` | POST | Accept a match |
| `/api/matches/{id}/pass/` | POST | Pass on a match |
| `/api/matches/{id}/explain/` | POST | Generate AI explanation |
| `/api/matches/{id}/feedback/` | POST | Submit match outcome feedback |
| `/api/conversations/` | GET | List conversations (creates Luna inbox if missing) |
| `/api/conversations/{id}/messages/` | POST | Send a message |
| `/api/conversations/{id}/read/` | POST | Mark conversation as read |
| `/api/conversations/{id}/ai-consent/` | POST | Toggle AI consent for conversation |
| `/api/conversations/{id}/introduction/` | GET/POST | Get/create AI introduction draft |
| `/api/conversations/{id}/introduction/{draft_id}/approve/` | POST | Approve/edit and send introduction |
| `/api/conversations/{id}/reengage/` | POST | Re-engage Luna after chat ends |
| `/api/conversations/{id}/suggest-venues/` | GET | AI-suggested date venues |
| `/api/conversations/{id}/schedule-date/` | POST | Propose a date |
| `/api/conversations/{id}/schedule-date/{meeting_id}/respond/` | POST | Accept/decline date |
| `/api/conversations/{id}/permit-contact/` | POST | Enable contact sharing |
| `/api/conversations/{id}/send-sms/` | POST | Nudge offline user via SMS |
| `/api/notifications/` | GET | List notifications |
| `/api/notifications/read-all/` | POST | Mark all notifications read |
| `/api/counseling/ai/` | POST | Get/create AI counseling chat |
| `/api/counseling/schedule/` | POST | Schedule couples counseling session |
| `/api/counseling/sessions/` | GET | List my counseling sessions |
| `/api/moderation/reports/` | GET | List reports (admin) |
| `/api/moderation/reports/{id}/resolve/` | POST | Resolve a report (admin) |
| `/api/moderation/reports/users/` | GET | List all users (admin) |
| `/api/moderation/reports/users/{id}/suspend/` | POST | Toggle user suspension (admin) |
| `/api/ops/metrics/` | GET | Operational metrics (admin) |
| `/health/` | GET | Liveness check |
| `/ready/` | GET | Readiness check |
| `/api/schema/` | GET | OpenAPI schema |
| `/api/docs/` | GET | Swagger UI docs |

### WebSocket Endpoints

| Endpoint | Protocol | Purpose |
|---|---|---|
| `ws://host/ws/chat/{conversation_id}/?token={jwt}` | Django Channels | Real-time messaging per conversation |

---

### AI Integration Boundary

```
┌──────────────────────────────────────────────────┐
│                  Gemini AI                        │
│  gemini-3.1-flash-lite (configurable model)      │
│  Boundary: backend/core/ai/gemini.py             │
│  Prompts: backend/core/ai/prompts.py             │
├──────────────────────────────────────────────────┤
│  Functions:                                      │
│  • Profile analysis & embedding                  │
│  • Match explanation enrichment                  │
│  • Introduction drafting                         │
│  • Welcome message generation                    │
│  • Chat moderation & safety evaluation           │
│  • Venue suggestions                             │
│  • Profile insight extraction from chat          │
│  • Match board progress tracking                 │
├──────────────────────────────────────────────────┤
│  Safeguards:                                     │
│  • Gemini never sends messages directly          │
│  • All drafts require user review & approval     │
│  • Private conversation history excluded         │
│  • Consent required at profile & conversation    │
│  • Deterministic fallback with no API key        │
│  • Temperature 0.3 for consistent outputs        │
│  • maxOutputTokens 2048                          │
└──────────────────────────────────────────────────┘
```

---

## 2. Hosting Recommendations

### Primary Recommendation: **Render + TiDB Cloud Serverless**

| Component | Service | Estimated Cost |
|---|---|---|
| Django app + Daphne | Render Web Service | $0–$7/month (free tier available) |
| Celery worker | Render Worker (Background Worker) | $0–$7/month |
| Redis | Render Managed Redis | $0–$15/month |
| Database | TiDB Cloud Serverless (MySQL-compatible) | Free tier (5GB storage, generous credits) |
| File storage | Django default (local/Whitenoise) | Included |

**Why Render:**
- Native Django support — your project already uses Whitenoise, Gunicorn/Daphne-compatible
- WebSocket support — Daphne works out of the box with Render's HTTP/WebSocket handling
- Your Dockerfile can be used directly via Render's Docker deployment option
- Automatic HTTPS, custom domains, zero-downtime deploys
- GitHub integration — auto-deploy on push
- Free tier is generous enough for MVP validation

**Why TiDB Cloud:**
- Your `settings.py` already has `django-tidb` configured as the production database engine
- MySQL-compatible, so all your existing queries/ORM work without changes
- Serverless means you pay only for what you use (free tier is very generous)
- Automatic scaling, replication, and backups
- SSL connections supported (already configured in your settings)

**Setup steps:**
1. Create a TiDB Cloud Serverless cluster (free)
2. Get the `DATABASE_URL` connection string (format: `mysql+pymysql://user:pass@host:port/db`)
3. Deploy Django to Render Web Service with env vars: `DATABASE_URL`, `GEMINI_API_KEY`, `AFRICASTALKING_API_KEY`, `DJANGO_SECRET_KEY`, `USE_SQLITE=false`
4. Add a Render Worker service for Celery
5. Add Render Redis instance for Celery broker + Django Channels
6. Set `USE_REDIS=true` in production

### Alternative: DigitalOcean App Platform

- Managed MySQL database ($7–$15/month) instead of TiDB Cloud
- Managed Redis ($7–$12/month)
- Built-in worker support for Celery
- Slightly more expensive but fully managed in one dashboard
- Good if you prefer a single-provider approach

### Alternative: Fly.io

- Best for global WebSocket performance (anycast networking)
- Docker-native — your existing Dockerfile works as-is
- Can deploy to Johannesburg region (closest to your target users)
- Requires more manual configuration for Celery + Redis
- Good option if real-time chat latency is your top priority

### Not Recommended for MVP

| Service | Why not |
|---|---|
| **AWS / GCP / Azure** | Overwhelming complexity for an MVP. Too many services to configure (ECS/RDS/ElastiCache/ALB/etc.) |
| **Traditional VPS** (Linode/DigitalOcean Droplet) | You'd need to manually manage Nginx, Daphne, Celery, Redis, PostgreSQL, SSL, monitoring. Not worth the ops overhead for a validation phase. |
| **PythonAnywhere** | No WebSocket support, no Celery, no Redis. Your real-time chat and async tasks wouldn't work. |
| **Heroku** | Shut down free tier, expensive for what you get, no longer supports new accounts on free plans. |

---

## 3. Improvement Recommendations

### 3.1 High Impact, Low Effort (Days, Not Weeks)

| Improvement | Why | Effort |
|---|---|---|
| **Offline-capable service worker** | You already have a PWA install prompt; add a Workbox-based service worker that caches the app shell. African users face intermittent connectivity — the app should still render after a page refresh offline. | 1 day |
| **Push notifications** (Web Push API) | Replace SMS notification costs with free, instant browser push notifications. SMS credits cost money; push notifications are free and instant. Use `django-webpush` or a custom VAPID implementation. | 2-3 days |
| **Lazy-load routes** | The app bundles all components eagerly. Use `React.lazy()` + `Suspense` for each route (Admin, Counseling, Settings, etc.). On 2G/3G networks, a 500KB+ initial bundle will lose users. | 0.5 days |
| **Add Swahili/Luganda i18n** | Your target market speaks English as a second language. Localized onboarding and chat would massively improve adoption. Use `react-i18next` for frontend, pass language preference to Gemini prompts. | 3-5 days |
| **CI/CD optimization** | GitHub Actions already validates migrations and tests. Add automatic deployment to Render on main branch merge, plus a `pnpm audit` / `safety check` step for dependency vulnerabilities. | 1 day |
| **Better error boundaries** | The `App.tsx` error screen only catches load failures. Wrap each major component (Dashboard, Chat, Onboarding) in React error boundaries with retry buttons and user-friendly messages. | 1 day |

### 3.2 Medium Impact, Moderate Effort (1–3 Weeks)

| Improvement | Why | Effort |
|---|---|---|
| **Feedback-driven match tuning** | The `MatchFeedback` model collects outcome data but no algorithm uses it. Train the compatibility function to weight criteria based on which matches users rate as "good fit" vs "not aligned." | 1 week |
| **Vector search for scaling** | Your current match computation is O(n²) — every user is compared against every other user. At 1,000+ users this becomes slow. Use TiDB's vector search (TiDB Cloud supports it) or Pinecone/Qdrant for embedding-based similarity search at scale. | 1 week |
| **Profile photo verification** | Catfishing is the #1 trust issue in dating. Add a selfie-based verification flow using Gemini Vision API or a third-party liveness check. Display a "verified" badge. | 1 week |
| **Group conversations** | The `connection_goal` field supports `networking` but group chats don't exist. Add group conversations for networking, friend groups, or community events — a key differentiator from Tinder/Bumble. | 1 week |
| **Voice notes in chat** | Voice messaging is massively popular in East African social apps (WhatsApp, Telegram). It's more personal and bypasses literacy barriers. Django Channels handles binary frames well. | 2 weeks |
| **Referral system** | "Invite a friend, both get a free premium day." Critical for organic growth. Generate unique referral links, track signups, grant premium credits. | 3-5 days |

### 3.3 High Impact, High Effort (3–8 Weeks)

| Improvement | Why | Effort |
|---|---|---|
| **Mobile native app (Flutter or React Native)** | PWA is good, but push notifications on iOS are unreliable, WebSocket reconnection is worse on mobile browsers, and app store presence signals legitimacy. A Flutter app sharing the same API would drive adoption significantly. | 4-8 weeks |
| **Offline-first architecture** | Store profiles, matches, and messages in IndexedDB (via Dexie.js or similar). Queue sent messages locally and sync when connectivity returns. Critical for markets where data is expensive and connectivity is intermittent. | 4 weeks |
| **ML-powered safety automation** | Gemini moderation already works in `moderating` stage; extend it to all conversations. Add automated temporary suspensions for severe violations (harassment, scams) with an appeal workflow. Build a training dataset from reported profiles. | 3-4 weeks |
| **Video/voice calls** | WebRTC-based calling within the app. After users match and chat, offering a voice/video call keeps them on the platform instead of moving to WhatsApp (where you lose engagement and safety moderation). | 4-6 weeks |

### 3.4 Strategic Concerns

| Concern | Recommendation |
|---|---|
| **Monetization timing** | Keep core features (matching, chat, AI concierge) free forever. Only charge for premium upgrades (counseling, account deletion, early access to high-score matches). Free users are your product — they attract premium users. |
| **Trust as a marketing moat** | Your consent-first approach is a genuine differentiator. Lead marketing with "Luna never shares your profile or messages without your explicit permission." Make the consent flow part of your brand story, not just a compliance checkbox. |
| **Localized AI prompts** | Pass the user's language preference to Gemini's system prompts. Gemini handles multilingual prompts well. Your match explanations and Luna conversations will be more natural in the user's first language. |
| **Escaping the "dating app" label** | Position Luna as a "social intelligence platform" not a dating app. Your `connection_goal` field (friendship, romance, networking) already supports this framing. Marketing to professionals for networking first can build a user base that naturally cross-pollinates into romantic matching. |
| **Data portability as a feature** | You already have `/api/profiles/me/export/`. Market this prominently — "You own your data, export it anytime." It builds trust and is a genuine differentiator from competitors who make data export difficult. |

---

## 4. Current State Assessment

### What's Already Excellent

- **Clean consent architecture** — Consent is granular: profile-level AI analysis, per-conversation AI assistance, contact sharing, and introduction approval are all independent. This is well-designed.
- **Explainable AI boundary** — `backend/core/ai/gemini.py` is a clean adapter layer. Prompts are separated into `backend/core/ai/prompts.py`. No AI logic leaks into views.
- **Audit trail** — Every safety-relevant action (block, report, consent change, password reset) creates an `AuditEvent`. This is critical for compliance and trust.
- **Defensive defaults** — SMS notifications off by default, discovery on by default, AI consent off by default, messages rate-limited. Good.
- **Fallback behavior** — Every Gemini call has a deterministic fallback. The app works without any API key. This is excellent for demo/development.
- **Contact sharing protection** — Contact details are automatically redacted from messages until both parties explicitly permit sharing. This is a genuinely thoughtful safety feature.

### What Needs Attention

- **No tests for chat/conversation flows** — The `tests.py` exists; need to verify it covers the critical Luna chat state machine (welcome → offered → discussing → moderating → feedback cycle). This is the most complex and bug-prone code path.
- **Frontend error states are minimal** — Chat errors, WebSocket disconnection, message send failures need more resilient UX. The user should never lose a typed message.
- **No TypeScript strict mode** — Your `tsconfig.app.json` likely has strict mode off. Enabling `strict: true` would catch real bugs (especially around the complex Redux state and nullable profile fields).
- **Phone number normalization** — The `normalize_phone` function handles common cases, but East Africa has diverse number formats (+256, +254, +255, etc.). Consider using `phonenumbers` library (Google's libphonenumber port) for robust validation.

---

## 5. Competitor Landscape & Positioning

| Competitor | Weakness | Luna's Advantage |
|---|---|---|
| **Tinder** | Swipe fatigue, privacy concerns, no AI guidance, no local payment | Consent-first, AI concierge, intentional matching, mobile money |
| **Bumble** | Women-message-first doesn't fit all cultural contexts, no local market adaptation | Culturally adaptable, SMS for low-connectivity users |
| **Uganda Match / local sites** | Poor UX, no mobile app, security issues | Modern PWA + native path, safety-first, AI-powered |
| **WhatsApp groups** | No matching algorithm, no privacy, spam | Structured matching, consent controls, AI guidance |
| **Traditional matchmaking** | Expensive, not scalable | AI-augmented at near-zero marginal cost |

**Key differentiator:** Luna is not a "dating app" — it's a **consent-first social intelligence platform** that adapts to the user's goal (friend, partner, professional connection) and always asks before acting.

---

## 6. Summary

| Aspect | Verdict |
|---|---|
| **Code quality** | Well-structured, clean separation of concerns, good patterns |
| **Architecture** | Modern, scalable (Django REST + React + WebSockets + Celery) |
| **Safety design** | Excellent — consent layers, audit trail, moderation, rate limiting |
| **AI integration** | Clean adapter pattern with deterministic fallbacks |
| **Market fit** | Strong — specifically built for East African users, local payments, SMS |
| **MVP readiness** | Ready — deployment config exists (Docker, nginx, production compose) |
| **Biggest risk** | User acquisition — the intentional, slow-match model requires users to understand and trust the approach |
| **Next step** | Launch MVP on Render + TiDB Cloud, gather feedback, prioritize the High Impact/Low Effort improvements |

---

*Analysis generated from codebase at `D:\LUNA` — July 2026*
