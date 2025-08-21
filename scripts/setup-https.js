#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔒 Setting up HTTPS for high accuracy GPS...\n');

// Check if ngrok is installed
try {
    execSync('ngrok version', { stdio: 'ignore' });
    console.log('✅ ngrok is already installed');
} catch (error) {
    console.log('📦 Installing ngrok...');
    try {
        execSync('npm install -g ngrok', { stdio: 'inherit' });
        console.log('✅ ngrok installed successfully');
    } catch (installError) {
        console.error('❌ Failed to install ngrok. Please install manually:');
        console.error('   npm install -g ngrok');
        process.exit(1);
    }
}

// Check if Next.js app is running
try {
    execSync('curl -s http://localhost:9002 > /dev/null', { stdio: 'ignore' });
    console.log('✅ Next.js app is running on port 9002');
} catch (error) {
    console.log('⚠️  Next.js app is not running on port 9002');
    console.log('   Please start your app with: npm run dev');
    console.log('   Then run this script again');
    process.exit(1);
}

// Start ngrok tunnel
console.log('\n🌐 Starting HTTPS tunnel with ngrok...');
console.log('   This will provide an HTTPS URL for high accuracy GPS');
console.log('   Press Ctrl+C to stop the tunnel\n');

try {
    execSync('ngrok http 9002', { stdio: 'inherit' });
} catch (error) {
    console.log('\n✅ ngrok tunnel stopped');
}
