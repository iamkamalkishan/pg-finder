import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// Commission calculation
export const calculateCommission = functions.firestore
  .document('enquiries/{enquiryId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Only trigger when status changes to booking-confirmed
    if (before.status !== 'booking-confirmed' && after.status === 'booking-confirmed') {
      const { pgId, ownerId, girlId, bookingDetails } = after;
      
      if (!bookingDetails?.agreedRent) {
        console.log('No agreed rent in booking details');
        return;
      }
      
      const rent = bookingDetails.agreedRent;
      
      // Commission tiers
      let commissionRate = 0.10; // 10% default
      if (rent >= 20000) commissionRate = 0.05;
      else if (rent >= 10000) commissionRate = 0.08;
      
      const platformFee = Math.max(500, Math.round(rent * commissionRate)); // Min ₹500
      const ownerPayout = rent - platformFee;
      
      // Create commission transaction
      await db.collection('commissionTransactions').add({
        enquiryId: context.params.enquiryId,
        pgId,
        ownerId,
        girlId,
        amount: rent,
        platformFee,
        ownerPayout,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      // Update enquiry with commission details
      await change.after.ref.update({
        'bookingDetails.commission': platformFee,
        'bookingDetails.commissionStatus': 'pending',
      });
      
      console.log(`Commission calculated: ₹${platformFee} for enquiry ${context.params.enquiryId}`);
    }
  });

// Update PG stats on new enquiry
export const updatePGStatsOnEnquiry = functions.firestore
  .document('enquiries/{enquiryId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const pgRef = db.collection('pgs').doc(data.pgId);
    
    await pgRef.update({
      'stats.enquiries': admin.firestore.FieldValue.increment(1),
    });
  });

// Update PG stats on booking
export const updatePGStatsOnBooking = functions.firestore
  .document('enquiries/{enquiryId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    if (before.status !== 'booking-confirmed' && after.status === 'booking-confirmed') {
      const pgRef = db.collection('pgs').doc(after.pgId);
      
      await pgRef.update({
        'stats.bookings': admin.firestore.FieldValue.increment(1),
        'availableRooms': admin.firestore.FieldValue.increment(-1),
      });
    }
  });

// Update PG stats on review
export const updatePGStatsOnReview = functions.firestore
  .document('reviews/{reviewId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const pgRef = db.collection('pgs').doc(data.pgId);
    
    // Get all reviews for this PG to recalculate average
    const reviewsSnap = await db.collection('reviews')
      .where('pgId', '==', data.pgId)
      .get();
    
    let totalOverall = 0;
    let totalSafety = 0;
    let totalCleanliness = 0;
    let totalFood = 0;
    let totalOwnerBehavior = 0;
    let totalValueForMoney = 0;
    
    reviewsSnap.docs.forEach(doc => {
      const r = doc.data();
      totalOverall += r.rating.overall;
      totalSafety += r.rating.safety;
      totalCleanliness += r.rating.cleanliness;
      totalFood += r.rating.food;
      totalOwnerBehavior += r.rating.ownerBehavior;
      totalValueForMoney += r.rating.valueForMoney;
    });
    
    const count = reviewsSnap.size;
    
    await pgRef.update({
      'stats.avgRating': totalOverall / count,
      'stats.reviewCount': count,
    });
  });

// Send notification on new message
export const sendMessageNotification = functions.firestore
  .document('enquiries/{enquiryId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const enquiryRef = db.collection('enquiries').doc(context.params.enquiryId);
    const enquiryDoc = await enquiryRef.get();
    const enquiry = enquiryDoc.data();
    
    if (!enquiry) return;
    
    // Determine recipient (opposite of sender)
    const recipientId = message.senderRole === 'girl' ? enquiry.ownerId : enquiry.girlId;
    const recipientRef = db.collection('users').doc(recipientId);
    const recipientDoc = await recipientRef.get();
    const recipient = recipientDoc.data();
    
    if (!recipient?.fcmToken) return;
    
    // Send FCM notification
    const payload = {
      token: recipient.fcmToken,
      notification: {
        title: `New message from ${message.senderRole === 'girl' ? 'Girl' : 'Owner'}`,
        body: message.text.length > 50 ? message.text.substring(0, 50) + '...' : message.text,
      },
      data: {
        enquiryId: context.params.enquiryId,
        type: 'new_message',
      },
    };
    
    try {
      await admin.messaging().send(payload);
      console.log(`Notification sent to ${recipientId}`);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  });

