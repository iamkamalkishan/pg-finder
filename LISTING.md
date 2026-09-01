# 🏠 PG Finder — Girls PG/Hostel Finder App Template (Expo + Firebase)

**Complete React Native (Expo) template for PG, hostel & rental accommodation discovery apps — built for the Indian market with safety-first features. Includes Firebase backend, demo mode, and 15+ production screens.**

---

## ✨ Why This Template?

- **Blue-ocean niche** — no major template marketplace has a dedicated PG/hostel finder
- **Runs out of the box** — built-in DEMO MODE with realistic Indian PG data; zero Firebase setup needed to preview
- **Full-stack** — client + Firebase Auth/Firestore/Storage/Functions + security rules included
- **Modern stack** — Expo SDK 57, React Native 0.86, TypeScript, NativeWind (Tailwind), React Navigation 7
- **India-ready** — 100+ Indian cities, ₹ pricing, UPI payout flows, phone OTP auth

## 📱 What's Included (15+ Screens)

**For Girls (Users):**
- Onboarding + Phone OTP login (Firebase Auth)
- Home feed with verified PG cards & safety scores
- Advanced search: city, rent range, sharing (1/2/3), amenities, safety filters
- PG detail: photo gallery, room types, amenities, rules, map, reviews
- Girls-only verified reviews with rating categories
- SOS emergency button with live location sharing
- In-app chat with PG owners

**For PG Owners:**
- Owner dashboard with analytics (views, enquiries, revenue)
- Add/edit PG listings with photos & document verification
- Enquiry management with status tracking
- Payout tracking with UPI withdrawal flow

**Safety System:**
- Safety score algorithm (CCTV, security guard, biometric entry, police verification, female warden...)
- Verified owner & verified PG badges

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 57 + React Native 0.86 |
| Language | TypeScript |
| Navigation | React Navigation 7 (Bottom Tabs + Stacks) |
| Styling | NativeWind 4 (Tailwind CSS) |
| Backend | Firebase (Auth, Firestore, Storage, Functions) |
| Payments | Razorpay integration ready (test mode) |
| Maps | react-native-maps |
| Platforms | iOS, Android, Web (all from one codebase) |

## 🚀 Quick Start

```bash
npm install
npm start          # Demo mode — works instantly, no keys needed
```

Add Firebase keys to `.env.local` when ready to go live (step-by-step guide in README).

## 📦 What You Get

- Full source code (clean, commented, organized)
- Demo mode with 20+ realistic PG listings across Indian cities
- Firebase security rules (`firestore.rules`)
- Cloud Functions for commission calculation & notifications
- Setup script (`setup.sh`) + detailed README
- Placeholder assets (icons, splash, notification sound)

## 💰 Monetization Built-In

Commission-based booking system pre-implemented:
- Below ₹10K/month rent: 10% commission
- ₹10K–20K: 8% commission
- ₹20K+: 5% commission

## 📄 License

Single purchase = use in one end product (CodeCanyon regular license terms).

## 🔧 Requirements

- Node.js 18+
- Expo Go app on your phone (for testing)
- Firebase account (free Spark plan works) for production