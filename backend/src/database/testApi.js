// Simple API tester using axios
// Run: node backend/testApi.js

const axios = require('axios');

const BASE_URL = 'http://localhost:3000'; // Change to your backend URL/port

async function testGet() {
  try {
    const res = await axios.get(`${BASE_URL}/your-endpoint`);
    console.log('GET /your-endpoint:', res.status, res.data);
  } catch (err) {
    console.error('GET /your-endpoint failed:', err.response?.status, err.response?.data);
  }
}

async function testPost() {
  try {
    const res = await axios.post(`${BASE_URL}/your-endpoint`, { key: 'value' });
    console.log('POST /your-endpoint:', res.status, res.data);
  } catch (err) {
    console.error('POST /your-endpoint failed:', err.response?.status, err.response?.data);
  }
}

async function runTests() {
  await testGet();
  await testPost();
}

runTests();
