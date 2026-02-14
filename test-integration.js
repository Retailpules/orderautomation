/**
 * Test Script for GIGA Order Sync
 * This script tests the integration with both Youge and GigaB2B APIs
 */

import { GigaClient } from './src/giga-client.js';
import { YougeClient } from './src/youge-client.js';

// Test configuration (replace with actual values)
const config = {
    // GigaB2B
    gigaClientId: '83142311_JPN_release',
    gigaClientSecret: '995ade0b4e544a7aac92902c97a2e0bf',
    gigaBaseUrl: 'https://api.gigacloudlogistics.com',

    // Youge
    yougeAppToken: process.env.YOUGE_APP_TOKEN || 'YOUR_TOKEN_HERE',
    yougeAppCode: 'apbhhitm6xica7akck',
    yougeSchemaCode: 'smhdzccpti8vrlyzj0',
    yougeEngineCode: 'c00000000000s4-0',
    yougeBaseUrl: 'https://sanyu.cloud'
};

async function testYougeConnection() {
    console.log('\n=== Testing Youge Connection ===');

    const youge = new YougeClient(
        config.yougeAppToken,
        config.yougeAppCode,
        config.yougeSchemaCode,
        config.yougeEngineCode,
        config.yougeBaseUrl
    );

    try {
        const orders = await youge.getPendingOrders();
        console.log(`✅ Successfully fetched ${orders.length} pending orders from Youge`);

        if (orders.length > 0) {
            console.log('\nSample Order Data:');
            console.log(JSON.stringify(orders[0], null, 2));
        } else {
            console.log('ℹ️  No pending orders found. This is expected if all orders are processed.');
        }

        return orders;
    } catch (error) {
        console.error('❌ Youge API Error:', error.message);
        throw error;
    }
}

async function testGigaSignature() {
    console.log('\n=== Testing GIGA Signature Generation ===');

    const giga = new GigaClient(
        config.gigaClientId,
        config.gigaClientSecret,
        config.gigaBaseUrl
    );

    const timestamp = Date.now().toString();
    const nonce = '1234567890';
    const apiPath = '/b2b-overseas-api/v1/buyer/order/dropShip-sync/v1';

    try {
        const signature = await giga.generateSignature(timestamp, nonce, apiPath);

        console.log('Signature Parameters:');
        console.log(`  Client ID: ${config.gigaClientId}`);
        console.log(`  Timestamp: ${timestamp}`);
        console.log(`  Nonce: ${nonce}`);
        console.log(`  API Path: ${apiPath}`);
        console.log(`  Generated Signature: ${signature}`);
        console.log('✅ Signature generated successfully');

        return { timestamp, nonce, signature };
    } catch (error) {
        console.error('❌ Signature Generation Error:', error.message);
        throw error;
    }
}

async function testGigaOrderCreation(testOrder = null) {
    console.log('\n=== Testing GIGA Order Creation ===');

    const giga = new GigaClient(
        config.gigaClientId,
        config.gigaClientSecret,
        config.gigaBaseUrl
    );

    // Use provided test order or create a sample one
    const orderPayload = testOrder || {
        orderNo: `TEST-${Date.now()}`,
        orderDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
        shipName: 'John Doe',
        shipPhone: '+1-555-0123',
        shipAddress1: '123 Test Street',
        shipCity: 'Los Angeles',
        shipState: 'CA',
        shipCountry: 'US',
        shipZipCode: '90001',
        salesChannel: 'Test',
        hasOtherLabel: 'false',
        orderLines: [
            {
                sku: 'TEST-SKU-001',
                qty: 1
            }
        ]
    };

    console.log('Test Order Payload:');
    console.log(JSON.stringify(orderPayload, null, 2));

    try {
        const result = await giga.createOrder(orderPayload);
        console.log('✅ Order created successfully!');
        console.log('API Response:');
        console.log(JSON.stringify(result, null, 2));
        return result;
    } catch (error) {
        console.error('❌ GIGA API Error:', error.message);
        console.error('Full Error:', error);

        // Log additional details if available
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', await error.response.text());
        }

        throw error;
    }
}

async function runFullTest() {
    console.log('╔════════════════════════════════════════════╗');
    console.log('║  GIGA Order Sync - Integration Test       ║');
    console.log('╚════════════════════════════════════════════╝');

    const results = {
        yougeConnection: false,
        gigaSignature: false,
        gigaOrderCreation: false,
        errors: []
    };

    // Test 1: Youge Connection
    try {
        const orders = await testYougeConnection();
        results.yougeConnection = true;
        results.yougeOrders = orders;
    } catch (error) {
        results.errors.push({ test: 'Youge Connection', error: error.message });
    }

    // Test 2: GIGA Signature
    try {
        await testGigaSignature();
        results.gigaSignature = true;
    } catch (error) {
        results.errors.push({ test: 'GIGA Signature', error: error.message });
    }

    // Test 3: GIGA Order Creation
    try {
        const orderResult = await testGigaOrderCreation();
        results.gigaOrderCreation = true;
        results.gigaResponse = orderResult;
    } catch (error) {
        results.errors.push({ test: 'GIGA Order Creation', error: error.message });
    }

    // Summary
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║  Test Summary                              ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log(`Youge Connection:      ${results.yougeConnection ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`GIGA Signature:        ${results.gigaSignature ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`GIGA Order Creation:   ${results.gigaOrderCreation ? '✅ PASS' : '❌ FAIL'}`);

    if (results.errors.length > 0) {
        console.log('\n⚠️  Errors Encountered:');
        results.errors.forEach((err, idx) => {
            console.log(`  ${idx + 1}. ${err.test}: ${err.error}`);
        });
    }

    return results;
}

// Run the test
runFullTest()
    .then(results => {
        console.log('\n✅ Test completed');
        process.exit(results.errors.length > 0 ? 1 : 0);
    })
    .catch(error => {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    });