// Send notification on new enquiry
export const sendEnquiryNotification = functions.firestore
  .document('enquiries/{enquiryId}')
  .onCreate(async (snap, context) => {
    const enquiry = snap.data();
    const ownerRef = db.collection('users').doc(enquiry.ownerId);
    const ownerDoc = await ownerRef.get();
    const owner = ownerDoc.data();
    
    if (!owner?.fcmToken) return;
    
    const payload = {
      token: owner.fcmToken,
      notification: {
        title: 'New PG Enquiry! 🏠',
        body: `Someone is interested in your PG. Check it out!`,
      },
      data: {
        enquiryId: context.params.enquiryId,
        type: 'new_enquiry',
      },
    };
    
    try {
      await admin.messaging().send(payload);
      console.log(`Enquiry notification sent to owner ${enquiry.ownerId}`);
    } catch (error) {
      console.error('Error sending enquiry notification:', error);
    }
  });

// Calculate safety score for area
export const calculateSafetyScore = functions.https.onCall(async (data, context) => {
  const { latitude, longitude, radiusKm = 1 } = data;
  
  if (!latitude || !longitude) {
    throw new functions.https.HttpsError('invalid-argument', 'Latitude and longitude required');
  }
  
  // In production, this would query crime data APIs, police records, etc.
  // For now, return a simulated score based on location
  
  // Simulate score calculation
  const baseScore = 50 + Math.random() * 30; // 50-80 base
  
  // Add some deterministic variation based on coordinates
  const coordHash = Math.abs(Math.sin(latitude * 1000) * Math.cos(longitude * 1000)) * 20;
  const score = Math.min(100, Math.round(baseScore + coordHash));
  
  return {
    score,
    breakdown: {
      crimeRate: Math.round(80 - Math.random() * 40),
      lighting: Math.round(60 + Math.random() * 40),
      policePresence: Math.round(50 + Math.random() * 50),
      communityReports: Math.round(70 - Math.random() * 50),
    },
    lastUpdated: new Date().toISOString(),
  };
});

// Process payout request
export const requestPayout = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  
  const { amount, upiId } = data;
  
  if (!amount || amount < 100) {
    throw new functions.https.HttpsError('invalid-argument', 'Minimum ₹100');
  }
  
  if (!upiId || !upiId.includes('@')) {
    throw new functions.https.HttpsError('invalid-argument', 'Valid UPI ID required');
  }
  
  // Check user has enough pending balance
  const transactionsSnap = await db.collection('commissionTransactions')
    .where('ownerId', '==', context.auth.uid)
    .where('status', '==', 'pending')
    .get();
  
  const availableBalance = transactionsSnap.docs.reduce((sum, doc) => sum + doc.data().ownerPayout, 0);
  
  if (amount > availableBalance) {
    throw new functions.https.HttpsError('failed-precondition', 'Insufficient balance');
  }
  
  // In production: Create RazorpayX payout
  // const payout = await razorpay.payouts.create({ ... });
  
  // For now, create a pending payout record
  const payoutRef = await db.collection('payouts').add({
    ownerId: context.auth.uid,
    amount,
    upiId,
    status: 'processing',
    requestedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  // Mark related transactions as processing
  const batch = db.batch();
  transactionsSnap.docs.forEach(doc => {
    batch.update(doc.ref, { status: 'processing' });
  });
  await batch.commit();
  
  return { payoutId: payoutRef.id, status: 'processing' };
});

// Daily cleanup - mark old pending enquiries
export const dailyCleanup = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7); // 7 days old
    
    const oldEnquiries = await db.collection('enquiries')
      .where('status', 'in', ['new', 'responded'])
      .where('createdAt', '<', admin.firestore.Timestamp.fromDate(cutoff))
      .get();
    
    const batch = db.batch();
    oldEnquiries.docs.forEach(doc => {
      batch.update(doc.ref, { status: 'cancelled' });
    });
    
    if (oldEnquiries.size > 0) {
      await batch.commit();
      console.log(`Cancelled ${oldEnquiries.size} old enquiries`);
    }
  });