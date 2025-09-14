# Vercel Deployment Guide for ZakaPay

## 🚀 Step 1: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository: `amaykorade/zakapay-hackathon`
4. Vercel will automatically detect it's a Next.js project
5. Click "Deploy" (we'll configure environment variables after)

### Option B: Deploy via Vercel CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

## 🔧 Step 2: Environment Variables Configuration

After deployment, you need to configure these environment variables in Vercel:

### 2.1 Database Configuration
- **Variable**: `DATABASE_URL`
- **Value**: Your production PostgreSQL connection string
- **Example**: `postgresql://username:password@ep-xxx.us-east-1.postgres.neon.tech/zakapay?sslmode=require`

### 2.2 NextAuth Configuration
- **Variable**: `NEXTAUTH_URL`
- **Value**: Your Vercel domain (e.g., `https://zakapay-hackathon.vercel.app`)
- **Variable**: `NEXTAUTH_SECRET`
- **Value**: Generate a random secret: `openssl rand -base64 32`

### 2.3 Google OAuth Configuration
- **Variable**: `GOOGLE_CLIENT_ID`
- **Value**: Your Google OAuth Client ID
- **Variable**: `GOOGLE_CLIENT_SECRET`
- **Value**: Your Google OAuth Client Secret

### 2.4 Stripe Configuration
- **Variable**: `STRIPE_PUBLISHABLE_KEY`
- **Value**: Your Stripe Publishable Key (starts with `pk_live_`)
- **Variable**: `STRIPE_SECRET_KEY`
- **Value**: Your Stripe Secret Key (starts with `sk_live_`)
- **Variable**: `STRIPE_WEBHOOK_SECRET`
- **Value**: Your Stripe Webhook Secret (starts with `whsec_`)

### 2.5 App URL
- **Variable**: `NEXT_PUBLIC_APP_URL`
- **Value**: Your Vercel domain (e.g., `https://zakapay-hackathon.vercel.app`)

## 🗄️ Step 3: Database Setup

### 3.1 Create Production Database
1. Go to [Neon Console](https://console.neon.tech) (or your preferred PostgreSQL provider)
2. Create a new database
3. Copy the connection string
4. Add it to Vercel environment variables as `DATABASE_URL`

### 3.2 Run Database Migrations
After setting up the database, run:
```bash
npx prisma db push
```
Or if you have migrations:
```bash
npx prisma migrate deploy
```

## 🔐 Step 4: Google OAuth Setup

### 4.1 Update Google OAuth Settings
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to APIs & Services > Credentials
3. Edit your OAuth 2.0 Client ID
4. Add your Vercel domain to:
   - **Authorized JavaScript origins**: `https://zakapay-hackathon.vercel.app`
   - **Authorized redirect URIs**: `https://zakapay-hackathon.vercel.app/api/auth/callback/google`

## 💳 Step 5: Stripe Configuration

### 5.1 Switch to Live Mode
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Toggle to "Live mode" (top right)
3. Get your live API keys from Developers > API keys

### 5.2 Configure Webhooks
1. Go to Developers > Webhooks
2. Click "Add endpoint"
3. **Endpoint URL**: `https://zakapay-hackathon.vercel.app/api/stripe/webhook`
4. **Events to send**:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook secret and add it to Vercel as `STRIPE_WEBHOOK_SECRET`

## 🔄 Step 6: Update Code for Production

### 6.1 Update NextAuth Configuration
The current configuration should work, but verify in `src/app/api/auth/[...nextauth]/route.js`:

```javascript
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // ... existing code
    },
    async jwt({ token, account, profile }) {
      // ... existing code
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
```

### 6.2 Verify Environment Variables
Make sure all environment variables are properly referenced in your code.

## 🧪 Step 7: Testing

### 7.1 Test Authentication
1. Visit your Vercel domain
2. Try signing in with Google
3. Verify the dashboard loads

### 7.2 Test Payment Flow
1. Create a test payment collection
2. Try the payment flow with Stripe test cards
3. Verify webhooks are working

### 7.3 Test Webhooks Locally (Optional)
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## 🚨 Common Issues & Solutions

### Issue 1: Database Connection Error
- **Solution**: Verify `DATABASE_URL` is correct and database is accessible
- **Check**: SSL mode is enabled for production databases

### Issue 2: Google OAuth Error
- **Solution**: Verify redirect URIs include your Vercel domain
- **Check**: Client ID and secret are correct

### Issue 3: Stripe Webhook Error
- **Solution**: Verify webhook URL and events are configured correctly
- **Check**: Webhook secret matches the one in environment variables

### Issue 4: NextAuth Error
- **Solution**: Verify `NEXTAUTH_URL` and `NEXTAUTH_SECRET` are set
- **Check**: Secret is properly generated

## 📊 Step 8: Monitoring

### 8.1 Vercel Analytics
- Enable Vercel Analytics in your dashboard
- Monitor performance and errors

### 8.2 Stripe Dashboard
- Monitor payments and webhooks
- Check for failed payments

### 8.3 Database Monitoring
- Monitor database performance
- Set up alerts for connection issues

## 🔄 Step 9: Continuous Deployment

Your app will automatically redeploy when you push to the `master` branch. Make sure to:
1. Test changes locally first
2. Update environment variables if needed
3. Monitor the deployment logs

## 📝 Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database connected and migrated
- [ ] Google OAuth working
- [ ] Stripe live mode configured
- [ ] Webhooks working
- [ ] Payment flow tested
- [ ] Authentication working
- [ ] All features tested

## 🆘 Support

If you encounter issues:
1. Check Vercel function logs
2. Check Stripe webhook logs
3. Verify all environment variables
4. Test locally with production environment variables

---

**Your app will be live at**: `https://zakapay-hackathon.vercel.app` (or your custom domain)
