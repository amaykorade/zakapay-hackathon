# ZakaPay - Split Payment Application

A modern, full-stack application for splitting payments among multiple people with real-time tracking and management.

## 🚀 Features

### Core Functionality
- **Split Payments**: Create payment collections and split amounts equally or with custom amounts
- **Real-time Tracking**: Monitor payment status in real-time
- **Multiple Payment Methods**: Support for various payment providers (Stripe, PayPal, Venmo, UPI)
- **Custom Split Options**: Choose between equal split or set custom amounts for each person
- **Payment Cancellation**: Cancel pending payments with confirmation
- **Toast Notifications**: User-friendly feedback for all actions

### Authentication & Security
- **Google OAuth**: Secure authentication with Google
- **Session Management**: Persistent user sessions
- **Secure Payment Processing**: Stripe integration for secure transactions

### User Experience
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Modern UI**: Clean, intuitive interface with Tailwind CSS
- **Real-time Updates**: Instant status updates and notifications
- **Dashboard Management**: Comprehensive payment tracking and management

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS 4
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Neon)
- **Authentication**: NextAuth.js with Google OAuth
- **Payments**: Stripe API
- **Deployment**: Vercel-ready

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Google OAuth credentials
- Stripe account

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/amaykorade/zakapay-hackathon.git
cd zakapay-hackathon
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Copy the example environment file and fill in your credentials:
```bash
cp .env.example .env
```

Update the `.env` file with your actual values:
```env
# Database
DATABASE_URL="your-postgresql-connection-string"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Stripe
STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="whsec_your-stripe-webhook-secret"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Database Setup
```bash
npx prisma db push
```

### 5. Run the Application
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📱 Usage

### Creating a Payment Collection
1. Click "Create Split Payment"
2. Enter payment details (title, amount, number of people)
3. Choose split type (equal or custom)
4. Add payer information
5. Generate payment links

### Managing Payments
1. View all collections in the dashboard
2. Track payment progress in real-time
3. Copy payment links to share with payers
4. Cancel pending payments if needed

### Making Payments
1. Click on a payment link
2. Choose payment method (single or multi-card)
3. Complete payment securely through Stripe
4. Receive confirmation

## 🔧 API Endpoints

- `GET /api/collections` - Fetch all payment collections
- `POST /api/collections` - Create new payment collection
- `GET /api/payers/[slug]` - Get payer details
- `POST /api/payments/cancel` - Cancel a payment
- `POST /api/stripe/create-checkout` - Create Stripe checkout session
- `POST /api/stripe/webhook` - Handle Stripe webhooks

## 🎨 Customization

### Adding New Payment Providers
1. Update the `PaymentMethodType` enum in `prisma/schema.prisma`
2. Add provider logic in `/api/payments/process-multi-card/[paymentId]/route.js`
3. Update the UI components to include the new provider

### Styling
The application uses Tailwind CSS for styling. Modify the classes in the components to customize the appearance.

## 🚀 Deployment

### Vercel Deployment
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production
Make sure to set all required environment variables in your production environment:
- Database connection string
- NextAuth configuration
- Google OAuth credentials
- Stripe keys (use live keys for production)

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For support, email support@zakapay.com or create an issue in the repository.

---

Built with ❤️ for easy payment splitting