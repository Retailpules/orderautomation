import { GigaClient } from './src/giga-client.js';

const config = {
    clientId: '83142311_JPN_release',
    clientSecret: '995ade0b4e544a7aac92902c97a2e0bf',
    baseUrl: 'https://openapi.gigab2b.com'
};

async function checkOrder() {
    const giga = new GigaClient(config.clientId, config.clientSecret, config.baseUrl);
    const orderNo = 'order_2JLzZsRqnt2bXsGtACRjTG';

    console.log(`Checking tracking info for: ${orderNo}`);
    try {
        const response = await giga.getTrackingInfo([orderNo]);
        console.log(JSON.stringify(response, null, 2));
    } catch (e) {
        console.error(`Error: ${e.message}`);
    }
}

checkOrder();
