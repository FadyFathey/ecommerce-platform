# Vercel Deployment Guide

## ✅ Pre-Deployment Checklist

### 1. Database Migrations (CRITICAL)
Before deploying, ensure these SQL migrations are run in Supabase:

- ✅ `migrations/add-product-fields.sql`
- ✅ `migrations/add-products-rls-policies.sql`
- ✅ `migrations/create-orders-and-policies.sql`
- ✅ `migrations/fix-stock-decrement-timing.sql` (NEW - required for stock management)
- ✅ `migrations/add-restore-stock-function.sql` (NEW - required for refunds)

### 2. Supabase Edge Functions (CRITICAL)
Deploy these Edge Functions to Supabase:

- ✅ `create-payment-intent` (already deployed)
- ✅ `stripe-webhook` (needs redeployment with latest changes)
- ⚠️ `process-refund` (NEW - needs deployment)
- ⚠️ `send-order-email` (NEW - needs deployment)

**Deploy commands:**
```bash
npx supabase@latest functions deploy stripe-webhook
npx supabase@latest functions deploy process-refund
npx supabase@latest functions deploy send-order-email
```

### 3. Environment Variables for Vercel

Add these environment variables in **Vercel Dashboard → Project Settings → Environment Variables**:

#### Required (Frontend):
```
VITE_SUPABASE_URL=https://lxlkdufedgjwjrmofuwi.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51NID98LmtReRt9Mb0hGZQhJKyGs3Ytkb87r4dGQZbd4NzcvueYqnGC6L3ksKKyTUBYI3hXQQBVa4DYeQEH7PZqfJ00TbdLZaHq
```

#### Optional (for email notifications):
```
RESEND_API_KEY=your_resend_api_key (if using Resend for emails)
```

**Note:** Edge Function environment variables (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, etc.) are set in **Supabase Dashboard**, not Vercel.

---

## 🚀 Deployment Steps

### Step 1: Push to Git Repository
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### Step 2: Deploy to Vercel

**Option A: Via Vercel Dashboard (Recommended)**
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your Git repository
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (root)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)
5. Add environment variables (see above)
6. Click "Deploy"

**Option B: Via Vercel CLI**
```bash
npm i -g vercel
vercel
# Follow prompts, add environment variables when asked
```

### Step 3: Verify Deployment

After deployment, check:
- [ ] Homepage loads correctly
- [ ] Authentication works (login/signup)
- [ ] Products display correctly
- [ ] Cart functionality works
- [ ] Checkout flow works
- [ ] Stripe payment integration works
- [ ] Admin dashboard accessible (for admin users)

---

## 🔧 Post-Deployment Configuration

### 1. Update Stripe Webhook URL (if changed)
If your Vercel domain is different, update Stripe webhook endpoint:
- Stripe Dashboard → Webhooks
- Update endpoint URL if needed (should still point to Supabase Edge Function)

### 2. Configure Custom Domain (Optional)
- Vercel Dashboard → Project → Settings → Domains
- Add your custom domain
- Update DNS records as instructed

### 3. Set Up Production Stripe Keys
When ready for production:
- Switch `VITE_STRIPE_PUBLISHABLE_KEY` to production key (`pk_live_...`)
- Update Supabase Edge Function secrets with production `STRIPE_SECRET_KEY`
- Update Stripe webhook to use production webhook secret

---

## ⚠️ Important Notes

1. **Build Output:** Vite builds to `dist/` folder (configured in `vercel.json`)

2. **SPA Routing:** `vercel.json` includes rewrite rules so React Router works correctly

3. **Environment Variables:** 
   - All `VITE_*` variables are exposed to the browser
   - Never add `SUPABASE_SERVICE_ROLE_KEY` to Vercel (it's server-side only)

4. **Edge Functions:** These run on Supabase, not Vercel. They're already deployed separately.

5. **Database:** All database operations happen via Supabase, so no database connection needed in Vercel.

---

## 🐛 Troubleshooting

### Build Fails
- Check that all environment variables are set in Vercel
- Verify `package.json` has correct build script
- Check build logs in Vercel dashboard

### 404 Errors on Routes
- Verify `vercel.json` has the rewrite rule for SPA routing
- Check that `index.html` exists in root

### Stripe Payments Not Working
- Verify `VITE_STRIPE_PUBLISHABLE_KEY` is set correctly
- Check Supabase Edge Functions are deployed
- Verify Stripe webhook is configured correctly

### Images Not Loading
- Check Supabase Storage bucket `product-images` exists and is public
- Verify storage policies are set correctly

---

## ✅ Your Project is Ready!

Your project has:
- ✅ Build script configured (`npm run build`)
- ✅ Vite configuration ready
- ✅ `vercel.json` created with SPA routing
- ✅ All frontend code ready

**Just make sure to:**
1. Run the new SQL migrations (`fix-stock-decrement-timing.sql` and `add-restore-stock-function.sql`)
2. Deploy the new Edge Functions (`process-refund` and `send-order-email`)
3. Add environment variables in Vercel dashboard
4. Deploy!

Good luck! 🚀

