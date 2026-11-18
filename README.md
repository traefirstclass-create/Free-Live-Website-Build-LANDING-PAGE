# Free Live Website Build: Brand Vision Pros

A landing page with a multi-step application form.

| Piece | Service |
|---|---|
| Website | Next.js 16 (App Router) + Tailwind v4, hosted on **Vercel** |
| Applications (form answers) | **Neon Postgres**, added through Vercel Storage |
| Logos and photos | **Vercel Blob**, a private store. Files are permanent |
| New-application emails | **Resend** |

Everything except Resend lives inside your Vercel project.

## Deploy to Vercel

1. **Import the repo.** Go to vercel.com/new, import this GitHub repo and keep the defaults (Next.js, `pnpm install`).
2. **Add the database.** In the project, open **Storage → Create Database → Neon** and connect it to the project. This sets `DATABASE_URL` for you.
3. **Create the table.** Open the database, choose **Open in Neon → SQL Editor**, paste [`db/schema.sql`](db/schema.sql) and click **Run**.
4. **Add image storage.** Open **Storage → Create → Blob**, choose **Private** access and connect it to the project. Make sure the project has `BLOB_READ_WRITE_TOKEN`. If you only see `BLOB_STORE_ID`, open the store's **.env.local** tab and copy the token into Settings → Environment Variables.
5. **Add the rest of the environment variables** (Settings → Environment Variables), using `.env.example` as the guide:
   - `NEXT_PUBLIC_SITE_URL`
   - `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NOTIFY_EMAIL`
   - `ADMIN_PASSWORD`, and optionally `ADMIN_SESSION_SECRET`
6. **Redeploy** under Deployments → ⋯ → Redeploy, so the new variables take effect.
7. **Test** with a real application: check that the email arrives, then sign in at `/admin` and confirm the thumbnails load.

## Local development

```bash
pnpm install
cp .env.example .env.local   # or: vercel link && vercel env pull .env.local
pnpm dev                     # http://localhost:3000
```

## How uploads work

1. The browser asks `/api/uploads` for a one-time upload permission (valid for 10 minutes).
2. It then sends each image directly to Vercel Blob at `applications/<id>/logo.png` and `photo-1…6`. This skips Vercel's 4.5MB function body limit.
3. The stored files are permanent.

The Blob store is private, so applicant photos aren't public. On `/admin`, images load through `/api/admin/asset?path=…`. Those links never expire, but you need to be signed in to view them.

## Admin

`/admin` is protected by `ADMIN_PASSWORD`. From there you can:

- filter applications by status (qualified or disqualified) and by build format (live, private or either)
- sort by priority score or by newest
- view thumbnails and click one to open the full-size image
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
