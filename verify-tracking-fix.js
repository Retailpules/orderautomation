import { GigaClient } from './src/giga-client.js';

const config = {
    clientId: '83142311_JPN_release',
    clientSecret: '995ade0b4e544a7aac92902c97a2e0bf',
    baseUrl: 'https://openapi.gigab2b.com'
};

async function verify() {
    console.log('--- Verifying GIGA Tracking API ---');
    const giga = new GigaClient(config.clientId, config.clientSecret, config.baseUrl);

    // Use a known order number or a test one
    const orderNos = ['DSR202507241513'];

    try {
        console.log(`Querying tracking for: ${orderNos}`);
        const res = await giga.getTrackingInfo(orderNos);
        console.log('Response Success:', res.success);
        console.log('Response Code:', res.code);
        console.log('Data:', JSON.stringify(res.data, null, 2));

        if (res.success && res.data) {
            console.log('✅ API call successful!');
        } else {
            console.log('❌ API call failed or returned no data.');
        }
    } catch (e) {
        console.error('❌ Verification Error:', e.message);
    }
}

verify();
