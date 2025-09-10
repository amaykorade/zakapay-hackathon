# Google Authentication Setup

## 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API:
   - Go to **APIs & Services > Library**
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to **APIs & Services > Credentials**
   - Click **Create Credentials > OAuth 2.0 Client IDs**
   - Choose **Web application**
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://yourdomain.com/api/auth/callback/google` (production)

## 2. Get Your Credentials

After creating the OAuth client:
1. Copy the **Client ID**
2. Copy the **Client Secret**

## 3. Update Environment Variables

Add these to your `.env` file:

```env
# Database (you already have this)
DATABASE_URL="your_neon_database_url"

# Stripe Keys (you already have these)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 4. Generate NextAuth Secret

Generate a random secret for NextAuth:

```bash
openssl rand -base64 32
```

Or use an online generator: https://generate-secret.vercel.app/32

## 5. Test the Authentication

1. Start your app: `npm run dev`
2. Go to `http://localhost:3000`
3. Click "Sign in with Google"
4. Complete Google OAuth flow
5. You should be redirected to the dashboard

## 6. Production Setup

For production deployment:

1. Update Google OAuth redirect URIs to include your production domain
2. Set `NEXTAUTH_URL` to your production URL
3. Update `NEXT_PUBLIC_APP_URL` to your production URL
4. Ensure all environment variables are set in your hosting platform

## Troubleshooting

- **"redirect_uri_mismatch"**: Check that your redirect URI in Google Console matches exactly
- **"invalid_client"**: Verify your Client ID and Secret are correct
- **"access_denied"**: User cancelled the OAuth flow
- **Database errors**: Make sure you've run the Prisma migration

## Security Notes

- Never commit your `.env` file to version control
- Use different OAuth credentials for development and production
- Regularly rotate your secrets
- Monitor OAuth usage in Google Cloud Console
