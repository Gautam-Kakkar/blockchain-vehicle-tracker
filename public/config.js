// ============================================================================
// CONFIGURATION - Add your Pinata JWT here
// ============================================================================

// IMPORTANT: Replace YOUR_PINATA_JWT_TOKEN with your actual JWT from Pinata
// Get it from: https://app.pinata.cloud/keys
const PINATA_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIwODBiYjAzMi1lODAxLTRjMzUtOGQ1Zi0xNTk5NmQwOTA3MTciLCJlbWFpbCI6ImdhdXRhbTI4MjFrYWtrYXJAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImQxZTdmZTIwY2M4YjU1MWQzNzkwIiwic2NvcGVkS2V5U2VjcmV0IjoiMTEwMmYxNzViNTc2YmI5YjIwMmZhZGY3Njg1N2UxZTBiZmE4ZmU0MDRjMTMwYzE5MjIxY2FkZjA2ZjBmMDJlMCIsImV4cCI6MTgwMDk4MzU2NX0.CZiL8OZ1IHgwkfwOddoLV7Lad1md_ouEXzhcXV52iSU';

// Make available globally for IPFS utility
window.PINATA_JWT = PINATA_JWT;

// Log configuration status
if (PINATA_JWT === 'YOUR_PINATA_JWT_TOKEN' || !PINATA_JWT) {
    console.warn('⚠️ Pinata JWT not configured!');
    console.warn('Please edit public/config.js and add your Pinata JWT token');
    console.warn('Get your JWT from: https://app.pinata.cloud/keys');
} else {
    console.log('✅ Pinata JWT configured successfully');
}
