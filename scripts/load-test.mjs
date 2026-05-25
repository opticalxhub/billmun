/**
 * NXTMUN Load Testing Script
 * Simulates 300 concurrent users accessing the Delegate Dashboard.
 * Run with: node scripts/load-test.mjs
 */

import fetch from 'node-fetch';

const TARGET_URL = 'https://portal.nxtmun.com/api/delegate/dashboard';
const CONCURRENT_USERS = 500;
const DURATION_SECONDS = 30;

async function simulateUser(id) {
  const startTime = Date.now();
  try {
    const response = await fetch(`${TARGET_URL}?userId=test-user-${id}`, {
      headers: {
        'Cookie': 'sb-access-token=mock-token; sb-refresh-token=mock-token'
      }
    });
    const latency = Date.now() - startTime;
    return { success: response.status === 200 || response.status === 401, latency };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function runLoadTest() {
  console.log(`Starting load test: ${CONCURRENT_USERS} concurrent users for ${DURATION_SECONDS}s...`);
  
  const results = [];
  const start = Date.now();
  
  while (Date.now() - start < DURATION_SECONDS * 1000) {
    const batch = Array.from({ length: CONCURRENT_USERS }, (_, i) => simulateUser(i));
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
    // Wait 1s between batches to simulate real usage patterns
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const latencies = successful.map(r => r.latency);
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;

  console.log('\n--- Load Test Results ---');
  console.log(`Total Requests: ${results.length}`);
  console.log(`Success Rate: ${((successful.length / results.length) * 100).toFixed(2)}%`);
  console.log(`Average Latency: ${avgLatency.toFixed(2)}ms`);
  console.log(`Max Latency: ${Math.max(...latencies)}ms`);
  console.log(`Total Failures: ${failed.length}`);
  
  if (failed.length > 0) {
    console.log('Sample Error:', failed[0].error);
  }
}

runLoadTest().catch(console.error);
