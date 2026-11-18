# Free Live Website Build: Brand Vision Pros

A landing page with a multi-step application form. It's built with Next.js 16 (App Router), Tailwind v4, Supabase (database and storage) and Resend (email notifications), and it deploys on Vercel.

## Local setup

```bash
pnpm install
cp .env.example .env.local   # fill in the values
pnpm dev                     # http://localhost:3000
```

## Supabase

1. Create a project at supabase.com.
2. Open the **SQL Editor**, paste [`supabase/schema.sql`](supabase/schema.sql) and click **Run**. This creates:
   - the `applications` table, including the `build_format` column (`live` | `private` | `either`), with row-level security (RLS) on and no public policies
   - a private `applicant-assets` storage bucket that accepts images only, up to 10MB each
3. Go to **Project Settings → API** and copy the URL, the anon key and the service-role key into your env vars.

How uploads work: the browser asks `/api/uploads` for one-time signed upload URLs, then sends each file directly to Supabase Storage. Files never pass through Vercel functions, which cap request bodies at 4.5MB. The admin page displays images through signed URLs that expire after one hour.

## Resend

1. Verify your sending domain in Resend.
2. Create an API key.
3. Set `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (an address on the verified domain) and `NOTIFY_EMAIL`.

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, go to **Add New → Project**, import the repo and keep the defaults (Framework: Next.js, Install command: `pnpm install`).
3. Under **Settings → Environment Variables**, add every key from `.env.example` for Production (and Preview if you want). Set `NEXT_PUBLIC_SITE_URL` to your production URL, for example `https://build.yourdomain.com`.
4. Click **Deploy**.
5. Optional: add a custom domain under **Settings → Domains**. Then update `NEXT_PUBLIC_SITE_URL` and redeploy.
6. Test the full flow: submit a test application, check the email, then sign in at `/admin`.

If you use the Vercel CLI (`npm i -g vercel`): run `vercel link`, then `vercel env pull .env.local`, then `vercel --prod`.

## Admin

`/admin` is protected by `ADMIN_PASSWORD`. From there you can:

- filter applications by status (qualified or disqualified) and by build format
- sort by priority score or by newest
- view asset thumbnails
- toggle **Built** and **Paid**

## Qualification

An application is **disqualified** if any of these is true:

- the business has been operating less than 3 months
- it isn't currently generating income
- the "$300 readiness" box is left unchecked

Disqualified applications are still saved.

**Priority score** (0–100) = revenue band (10/25/40/50) + time in business (0/15/30/40) + 10 if the applicant has no website or dislikes their current one.

## Editing copy

- Brand name, social links and prices: `src/lib/site.ts`
- Page sections: `src/components/`
- Terms: `src/app/terms/page.tsx`
