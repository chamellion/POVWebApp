/**
 * Test script to verify site settings are properly connected to the database
 * 
 * Usage: node scripts/test-settings.js
 * 
 * This script will:
 * 1. Check if Firebase is properly configured
 * 2. Fetch current site settings from Firestore
 * 3. Display the settings (contact phone, social links)
 */

const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
  console.log('✅ Firebase Admin initialized successfully\n');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
  process.exit(1);
}

const db = admin.firestore();

async function testSettings() {
  try {
    console.log('📋 Fetching site settings from Firestore...\n');
    
    // Fetch settings
    const settingsDoc = await db.collection('settings').doc('main').get();
    
    if (!settingsDoc.exists) {
      console.log('⚠️  No settings document found. Creating default settings...\n');
      
      // Create default settings
      const defaultSettings = {
        homeHeroText: '',
        contactPhone: '',
        socialLinks: {
          facebook: '',
          instagram: '',
          twitter: '',
          youtube: '',
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      await db.collection('settings').doc('main').set(defaultSettings);
      console.log('✅ Default settings created successfully\n');
      
      // Fetch again
      const newDoc = await db.collection('settings').doc('main').get();
      displaySettings(newDoc.data());
    } else {
      console.log('✅ Settings document found\n');
      displaySettings(settingsDoc.data());
    }
    
    console.log('\n✅ Test completed successfully!');
    console.log('\n📝 Note: You can now update these settings in the admin dashboard.');
    console.log('   Navigate to: http://localhost:3000/dashboard/settings\n');
    
  } catch (error) {
    console.error('❌ Error testing settings:', error);
    process.exit(1);
  }
}

function displaySettings(settings) {
  console.log('=================================');
  console.log('📱 CURRENT SITE SETTINGS');
  console.log('=================================\n');
  
  console.log('📞 Contact Information:');
  console.log(`   Phone: ${settings.contactPhone || '(not set)'}\n`);
  
  console.log('🌐 Social Media Links:');
  console.log(`   Facebook:  ${settings.socialLinks?.facebook || '(not set)'}`);
  console.log(`   Instagram: ${settings.socialLinks?.instagram || '(not set)'}`);
  console.log(`   Twitter:   ${settings.socialLinks?.twitter || '(not set)'}`);
  console.log(`   YouTube:   ${settings.socialLinks?.youtube || '(not set)'}\n`);
  
  console.log('✏️  Home Hero Text:');
  console.log(`   ${settings.homeHeroText || '(not set)'}\n`);
  
  if (settings.updatedAt) {
    console.log(`🕐 Last Updated: ${settings.updatedAt.toDate?.() || settings.updatedAt}`);
  }
  console.log('=================================\n');
}

// Run the test
testSettings()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });

