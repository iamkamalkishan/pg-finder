# PG Finder - Launch Checklist & Testing Guide

## Pre-Launch Testing Checklist

### Authentication Flow
- [ ] Phone OTP login works for new users
- [ ] Phone OTP login works for existing users
- [ ] Onboarding completes for girls (role selection)
- [ ] Onboarding completes for owners (verification flow)
- [ ] Session persistence across app restarts
- [ ] Logout clears all user data
- [ ] Role-based navigation (girl vs owner tabs)

### PG Listing & Search
- [ ] Create PG listing with all fields
- [ ] Edit PG listing
- [ ] Delete PG listing
- [ ] Photo upload (up to 20 photos)
- [ ] Document upload for verification
- [ ] Search by city/state
- [ ] Filter by rent range
- [ ] Filter by sharing (1/2/3)
- [ ] Filter by property type
- [ ] Filter by amenities
- [ ] Filter by safety features
- [ ] Map view shows nearby PGs
- [ ] PG detail screen shows all info
- [ ] Verified badge shows for verified PGs
- [ ] Owner verified badge shows

### Enquiry & Booking
- [ ] Girl can send enquiry from listing
- [ ] Owner receives enquiry notification
- [ ] Owner can respond to enquiry
- [ ] Chat works between girl and owner
- [ ] Status transitions: new → responded → visit-scheduled → booking-confirmed
- [ ] Booking confirmation calculates commission
- [ ] Commission transaction created
- [ ] Notifications sent on new message/enquiry

### Reviews & Safety
- [ ] Only girls with verified stays can review
- [ ] Review requires all 6 ratings
- [ ] Review photos upload (up to 5)
- [ ] Anonymous review option works
- [ ] Reviews display on PG detail
- [ ] Average ratings calculate correctly
- [ ] SOS button triggers alert
- [ ] SOS sends location
- [ ] Safety score displays for area
- [ ] Verified badges show correctly

### Owner Dashboard
- [ ] Dashboard shows stats (views, enquiries, bookings)
- [ ] Listings tab shows all PGs with status
- [ ] Add new PG flow works
- [ ] Enquiries tab shows all with filters
- [ ] Analytics charts render
- [ ] Payouts tab shows pending/completed
- [ ] Payout request works

### Cross-Platform
- [ ] iOS Simulator - all features work
- [ ] Android Emulator - all features work
- [ ] Web (Chrome) - all features work
- [ ] Web (Safari) - all features work
- [ ] Web (Firefox) - all features work
- [ ] Responsive design on mobile web
- [ ] Responsive design on desktop web

### Performance
- [ ] App launches < 3 seconds
- [ ] Screen transitions < 300ms
- [ ] Image loading with placeholders
- [ ] List scrolling smooth (60fps)
- [ ] Offline mode shows cached data
- [ ] Memory usage < 150MB

### Security
- [ ] Firestore rules block unauthorized access
- [ ] Phone numbers not exposed in client
- [ ] Owner documents not publicly accessible
- [ ] Reviews only by verified stays
- [ ] SOS alerts admin only
- [ ] Commission data owner-only

## Launch Checklist

### Firebase Setup
- [ ] Firebase project created
- [ ] Authentication → Phone provider enabled
- [ ] Firestore database created (production mode)
- [ ] Storage bucket configured
- [ ] Functions deployed (Blaze plan required)
- [ ] Firestore rules deployed
- [ ] Storage rules deployed
- [ ] Custom claims for admin role (if needed)

### App Configuration
- [ ] Bundle ID: `com.pgfinder.girls` (iOS)
- [ ] Package name: `com.pgfinder.girls` (Android)
- [ ] App icons generated (all sizes)
- [ ] Splash screens generated
- [ ] `app.json` configured with correct IDs
- [ ] `eas.json` configured with profiles
- [ ] Environment variables set in EAS

