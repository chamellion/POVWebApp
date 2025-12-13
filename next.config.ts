import type { NextConfig } from "next";

// Build-time environment validation
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

function validateFirebaseEnvVars() {
  console.log('🔍 Validating Firebase environment variables...');
  
  const missing: string[] = [];
  const present: string[] = [];
  
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

// Run validation before config is exported
validateFirebaseEnvVars();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/v0/b/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'static.vecteezy.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
