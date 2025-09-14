# ZakaPay - Developer Setup Guide

## 🚀 Quick Setup (5 minutes)

### 1. Clone & Install
```bash
git clone https://github.com/amaykorade/zakapay-hackathon.git
cd zakapay-hackathon
npm install
```

### 2. Environment Variables
Create `.env` file:
```env
# Database (use any PostgreSQL URL)
DATABASE_URL="postgresql://username:password@localhost:5432/zakapay"

# NextAuth (generate secret: openssl rand -base64 32)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Stripe (use test keys from Stripe Dashboard)
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Database Setup
```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```

**That's it!** Open [http://localhost:3000](http://localhost:3000)

## 🔧 Service Setup

### Google OAuth (2 minutes)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project → Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized URLs:
   - **JavaScript Origins**: `http://localhost:3000`
   - **Redirect URIs**: `http://localhost:3000/api/auth/callback/google`

### Stripe (1 minute)
1. Sign up at [Stripe](https://stripe.com)
2. Get test keys from Dashboard → Developers → API keys
3. For webhooks: Add endpoint `http://localhost:3000/api/stripe/webhook`
4. Select events: `checkout.session.completed`, `payment_intent.succeeded`

### Database (1 minute)
**Option A: Local PostgreSQL**
```bash
# Install PostgreSQL, create database
createdb zakapay
```

**Option B: Free Cloud Database**
- [Neon](https://neon.tech) - Free PostgreSQL
- [Supabase](https://supabase.com) - Free PostgreSQL
- [Railway](https://railway.app) - Free PostgreSQL

## 🧪 Testing

### Test Cards (Stripe Test Mode)
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Expiry: Any future date
CVC: Any 3 digits
```

### Test Flow
1. Create payment collection
2. Use test card numbers
3. Check dashboard for updates
4. Test webhook with Stripe CLI

## 🚀 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy!

### Environment Variables for Production
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://yourdomain.vercel.app"
NEXTAUTH_SECRET="your-production-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_APP_URL="https://yourdomain.vercel.app"
```

## 📁 Project Structure
```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API endpoints
│   ├── create/         # Create payment page
│   ├── dashboard/      # Main dashboard
│   └── pay/[slug]/     # Payment page
├── components/         # React components
└── lib/               # Utilities
```

## 🐛 Common Issues

### Prisma Error on Vercel
- Ensure `prisma generate` runs during build
- Check `vercel.json` configuration

### Google OAuth Issues
- Verify authorized URLs
- Check environment variables

### Stripe Webhook Issues
- Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- Verify webhook secret

## 📚 Documentation
- **Full README**: [README.md](README.md)
- **Quick Start**: [QUICK_START.md](QUICK_START.md)
- **API Docs**: Check `/api` routes in code

## 🤝 Contributing
1. Fork repository
2. Create feature branch
3. Make changes
4. Submit pull request

---

**Need help?** Open an issue on GitHub or check the full documentation!
