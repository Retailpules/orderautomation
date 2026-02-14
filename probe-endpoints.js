import { GigaClient } from './src/giga-client.js';

const config = {
    clientId: '83142311_JPN_release',
    clientSecret: '995ade0b4e544a7aac92902c97a2e0bf',
    baseUrl: 'https://openapi.gigab2b.com'
};

async function probe() {
    const giga = new GigaClient(config.clientId, config.clientSecret, config.baseUrl);
    const endpoints = [
        '/b2b-overseas-api/v1/buyer/order/order-details/v1',
        '/b2b-overseas-api/v1/buyer/order/order-detail/v1',
        '/b2b-overseas-api/v1/buyer/order/details/v1',
        '/b2b-overseas-api/v1/buyer/order/detail/v1',
        '/b2b-overseas-api/v1/buyer/order/query/v1'
    ];

    for (const path of endpoints) {
        console.log(`Probing: ${path}...`);
        try {
            await giga._request('GET', path, null, `${config.baseUrl}${path}?orderNo=PROBE-123`);
            console.log(`  ✅ FOUND PATH: ${path}`);
            return;
        } catch (e) {
            if (e.message.includes('404')) {
                console.log(`  ❌ 404 Not Found`);
            } else {
                console.log(`  🟡 PATH LIKELY EXISTS but returned error: ${e.message}`);
                return;
            }
        }
    }
}

probe();
