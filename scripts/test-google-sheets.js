#!/usr/bin/env node

/**
 * Test script for Google Sheets integration
 * Run with: node scripts/test-google-sheets.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

async function testGoogleSheets() {
  console.log('🧪 Testing Google Sheets Integration...\n');

  // Check environment variables
  const requiredVars = [
    'GOOGLE_CLIENT_EMAIL',
    'GOOGLE_PRIVATE_KEY',
    'LEADS_SHEET_CHATBOT_ID',
    'LEADS_SHEET_VOICEBOT_ID',
    'LEADS_SHEET_CAREER_ID',
    'LEADS_SHEET_FOOTER_ID',
    'LEADS_SHEET_CONTACT_ID'
  ];

  console.log('📋 Environment Variables Check:');
  let allVarsPresent = true;
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      if (varName.includes('KEY')) {
        console.log(`✅ ${varName}: [SET] (${value.length} characters)`);
      } else if (varName.includes('SHEET')) {
        console.log(`✅ ${varName}: ${value}`);
      } else {
        console.log(`✅ ${varName}: ${value}`);
      }
    } else {
      console.log(`❌ ${varName}: [MISSING]`);
      allVarsPresent = false;
    }
  }

  if (!allVarsPresent) {
    console.log('\n❌ Some required environment variables are missing!');
    console.log('Please check your .env.local file and the setup guide.');
    return;
  }

  console.log('\n✅ All environment variables are present!');

  // Test Google Sheets API directly
  console.log('\n🔐 Testing Google Sheets API Authentication...');
  
  try {
    const { google } = require('googleapis');
    
    // Test authentication
    const auth = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      undefined,
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    console.log('✅ Service account authentication successful');
    
    // Test with a sample sheet
    const sheets = google.sheets({ version: 'v4', auth });
    const testSheetId = process.env.LEADS_SHEET_CHATBOT_ID;
    
    console.log(`\n📊 Testing access to Chatbot sheet (${testSheetId})...`);
    
    const response = await sheets.spreadsheets.get({
      spreadsheetId: testSheetId,
      includeGridData: false,
    });
    
    console.log(`✅ Successfully accessed sheet: "${response.data.properties.title}"`);
    console.log(`✅ Last modified: ${response.data.properties.updated}`);
    
  } catch (error) {
    console.log(`❌ Google Sheets API Error: ${error.message}`);
    
    if (error.message.includes('Method doesn\'t allow unregistered callers')) {
      console.log('\n🔍 This error typically means:');
      console.log('1. The Google Sheets API is not enabled in your project');
      console.log('2. The service account doesn\'t have access to the sheets');
      console.log('3. The sheets are not shared with the service account email');
    }
    
    return;
  }

  // Test API endpoints
  console.log('\n🌐 Testing API Endpoints...');
  
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://your-domain.com' 
    : 'http://localhost:9002';

  const endpoints = [
    '/api/leads-sheets?sheetKey=chatbot',
    '/api/leads-sheets?sheetKey=voicebot',
    '/api/leads-sheets?sheetKey=career',
    '/api/leads-sheets?sheetKey=footer',
    '/api/leads-sheets?sheetKey=contact'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`);
      if (response.ok) {
        console.log(`✅ ${endpoint}: OK (${response.status})`);
      } else {
        console.log(`❌ ${endpoint}: Error (${response.status})`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: Network Error - ${error.message}`);
    }
  }

  console.log('\n📝 Next Steps:');
  console.log('1. Make sure your Next.js app is running (npm run dev)');
  console.log('2. Navigate to /admin/dashboard/lead-generation');
  console.log('3. Check browser console for any errors');
  console.log('4. Verify Google Sheets are shared with your service account');
  console.log('5. Test creating/editing data in the spreadsheet');

  console.log('\n🔗 Useful Links:');
  console.log('- Google Cloud Console: https://console.cloud.google.com/');
  console.log('- Google Sheets API: https://developers.google.com/sheets/api');
  console.log('- Luckysheet Documentation: https://mengshukeji.github.io/LuckysheetDocs/');
}

// Run the test
testGoogleSheets().catch(console.error);
