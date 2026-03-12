# Zmantic

Free multi-tenant website platform for ISKCON temples worldwide. Every temple gets a page at `zmantic.com/{temple-slug}` with schedules, events, gallery, map, and online donations.

## Tech Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS, shadcn/ui)
- **Supabase** (Postgres + Auth + Storage + RLS)
- **Stripe** (Checkout for donations, webhook tracking)
- **Vercel** (hosting, CDN, ISR)

## Features

- **Temple Directory**: 800+ ISKCON temples with addresses, contact info, and maps
- **Daily Schedules**: Darshan and arati times managed by temple admins
- **Event Calendar**: Upcoming festivals and programs
- **Photo Gallery**: Temple images uploaded to Supabase Storage
- **Online Donations**: Stripe Checkout with per-temple tracking via metadata
- **Admin Dashboard**: Temple administrators can claim and manage their temple's page
- **SEO Optimized**: ISR, JSON-LD structured data, Open Graph metadata
- **Responsive**: Mobile-first design with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)
- A [Stripe](https://stripe.com) account (test mode for development)

### 1. Clone and Install

```bash
git clone https://github.com/mcparkMCP/zmantic.git
cd zmantic
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migration files in order:
   - `supabase/migrations/20250304190700_create_tables.sql` — creates all 6 tables
   - `supabase/migrations/20250304190800_rls_policies.sql` — enables Row Level Security
3. Copy your project URL and keys from Settings > API

### 3. Configure Environment

```bash
cp .env.local.example .env.local
```

Fill in the values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Seed Temple Data (Optional)

Run the scraping pipeline to populate temples:

```bash
# Scrape from primary source
npx tsx scripts/scrape-iskcon-centres.ts

# Scrape from secondary source
npx tsx scripts/scrape-desiretree.ts

# Merge and deduplicate
npx tsx scripts/merge-and-dedupe.ts

# Generate URL slugs
npx tsx scripts/generate-slugs.ts

# Seed to Supabase
npx tsx scripts/seed-database.ts
```

### 6. Set Up Stripe Webhook

For local development:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

For production, add the webhook endpoint in [Stripe Dashboard](https://dashboard.stripe.com/webhooks):
- URL: `https://yourdomain.com/api/stripe/webhook`
- Events: `checkout.session.completed`

## Project Structure

```
zmantic/
├── scripts/                    # Scraping pipeline
├── supabase/migrations/        # SQL schema + RLS policies
├── src/
│   ├── app/
│   │   ├── page.tsx            # Homepage
│   │   ├── [slug]/page.tsx     # Public temple page (SSR + ISR)
│   │   ├── temples/page.tsx    # Browse all temples
│   │   ├── donate/             # Donation flow
│   │   ├── auth/               # Login, signup, callback
│   │   ├── dashboard/          # Admin portal (protected)
│   │   └── api/stripe/         # Stripe checkout + webhook
│   ├── components/
│   │   ├── ui/                 # shadcn/ui primitives
│   │   ├── temple/             # Temple page components
│   │   ├── dashboard/          # Dashboard components
│   │   └── shared/             # Header, footer
│   ├── lib/                    # Supabase clients, Stripe, utils
│   ├── actions/                # Server actions (CRUD)
│   └── types/                  # TypeScript interfaces
└── middleware.ts               # Auth + session refresh
```

## Database Schema

| Table | Purpose |
|-------|---------|
| `temples` | Core temple data (name, address, contact, coordinates) |
| `temple_admins` | Links auth users to temples (owner/editor roles) |
| `schedules` | Daily darshan/arati times |
| `events` | Calendar events with dates |
| `gallery_photos` | Photo gallery with captions |
| `donations` | Stripe payment records |

All tables have Row Level Security: public read, admin write (verified via `temple_admins` lookup).

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.local`
4. Deploy

The app uses ISR with `revalidate=60` — temple pages are cached at the CDN and update within 1 minute of admin edits.

## Admin Flow

1. Admin signs up at `/auth/signup` with their temple name
2. A Supabase admin links their account to a temple in `temple_admins`
3. Admin logs in and accesses the dashboard at `/dashboard`
4. From the dashboard they can:
   - Edit temple info (name, address, contact, description)
   - Manage daily schedule (add/edit/delete arati times)
   - Manage events (add/edit/delete festivals and programs)
   - Upload gallery photos
   - View donation history

## License

MIT
