import { YougeClient } from './src/youge-client.js';

const config = {
    yougeAppToken: 'b040416d8bcdc4dbb02b11d31dc0054e',
    yougeAppCode: 'apbhhitm6xica7akck',
    yougeSchemaCode: 'smhdzccpti8vrlyzj0',
    yougeEngineCode: 'c00000000000s4-0',
    yougeBaseUrl: 'https://sanyu.cloud'
};

async function checkYougeStatus() {
    const youge = new YougeClient(
        config.yougeAppToken,
        config.yougeAppCode,
        config.yougeSchemaCode,
        config.yougeEngineCode,
        config.yougeBaseUrl
    );
    const orderNo = 'order_2JLzZsRqnt2bXsGtACRjTG';

    try {
        const url = `${config.yougeBaseUrl}/records/${config.yougeAppCode}/${config.yougeSchemaCode}`;
        console.log(`Fetching Youge Records from: ${url}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: youge.getHeaders(),
            body: JSON.stringify({ offset: 0, limit: 100, filters: [] })
        });
        const text = await response.text();
        console.log(`Raw Response: ${text}`);

        const data = JSON.parse(text);
        const records = data.data?.records || [];
        console.log(`Fetched ${records.length} records.`);
        if (records.length > 0) {
            console.log('--- Sample Record Keys ---');
            console.log(Object.keys(records[0]));
            console.log('--- All Orders Found ---');
            records.forEach(r => {
                console.log(`ID: ${r[youge.FIELDS.ORDER_ID]} | Status: ${r[youge.FIELDS.STATUS]}`);
            });
        }
    } catch (e) {
        console.error(`Error: ${e.message}`);
    }
}

checkYougeStatus();
