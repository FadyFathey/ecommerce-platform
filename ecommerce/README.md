# Ecommerce Application

A modern ecommerce application built with React, TypeScript, Vite, and Supabase.

## Features

- Product management with image uploads
- Supabase storage integration for product images
- Admin dashboard for managing products, categories, and orders
- User authentication and profiles

## Supabase Storage Setup

### Automated Setup (Recommended)

The easiest way to set up storage is using the automated script:

1. **Add Service Role Key to .env:**
   - Go to your Supabase Dashboard → Settings → API
   - Copy the `service_role` key (the secret one)
   - Add it to your `.env` file:
     ```
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
     ```
   - ⚠️ **WARNING:** Never commit this key to version control!

2. **Run the Setup Script:**
   ```bash
   npm run setup:complete
   ```
   
   This will automatically:
   - Create the `product-images` storage bucket
   - Set up all necessary storage policies
   - Configure file size limits and allowed types

### Manual Setup

If you prefer to set up manually:

1. **Create Storage Bucket:**
   - Go to your Supabase project dashboard
   - Navigate to Storage
   - Click "New bucket"
   - Name it: `product-images`
   - Make it **Public**
   - Set file size limit: 10MB
   - Allowed MIME types: `image/jpeg, image/jpg, image/png, image/gif, image/webp`

2. **Set Storage Policies:**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Open the file `supabase-storage-policies.sql` from this repository
   - Copy and paste the SQL commands into the SQL Editor
   - Click "Run" to execute the policies

### Environment Variables

Make sure your `.env` file contains:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (for automated setup)
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_pk
```

## Database Migrations (Orders & Secure Products)

Run these SQL files in the Supabase SQL Editor (or via the provided scripts) **before** using checkout/admin features:

- `migrations/add-product-fields.sql` (product fields, variants, reviews)
- `migrations/add-products-rls-policies.sql` (initial RLS)
- `migrations/create-orders-and-policies.sql` (orders/order_items schema, hardened product RLS, checkout RPC)

After applying, ensure your logged-in admin users have `role = 'admin'` in `auth.users.raw_user_meta_data`.

## Payments (Stripe) Setup - Server Side

Environment variables (set in Supabase Edge Functions and locally):
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Edge Functions added:
- `supabase/functions/create-payment-intent`: Validates cart server-side via `create_order_with_items`, creates a Stripe PaymentIntent, and stores `payment_intent_id`.
- `supabase/functions/stripe-webhook`: Listens for Stripe events to update `orders.payment_status` and `status`.

Deploy commands (from repo root, with Supabase CLI configured):
```bash
supabase functions deploy create-payment-intent --project-ref <project-ref>
supabase functions deploy stripe-webhook --project-ref <project-ref>
```

Webhook setup (Stripe Dashboard):
- Endpoint: `https://<your-project>.functions.supabase.co/stripe-webhook`
- Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded` (expand as needed)

Client-side setup:
- Set `VITE_STRIPE_PUBLISHABLE_KEY` in your `.env`.
- Cart checkout now creates a PaymentIntent, then `/checkout` renders Stripe Elements for payment confirmation.

## Product Image Upload

The application supports uploading product images from local devices. Images are:
- Validated (JPEG, PNG, GIF, WebP, max 10MB)
- Uploaded to Supabase Storage
- Stored with unique filenames
- Displayed with preview functionality

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
