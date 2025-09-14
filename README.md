# ZakaPay - Split Payment Collection Platform

A modern, secure platform for collecting split payments from multiple people. Perfect for group expenses, service payments, shared costs, and any scenario where you need to collect money from multiple individuals.

## 🚀 Live Demo

**Production URL:** [https://zakapay-hackathon.vercel.app](https://zakapay-hackathon.vercel.app)

## ✨ Features

### Core Functionality
- **Split Payment Collection**: Create payment collections and split amounts among multiple payers
- **Custom Split Options**: Choose between equal splits or custom amounts per person
- **Unique Payment Links**: Each payer gets their own secure, personalized payment link
- **Real-time Tracking**: Monitor payment status in real-time with live updates
- **Multi-Card Support**: Allocate payments across multiple payment methods
- **Payment Cancellation**: Cancel pending payments from dashboard or payment page

### User Experience
- **Google OAuth Integration**: Secure authentication with Google accounts
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Toast Notifications**: Real-time feedback for user actions
- **Professional UI**: Clean, modern interface built with Tailwind CSS
- **Expandable Cards**: View all payers with expand/collapse functionality

### Payment Processing
- **Stripe Integration**: Secure payment processing with Stripe
- **Webhook Support**: Real-time payment status updates
- **Test Mode**: Full support for Stripe test keys during development
- **Production Ready**: Configured for live payments

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS 4
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js with Google OAuth
- **Payments**: Stripe
- **Deployment**: Vercel
- **Styling**: Tailwind CSS with custom components

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Google OAuth credentials
- Stripe account (test or live)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/amaykorade/zakapay-hackathon.git
   cd zakapay-hackathon
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/zakapay"

   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"

   # Google OAuth
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"

   # Stripe
   STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."

   # App URL
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 How to Use

### For Payment Collectors

1. **Sign In**: Use Google OAuth to authenticate
2. **Create Collection**: 
   - Enter total amount to collect
   - Add payer names and email addresses
   - Choose split method (equal or custom amounts)
3. **Get Payment Links**: Receive unique links for each payer
4. **Share Links**: Send links to respective payers via email/messaging
5. **Track Progress**: Monitor real-time payment status on dashboard
6. **Manage Payments**: Cancel pending payments if needed

### For Payers

1. **Click Payment Link**: Open the unique link sent to you
2. **Review Details**: See amount, description, and payment info
3. **Pay Securely**: Complete payment using Stripe's secure checkout
4. **Get Confirmation**: Receive payment confirmation

## 🔧 Configuration

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized origins and redirect URIs:
   - **Authorized JavaScript Origins**: `http://localhost:3000`, `https://yourdomain.com`
   - **Authorized Redirect URIs**: `http://localhost:3000/api/auth/callback/google`, `https://yourdomain.com/api/auth/callback/google`

### Stripe Setup

1. Create account at [Stripe](https://stripe.com)
2. Get API keys from dashboard
3. Set up webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
4. Configure webhook events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`

### Database Setup

1. Create PostgreSQL database
2. Update `DATABASE_URL` in `.env`
3. Run `npx prisma db push` to create tables

## 🚀 Deployment

### Vercel Deployment

1. **Connect Repository**
   - Import project from GitHub to Vercel
   - Vercel will auto-detect Next.js configuration

2. **Set Environment Variables**
   - Add all variables from `.env` to Vercel dashboard
   - Update URLs to use production domain

3. **Deploy**
   - Vercel will automatically build and deploy
   - Monitor build logs for any issues

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
zakapay/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # NextAuth configuration
│   │   │   ├── collections/   # Collection management
│   │   │   ├── payments/      # Payment processing
│   │   │   └── stripe/        # Stripe integration
│   │   ├── create/            # Create payment page
│   │   ├── dashboard/         # Main dashboard
│   │   └── pay/[slug]/        # Payment page
│   ├── components/            # React components
│   └── lib/                   # Utilities and configurations
├── prisma/
│   └── schema.prisma          # Database schema
├── public/                    # Static assets
└── vercel.json               # Vercel configuration
```

## 🔒 Security Features

- **OAuth Authentication**: Secure Google OAuth integration
- **Stripe Security**: PCI-compliant payment processing
- **Environment Variables**: Sensitive data stored securely
- **Input Validation**: Server-side validation for all inputs
- **HTTPS Only**: Production deployment uses HTTPS

## 🧪 Testing

### Stripe Test Mode
- Use Stripe test keys for development
- Test payments with Stripe test card numbers
- Webhook testing with Stripe CLI

### Test Card Numbers
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
```

## 🐛 Troubleshooting

### Common Issues

1. **Prisma Client Error on Vercel**
   - Ensure `prisma generate` runs during build
   - Check `vercel.json` configuration
   - Verify database connection

2. **Google OAuth Issues**
   - Verify authorized URLs in Google Console
   - Check `NEXTAUTH_URL` and `NEXTAUTH_SECRET`
   - Ensure environment variables are set

3. **Stripe Webhook Issues**
   - Verify webhook endpoint URL
   - Check webhook secret
   - Test with Stripe CLI

4. **Payment Links Not Working**
   - Check `NEXT_PUBLIC_APP_URL` environment variable
   - Verify Stripe keys are correct
   - Test webhook functionality

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Amay Korade**
- GitHub: [@amaykorade](https://github.com/amaykorade)
- Project: [ZakaPay](https://github.com/amaykorade/zakapay-hackathon)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing framework
- [Stripe](https://stripe.com/) for payment processing
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Prisma](https://prisma.io/) for database management
- [Vercel](https://vercel.com/) for deployment platform

---

**Ready to start collecting payments?** [Try ZakaPay now!](https://zakapay-hackathon.vercel.app)