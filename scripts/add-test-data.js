const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc, 
  Timestamp 
} = require('firebase/firestore');

// Your Firebase config - replace with your actual config
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addTestData() {
  try {
    console.log('Adding test data...');

    // Add recurring events
    const recurringEvents = [
      {
        title: 'Sunday Service',
        description: 'Join us for our weekly Sunday worship service. We gather to praise, pray, and hear God\'s word together.',
        location: 'Main Sanctuary',
        dayOfWeek: 0, // Sunday
        startTime: '09:30',
        endTime: '11:00',
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      {
        title: 'Wednesday Bible Study',
        description: 'Midweek Bible study and prayer meeting. Deep dive into God\'s word and intercessory prayer.',
        location: 'Fellowship Hall',
        dayOfWeek: 3, // Wednesday
        startTime: '19:00',
        endTime: '20:30',
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      {
        title: 'Friday Prayer Meeting',
        description: 'Friday evening prayer meeting. Come and join us in corporate prayer and intercession.',
        location: 'Prayer Room',
        dayOfWeek: 5, // Friday
        startTime: '18:00',
        endTime: '19:30',
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      {
        title: 'Youth Group',
        description: 'Weekly youth group meeting for teenagers. Fun activities, Bible study, and fellowship.',
        location: 'Youth Center',
        dayOfWeek: 6, // Saturday
        startTime: '16:00',
        endTime: '18:00',
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }
    ];

    console.log('Adding recurring events...');
    for (const event of recurringEvents) {
      const docRef = await addDoc(collection(db, 'recurringEvents'), event);
      console.log(`Added recurring event: ${event.title} with ID: ${docRef.id}`);
    }

    // Add newsletter signups
    const newsletterSignups = [
      {
        email: 'john.doe@example.com',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), // 7 days ago
      },
      {
        email: 'jane.smith@example.com',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)), // 5 days ago
      },
      {
        email: 'mike.johnson@example.com',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)), // 3 days ago
      },
      {
        email: 'sarah.wilson@example.com',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)), // 1 day ago
      },
      {
        email: 'david.brown@example.com',
        createdAt: Timestamp.now(), // Today
      }
    ];

    console.log('Adding newsletter signups...');
    for (const signup of newsletterSignups) {
      const docRef = await addDoc(collection(db, 'newsletterSignups'), signup);
      console.log(`Added newsletter signup: ${signup.email} with ID: ${docRef.id}`);
    }

    console.log('Test data added successfully!');
    console.log(`Added ${recurringEvents.length} recurring events`);
    console.log(`Added ${newsletterSignups.length} newsletter signups`);

  } catch (error) {
    console.error('Error adding test data:', error);
  }
}

// Run the script
addTestData();
