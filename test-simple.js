/**
 * Simple HTTP Test Script for GIGA Order Sync
 * Tests the deployed worker endpoint
 */

const testEndpoint = 'https://giga-shipment-sync-worker.jim-yang-3c5.workers.dev/sync';

console.log('╔════════════════════════════════════════════╗');
console.log('║  GIGA Order Sync - HTTP Test              ║');
console.log('╚════════════════════════════════════════════╝\n');

console.log(`Testing endpoint: ${testEndpoint}\n`);

fetch(testEndpoint)
    .then(response => {
        console.log(`Status: ${response.status} ${response.statusText}`);
        return response.json();
    })
    .then(data => {
        console.log('\nResponse Data:');
        console.log(JSON.stringify(data, null, 2));

        if (data.message === 'No pending orders.') {
            console.log('\n✅ Worker is functioning correctly');
            console.log('ℹ️  No pending orders found in Youge');
            console.log('\nNext Steps:');
            console.log('1. Create a test order in Youge with status "Pending"');
            console.log('2. Re-run this test to verify order processing');
        } else if (data.success !== undefined) {
            console.log(`\n✅ Processed ${data.success} orders successfully`);
            if (data.failed > 0) {
                console.log(`⚠️  ${data.failed} orders failed`);
                console.log('Errors:', data.errors);
            }
        }
    })
    .catch(error => {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    });
