# ZakaPay - Quick Start Guide

## 🎯 What is ZakaPay?

ZakaPay is a **split payment collection platform** that helps you collect money from multiple people easily. Think of it as a digital way to split bills, collect group payments, or manage shared expenses.

## 🚀 Live Demo
**Try it now:** [https://zakapay-hackathon.vercel.app](https://zakapay-hackathon.vercel.app)

## ⚡ 30-Second Overview

1. **You need to collect ₹1000 from 3 friends**
2. **Create a payment collection** on ZakaPay
3. **Get 3 unique payment links** (one for each friend)
4. **Send links to your friends** via WhatsApp/email
5. **Friends pay securely** using their cards
6. **You track everything** in real-time on your dashboard

## 🎯 Perfect For

- **Group dinners** - Split restaurant bills
- **Rent collection** - Collect monthly rent from roommates  
- **Event tickets** - Sell tickets to friends
- **Service payments** - Collect fees from multiple clients
- **Shared expenses** - Split utilities, groceries, etc.
- **Crowdfunding** - Collect donations or contributions

## 🛠️ How It Works

### For Payment Collectors (You)

```
1. Sign in with Google
   ↓
2. Create collection (amount + payers)
   ↓  
3. Get unique payment links
   ↓
4. Share links with payers
   ↓
5. Track payments in dashboard
```

### For Payers (Your Friends)

```
1. Click payment link
   ↓
2. See amount & details
   ↓
3. Pay with card (Stripe)
   ↓
4. Get confirmation
```

## 💡 Key Features

- ✅ **Equal or Custom Splits** - Split equally or set custom amounts
- ✅ **Unique Payment Links** - Each person gets their own secure link
- ✅ **Real-time Tracking** - See who paid, who didn't
- ✅ **Cancel Payments** - Cancel pending payments if needed
- ✅ **Mobile Friendly** - Works on all devices
- ✅ **Secure Payments** - Powered by Stripe

## 🚀 Get Started in 2 Minutes

### Option 1: Try the Live Demo
1. Go to [https://zakapay-hackathon.vercel.app](https://zakapay-hackathon.vercel.app)
2. Click "Sign in with Google"
3. Create your first payment collection
4. Share the links and start collecting!

### Option 2: Run Locally
```bash
# Clone the repo
git clone https://github.com/amaykorade/zakapay-hackathon.git
cd zakapay-hackathon

# Install dependencies
npm install

# Set up environment variables (see README.md)
# Run the app
npm run dev
```

## 🔧 What You Need

### For Testing (Free)
- Google account (for login)
- Stripe test account (free)
- No real money required

### For Production
- Google OAuth setup
- Stripe live account
- Domain name (optional)

## 📱 Example Use Cases

### 1. Restaurant Bill Split
- **Scenario**: Dinner bill of ₹2000 for 4 people
- **Action**: Create collection, split equally (₹500 each)
- **Result**: 4 payment links, everyone pays their share

### 2. Event Ticket Sales
- **Scenario**: Selling concert tickets at ₹500 each to 10 friends
- **Action**: Create collection with custom amounts
- **Result**: 10 individual payment links

### 3. Rent Collection
- **Scenario**: Monthly rent of ₹15000, 3 roommates
- **Action**: Split equally (₹5000 each) or custom amounts
- **Result**: Easy rent collection every month

## 🎨 Screenshots

### Dashboard View
- See all your payment collections
- Track payment progress
- Manage pending payments

### Payment Page
- Clean, secure payment interface
- Real-time status updates
- Mobile-optimized design

## 🆘 Need Help?

### Common Questions

**Q: Is it free to use?**
A: Yes! Uses Stripe test mode for free testing. Live payments have small Stripe fees.

**Q: Do payers need accounts?**
A: No! Payers just click the link and pay with their card.

**Q: Is it secure?**
A: Yes! Uses Stripe for payments and Google OAuth for authentication.

**Q: Can I cancel payments?**
A: Yes! You can cancel pending payments from the dashboard.

### Support
- **GitHub Issues**: [Report bugs or request features](https://github.com/amaykorade/zakapay-hackathon/issues)
- **Documentation**: See [README.md](README.md) for detailed setup

## 🚀 Ready to Start?

**Try ZakaPay now:** [https://zakapay-hackathon.vercel.app](https://zakapay-hackathon.vercel.app)

---

*Built with ❤️ using Next.js, Stripe, and Tailwind CSS*
