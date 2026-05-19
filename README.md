# EstateFlow CRM

Mobile-first Real Estate CRM for managing leads, properties, calls, follow-ups, attendance, and social media.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js Server Actions + API Routes
- **Database**: Supabase (Postgres + Auth + Storage + Realtime)
- **Voice Calls**: Twilio Voice (bridge call automation)
- **Messaging**: Twilio WhatsApp/SMS
- **Email**: Resend
- **Hosting**: Vercel

## Quick Start

### 1. Prerequisites

- Node.js 18+
- Supabase account (free tier works)
- (Optional) Twilio account for voice/SMS
- (Optional) Resend account for email

### 2. Setup

```bash
git clone <repo-url>
cd estateflow-crm
npm install
cp .env.example .env.local
```

### 3. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **Settings > API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`
3. Go to **SQL Editor** and run:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
4. (Optional) After first signup, run `supabase/seed/seed.sql` for demo data

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up to create your organization.

### 5. Deploy to Vercel

```bash
npx vercel
```

Set environment variables in Vercel dashboard.

## Twilio Setup (Optional)

1. Create a Twilio account at [twilio.com](https://www.twilio.com)
2. Get a phone number with Voice + SMS capabilities
3. Set in `.env.local`:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`
4. For WhatsApp: Enable Twilio WhatsApp Sandbox or get approved sender
5. Set `DRY_RUN=false` to enable real calls

### Twilio Webhooks

Set these URLs in your Twilio console:
- Voice Status Callback: `https://your-app.vercel.app/api/calls/status`

## Lead Webhook

### Endpoint

```
POST /api/webhooks/leads
```

### Payload

```json
{
  "fullName": "Rahul Sharma",
  "phone": "+919999999999",
  "email": "rahul@example.com",
  "source": "36 Acre",
  "propertyType": "Apartment",
  "budgetMin": 7500000,
  "budgetMax": 12000000,
  "preferredLocation": "Gurgaon",
  "notes": "Looking for 3BHK near Golf Course Road"
}
```

### Test with curl

```bash
curl -X POST http://localhost:3000/api/webhooks/leads \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Lead",
    "phone": "+919999999999",
    "source": "website",
    "propertyType": "apartment",
    "budgetMin": 5000000,
    "budgetMax": 10000000,
    "preferredLocation": "Gurgaon"
  }'
```

### Webhook Security

Set `WEBHOOK_SECRET` and include `x-webhook-signature` header (HMAC-SHA256 of request body).

## Features

- **Dashboard**: Stats, hot leads, due follow-ups, recent activity
- **Lead Management**: Full CRUD, filters, search, timeline, status pipeline
- **Instant Call Bridge**: Auto-calls agent then connects to lead via Twilio conference
- **Property Inventory**: Listings with photos, search, filters, share links
- **One-Click Sharing**: Send property details via WhatsApp/SMS/Email
- **Follow-Up System**: Templates, scheduling, snooze, completion tracking
- **Attendance**: GPS check-in/out, admin dashboard, history
- **Social Media**: Content calendar, post drafting, status pipeline
- **Team Management**: Invite members, role-based access
- **Reports**: Leads by source/status, agent performance, conversion rates
- **Notifications**: In-app alerts for assignments, follow-ups, etc.

## Dry Run Mode

Set `DRY_RUN=true` (default) to simulate all external API calls (Twilio, WhatsApp, Email). All calls are logged to console instead of making real API requests.

## Architecture

```
src/
├── app/
│   ├── (auth)/          # Login, Signup
│   ├── (dashboard)/     # All CRM pages
│   ├── api/             # Webhooks, call bridge, status
│   └── actions/         # Server Actions (mutations)
├── components/
│   ├── ui/              # Base components (Button, Card, etc.)
│   ├── layout/          # Sidebar, Header, BottomNav
│   ├── leads/           # Lead-specific components
│   ├── properties/      # Property components
│   ├── dashboard/       # Dashboard & reports
│   ├── followups/       # Follow-up components
│   ├── attendance/      # Attendance components
│   ├── social/          # Social media components
│   └── shared/          # Team, Settings, Notifications
├── lib/
│   ├── supabase/        # Client + Server Supabase setup
│   ├── services/        # Service adapters (call, message, email, etc.)
│   ├── validators/      # Zod schemas
│   ├── hooks/           # React hooks
│   └── utils/           # Utilities
├── types/               # TypeScript types
└── middleware.ts         # Auth middleware
```
