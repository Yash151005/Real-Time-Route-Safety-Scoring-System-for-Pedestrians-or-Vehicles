#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient(process.env.VITE_CONVEX_URL);

async function testCreateUserProfile() {
  console.log('🧪 Testing Convex createUserProfile function...\n');
  
  try {
    // Test data
    const testProfile = {
      fullName: "Test User",
      email: "test@example.com",
      gender: "prefer_not_to_say",
      age: 25,
      modeOfTransport: "car",
      emergencyContact: "+1234567890",
      preferences: {
        avoidDarkAreas: true,
        preferWellLitRoutes: true,
        avoidHighCrimeAreas: true,
        preferMainRoads: false,
      }
    };
    
    console.log('📝 Test data:', testProfile);
    console.log('\n⏳ Calling createUserProfile...');
    
    // Note: This will fail without authentication, but it tests if the function exists
    const result = await client.mutation("userProfiles:createUserProfile", testProfile);
    
    console.log('✅ Function call successful!');
    console.log('📊 Result:', result);
    
  } catch (error) {
    if (error.message?.includes('Not authenticated')) {
      console.log('✅ Function exists and is properly protected!');
      console.log('🔒 Authentication required (expected behavior)');
    } else if (error.message?.includes('Could not find public function')) {
      console.log('❌ Function not found!');
      console.log('🔧 Make sure to run: npx convex dev');
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }
}

// Run the test
testCreateUserProfile();

