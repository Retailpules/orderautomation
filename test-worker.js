import { GigaClient } from './src/giga-client.js';
import { YougeClient } from './src/youge-client.js';

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        if (url.pathname === '/test-multi-sku') {
            return await testMultiSkuOrder(env);
        }

        if (url.pathname === '/sync-poc-data') {
            return await syncPocData(env);
        }

        return new Response('Test endpoints: /test-multi-sku, /discover-fields, /sync-poc-data');
    }
};

async function syncPocData(env) {
    const giga = new GigaClient(
        env.GIGA_CLIENT_ID,
        env.GIGA_CLIENT_SECRET,
        env.GIGA_API_BASE_URL
    );

    // Simulated data from the User's Data Table
    const simulatedYougeRecords = [
        {
            orderNo: 'order_2JLzLoGcA7XLi4yHh3FAjg-TEST',
            sku: 'WF294205BAA',
            qty: 1,
            orderDetailNo: 1,
            itemPrice: 100, // Placeholder as not provided in table
            shipName: '小島 紀子',
            shipPhone: '090-2923-3965',
            shipAddress1: '青木町3-2,207',
            shipCity: '多治見市',
            shipState: '岐阜県',
            shipCountry: 'JP',
            shipZipCode: '507-0837',
            salesChannel: 'Mercari'
        },
        {
            orderNo: 'order_2JLzLoGcA7XLi4yHh3FAjg-TEST',
            sku: 'PP298910OAA',
            qty: 1,
            orderDetailNo: 2,
            itemPrice: 100, // Placeholder
            shipName: '小島 紀子',
            shipPhone: '090-2923-3965',
            shipAddress1: '青木町3-2,207',
            shipCity: '多治見市',
            shipState: '岐阜県',
            shipCountry: 'JP',
            shipZipCode: '507-0837',
            salesChannel: 'Mercari'
        }
    ];

    // Consolidation Logic (same as production)
    const ordersMap = {};
    for (const rec of simulatedYougeRecords) {
        if (!ordersMap[rec.orderNo]) {
            ordersMap[rec.orderNo] = { header: rec, lines: [] };
        }
        ordersMap[rec.orderNo].lines.push({
            sku: rec.sku,
            qty: rec.qty,
            orderDetailNo: rec.orderDetailNo,
            itemPrice: rec.itemPrice,
            currency: 'JPY'
        });
    }

    const results = [];
    for (const orderNo of Object.keys(ordersMap)) {
        const order = ordersMap[orderNo];
        const h = order.header;

        // Append timestamp to orderNo for testing uniqueness
        const uniqueOrderNo = `${orderNo}-POC-${Date.now()}`;

        const payload = {
            orderNo: uniqueOrderNo,
            orderDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
            shipName: h.shipName,
            shipPhone: h.shipPhone,
            shipAddress1: h.shipAddress1,
            shipCity: h.shipCity,
            shipState: h.shipState,
            shipCountry: h.shipCountry,
            shipZipCode: h.shipZipCode,
            salesChannel: h.salesChannel,
            orderLines: order.lines,
            hasOtherLabel: "false"
        };

        try {
            const apiResult = await giga.createOrder(payload);
            results.push({ orderNo: uniqueOrderNo, status: 'SUCCESS', response: apiResult });
        } catch (e) {
            results.push({ orderNo: uniqueOrderNo, status: 'FAILED', error: e.message });
        }
    }

    return new Response(JSON.stringify(results, null, 2), {
        headers: { 'Content-Type': 'application/json' }
    });
}


async function discoverFields(env) {
    const youge = new YougeClient(
        env.YOUGE_APP_TOKEN,
        env.YOUGE_APP_CODE,
        env.YOUGE_SCHEMA_CODE,
        env.YOUGE_ENGINE_CODE,
        env.YOUGE_BASE_URL
    );

    try {
        const fetchUrl = `${env.YOUGE_BASE_URL}/openapi/records/${env.YOUGE_APP_CODE}/${env.YOUGE_SCHEMA_CODE}`;
        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: youge.getHeaders(),
            body: JSON.stringify({ offset: 0, limit: 10 })
        });

        if (!response.ok) {
            return new Response(`Youge API Error: ${response.status} ${response.statusText}`, { status: response.status });
        }

        const data = await response.json();
        const records = data.data?.records || [];

        return new Response(JSON.stringify({
            message: `Found ${records.length} records in Youge.`,
            records: records
        }, null, 2), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}


async function testMultiSkuOrder(env) {
    const results = {
        timestamp: new Date().toISOString(),
        tests: []
    };

    try {
        const giga = new GigaClient(
            env.GIGA_CLIENT_ID,
            env.GIGA_CLIENT_SECRET,
            env.GIGA_API_BASE_URL
        );

        // Use the data provided by the user
        const testOrder = {
            orderNo: `order_2JLzLoGcA7XLi4yHh3FAjg-TEST-${Date.now()}`,
            orderDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
            shipName: '小島 紀子',
            shipPhone: '090-2923-3965',
            shipAddress1: '青木町3-2,207',
            shipCity: '多治見市',
            shipState: '岐阜県',
            shipCountry: 'JP',
            shipZipCode: '507-0837',
            salesChannel: 'Mercari',
            hasOtherLabel: 'false',
            orderLines: [
                {
                    sku: 'WF294205BAA',
                    qty: 1,
                    orderDetailNo: 1,
                    itemPrice: 100,
                    currency: 'JPY'
                },
                {
                    sku: 'PP298910OAA',
                    qty: 1,
                    orderDetailNo: 2,
                    itemPrice: 100,
                    currency: 'JPY'
                }
            ]
        };

        console.log('Sending Multi-SKU Test Order:', JSON.stringify(testOrder, null, 2));

        try {
            const apiResult = await giga.createOrder(testOrder);

            results.tests.push({
                name: 'Multi-SKU Order Creation',
                status: 'PASS',
                details: {
                    orderNo: testOrder.orderNo,
                    response: apiResult
                }
            });

            console.log('✅ Multi-SKU order creation successful');

        } catch (error) {
            let apiResponse = null;
            if (error.apiResponse) {
                apiResponse = error.apiResponse;
            }

            results.tests.push({
                name: 'Multi-SKU Order Creation',
                status: 'FAIL',
                error: error.message,
                details: {
                    orderNo: testOrder.orderNo,
                    errorType: error.constructor.name,
                    apiResponse: apiResponse
                }
            });

            console.error('❌ Multi-SKU order creation failed:', error.message);
            console.error('API Response Detail:', JSON.stringify(apiResponse, null, 2));
        }

    } catch (error) {
        results.tests.push({
            name: 'Initial Setup',
            status: 'ERROR',
            error: error.message
        });
    }

    return new Response(JSON.stringify(results, null, 2), {
        headers: { 'Content-Type': 'application/json' }
    });
}
