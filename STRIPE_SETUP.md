# Stripe Integration Setup

## 1. Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Sign up/Login to your account
3. Go to **Developers > API Keys**
4. Copy your **Publishable key** and **Secret key**

## 2. Set up Environment Variables

Create a `.env` file in your project root with:

```env
# Database (you already have this)
DATABASE_URL="your_neon_database_url"

# Stripe Keys
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 3. Set up Stripe Webhook

1. Go to **Developers > Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Set URL to: `http://localhost:3000/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the **Signing secret** and add it to your `.env` file

## 4. Test the Integration

1. Start your app: `npm run dev`
2. Create a split payment
3. Click on a payment link
4. Click "Pay" button - it will redirect to Stripe Checkout
5. Use test card: `4242 4242 4242 4242`
6. Complete payment and see it update in your dashboard

## Test Cards

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

## Production Setup

For production:
1. Use live API keys (sk_live_... and pk_live_...)
2. Update webhook URL to your production domain
3. Set `NEXT_PUBLIC_APP_URL` to your production URL
