#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Setting up SafeRoute AI with Convex...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env.local file...');
  const envContent = `# Convex Configuration
VITE_CONVEX_URL=your_convex_url_here

# Backend Configuration (optional)
VITE_BACKEND_URL=http://localhost:5000

# Google OAuth (optional - only if you want Google sign-in)
# GOOGLE_CLIENT_ID=your_google_client_id_here
`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.local file');
} else {
  console.log('✅ .env.local already exists');
}

console.log('\n📋 Next steps:');
console.log('1. Run: npx convex dev');
console.log('2. Copy the Convex URL from the output and update VITE_CONVEX_URL in .env.local');
console.log('3. (Optional) Set up Google OAuth for Google sign-in');
console.log('4. Run: npm run dev');
console.log('\n🎉 You\'re all set!');
