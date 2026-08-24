# PG Finder for Girls 🏠👩

A zero-investment, solo-developed, pan-India PG Finder app for girls with safety-first features, monetized via commission per booking.

## Features

### For Girls 🎯
- **Phone OTP Authentication** - Secure, passwordless login
- **PG Search & Filters** - City, rent, sharing, amenities, safety features
- **Map View** - Find PGs near you with safety scores
- **Verified PGs** - Only verified properties shown (owner documents verified)
- **Girls-Only Reviews** - Only girls who stayed can review
- **Safety Score** - AI-powered neighborhood safety analysis
- **SOS Button** - One-tap emergency alert with location sharing
- **In-App Chat** - Direct communication with owners
- **Booking & Commission** - Transparent booking with platform fee

### For PG Owners 🏢
- **Owner Verification** - Document upload & verification
- **Listing Management** - Add/edit PGs with photos, amenities, rules
- **Enquiry Dashboard** - Manage incoming enquiries with status tracking
- **Analytics** - Views, enquiries, bookings, revenue tracking
- **Payout Tracking** - Commission transparency, payout requests

### Safety First 🛡️
- Girls-only platform
- Verified owner badges
- Verified PG badges
- Girls-only reviews (verified stays only)
- Safety score for every area
- SOS emergency button
- Police-verified PGs highlighted

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native + Expo + TypeScript |
| Navigation | React Navigation (Bottom Tabs + Stack) |
| State | React Context + Hooks |
| Backend | Firebase (Auth, Firestore, Storage, Functions) |
| Auth | Phone OTP (Firebase Auth) |
| Database | Firestore (real-time, offline-capable) |
| Storage | Firebase Storage (images, documents) |
| Functions | Firebase Functions (commission, notifications) |
| Payments | Razorpay (test mode initially) |
| Maps | Google Maps / React Native Maps |
| Notifications | Expo Notifications + FCM |
| Styling | NativeWind (Tailwind for RN) |
| Build | EAS Build (free tier) |
| Web Deploy | Vercel (free tier) |
| CI/CD | GitHub Actions + EAS |

## Project Structure

```
pg-finder/
├── src/
│   ├── assets/           # Images, icons, fonts
│   ├── components/
│   │   ├── ui/           # Reusable UI components
│   │   ├── forms/        # Form components
│   │   ├── map/          # Map components
│   │   ├── chat/         # Chat components
│   │   ├── listing/      # Listing components
│   │   └── owner/        # Owner-specific components
│   ├── context/          # React Context providers
│   ├── hooks/            # Custom hooks
│   ├── navigation/       # Navigation configuration
│   ├── screens/
│   │   ├── auth/         # Authentication screens
│   │   ├── home/         # Home & search screens
│   │   ├── listing/      # PG detail screens
│   │   ├── chat/         # Chat screens
│   │   ├── profile/      # User profile
│   │   ├── owner/        # Owner dashboard screens
│   │   └── safety/       # Safety features (SOS, reviews, scores)
│   ├── services/
│   │   ├── auth/         # Firebase Auth
│   │   ├── firebase/     # Firebase config
│   │   ├── firestore/    # Firestore operations
│   │   └── storage/      # Storage operations
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   └── constants/        # App constants
├── functions/            # Firebase Cloud Functions
├── app.json              # Expo config
├── eas.json              # EAS Build config
├── vercel.json           # Vercel deploy config
├── tsconfig.json         # TypeScript config
├── babel.config.js       # Babel config
├── metro.config.js       # Metro config
└── global.css            # NativeWind/Tailwind
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- EAS CLI (`npm install -g eas-cli`)
- Firebase project (Spark plan - free)
- Razorpay account (test mode)

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/pg-finder.git
cd pg-finder

# Run setup script
chmod +x setup.sh
./setup.sh

# Or manually:
npm install
cp .env.example .env.local
# Edit .env.local with your credentials
```

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication → Phone provider
3. Create Firestore database (start in test mode)
4. Enable Storage
5. Enable Functions (upgrade to Blaze plan for Functions, or use emulator)
6. Copy config to `.env.local`

### Development

```bash
# Start Expo dev server
npm start

# Run on specific platform
npm run android
npm run ios
npm run web
```

### Building

```bash
# Development build (internal distribution)
eas build --profile development

# Preview build (APK for testing)
eas build --profile preview

# Production build (App Store / Play Store)
eas build --profile production

# Submit to stores
eas submit --platform all

# Web deployment
vercel --prod
```

## Firebase Security Rules

The app includes comprehensive Firestore rules in `firestore.rules`:
- Girls can only read/write their own data
- Owners manage their own PGs and enquiries
- Reviews only by girls with verified stays
- Commission transactions readable by owners/admins

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

## Cloud Functions

Key functions in `functions/index.ts`:
- Commission calculation on booking
- PG stats updates
- Push notifications (new messages, enquiries)
- Safety score calculation
- Payout processing

Deploy functions:
```bash
cd functions
npm install
firebase deploy --only functions
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase Web API Key | Yes |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | Yes |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID | Yes |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | Yes |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | FCM Sender ID | Yes |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase App ID | Yes |
| `EXPO_PUBLIC_RAZORPAY_KEY_ID` | Razorpay Test Key ID | Yes |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API Key | For web |

## Monetization

**Commission Model:**
- ₹10,000-19,999/month: 8% (min ₹500)
- ₹20,000+/month: 5% (min ₹500)
- Below ₹10,000: 10% (min ₹500)

Platform fee deducted at booking confirmation, owner gets net amount.

## Free Tier Limits

| Service | Free Tier Limit |
|---------|----------------|
| Firebase Auth | Unlimited phone auth |
| Firestore | 50K reads, 20K writes, 20K deletes/day |
| Storage | 5 GB stored, 1 GB/day download |
| Functions | 2M invocations, 400K GB-seconds/month |
| Expo EAS | 30 builds/month |
| Vercel | 100 GB bandwidth, unlimited personal projects |

## Deployment Checklist

- [ ] Firebase project created & configured
- [ ] Firestore rules deployed
- [ ] Cloud Functions deployed
- [ ] Razorpay test keys added
- [ ] Google Maps API key (for web)
- [ ] App icons & splash screens added
- [ ] EAS project configured (`eas build:configure`)
- [ ] Test builds on all platforms
- [ ] Vercel project connected
- [ ] Store listings prepared (Play Store / App Store)
- [ ] Privacy policy & terms of service

## Growth Strategy

1. **College Partnerships** - Partner with women's hostels/colleges
2. **Referral Program** - Girls get ₹100 credit per successful referral
3. **SEO** - City-specific landing pages for web
4. **Social Media** - Safety tips, PG tours on Instagram/YouTube
5. **Owner Onboarding** - Free verification for first 100 owners

## License

MIT License - Feel free to use for your own projects!

## Support

For issues, feature requests, or partnerships:
- Create a GitHub issue
- Email: support@pgfinder.example.com

---

Built with ❤️ for girls' safety across India 🇮🇳