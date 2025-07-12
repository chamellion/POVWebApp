#!/usr/bin/env node

/**
 * Build-time environment variable validation for Firebase
 * This script runs before the build to ensure all required Firebase env vars are present
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

function validateFirebaseEnvVars() {
  console.log('🔍 Validating Firebase environment variables...');
  
  const missing = [];
  const present = [];
  
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      missing.push(varName);
    } else {
      present.push(varName);
      console.log(`✅ ${varName}: Present`);
    }
  });
  
  if (missing.length > 0) {
    console.error('\n❌ Missing required Firebase environment variables:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    console.error('\n📝 Please add these to your .env.local file');
    console.error('💡 You can copy from env.template to .env.local');
    console.error('\nExample:');
    console.error('   cp env.template .env.local');
    console.error('\nBuild failed due to missing environment variables.');
    process.exit(1);
  }
  
  console.log(`\n✅ All ${present.length} required Firebase environment variables are present`);
  console.log('🚀 Firebase configuration is ready for build');
}

// Run validation
validateFirebaseEnvVars(); 