### Build & Deploy
- [ ] Preview build tested on device
- [ ] Production build tested on device
- [ ] TestFlight / Internal Testing track
- [ ] Play Console app created
- [ ] App Store Connect app created
- [ ] Privacy policy URL added
- [ ] Terms of service URL added
- [ ] App Store screenshots ready
- [ ] Play Store screenshots ready
- [ ] Feature graphic ready
- [ ] App description finalized

### Web Deployment
- [ ] Vercel project connected
- [ ] Environment variables set in Vercel
- [ ] Custom domain configured (optional)
- [ ] `vercel.json` configured
- [ ] Build passes on Vercel
- [ ] PWA manifest works
- [ ] Service worker registers

### Payments
- [ ] Razorpay test account created
- [ ] Test keys in environment
- [ ] Webhook endpoint configured
- [ ] Test payment flow works
- [ ] Production keys ready (for later)

### Legal & Compliance
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Data deletion process documented
- [ ] GDPR compliance (if EU users)
- [ ] India IT Act compliance
- [ ] Age rating appropriate (12+)
- [ ] Content guidelines for reviews

### Monitoring & Analytics
- [ ] Firebase Analytics enabled
- [ ] Crashlytics enabled
- [ ] Performance monitoring enabled
- [ ] Error alerting configured
- [ ] Custom events tracked (search, enquiry, booking)

## Post-Launch (First Week)

### Daily
- [ ] Monitor crash reports
- [ ] Check Firebase quota usage
- [ ] Review new user signups
- [ ] Check enquiry response rates
- [ ] Monitor commission transactions

### Weekly
- [ ] Analyze funnel: install → search → enquiry → booking
- [ ] Review safety alerts
- [ ] Check owner verification queue
- [ ] Review pending payouts
- [ ] Update content (blog, tips)

## Growth Hacks Implementation

### Referral Program
- [ ] Referral code generation per user
- [ ] Deep link handling for referrals
- [ ] Credit ₹100 on successful booking
- [ ] Track referral source in analytics
- [ ] In-app referral sharing UI

### SEO (Web)
- [ ] City landing pages: `/city/mumbai`, `/city/delhi`, etc.
- [ ] PG detail pages with structured data
- [ ] Sitemap.xml generation
- [ ] robots.txt configured
- [ ] Meta tags for social sharing
- [ ] Blog: "How to choose safe PG", "PG vs Hostel", etc.

### College Partnerships
- [ ] Partner with women's colleges
- [ ] Campus ambassador program
- [ ] Exclusive verified PGs for students
- [ ] Bulk booking discounts

### Social Media
- [ ] Instagram: Safety tips reels
- [ ] YouTube: PG walkthrough videos
- [ ] Twitter: Safety alerts, tips
- [ ] LinkedIn: Owner onboarding content

### Owner Acquisition
- [ ] Free verification for first 100 owners
- [ ] Featured listing for verified owners
- [ ] Analytics dashboard as value prop
- [ ] Referral bonus for owner referrals

## Rollback Plan

If critical issues found:
1. **Revert to previous build**: `eas build --profile production --previous`
2. **Disable features via Remote Config**: Feature flags for SOS, Chat, Payments
3. **Database rollback**: Point-in-time recovery if data corruption
4. **Communication**: In-app banner + email to users

## Success Metrics (First 30 Days)

| Metric | Target |
|--------|--------|
| Installs | 1,000+ |
| Daily Active Users | 200+ |
| Enquiries sent | 500+ |
| Bookings confirmed | 50+ |
| Owner signups | 100+ |
| PG listings | 200+ |
| Reviews written | 100+ |
| Crash-free sessions | > 99.5% |
| Avg session duration | > 3 min |

## Emergency Contacts

| Role | Contact |
|------|---------|
| Firebase Support | Firebase Console → Support |
| Expo/EAS Support | expo.dev/support |
| Razorpay Support | dashboard.razorpay.com/support |
| Vercel Support | vercel.com/support |
| App Store Review | appstoreconnect.apple.com |
| Play Console Support | play.google.com/console/support |

---

**Remember: Safety first, always. 🛡️**