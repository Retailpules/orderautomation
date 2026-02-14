import { YougeClient } from './src/youge-client.js';
import dotenv from 'dotenv';
dotenv.config();

async function debug() {
    const youge = new YougeClient(
        process.env.YOUGE_APP_TOKEN,
        process.env.YOUGE_APP_CODE,
        process.env.YOUGE_SCHEMA_CODE,
        process.env.YOUGE_ENGINE_CODE,
        process.env.YOUGE_BASE_URL
    );

    console.log(`Testing Youge with:`);
    console.log(`  URL: ${youge.baseUrl}`);
    console.log(`  App: ${youge.appCode}`);
    console.log(`  Schema: ${youge.schemaCode}`);

    try {
        const records = await youge.getRawRecords();
        console.log(`SUCCESS: Found ${records.length} records.`);
    } catch (e) {
        console.error(`FAILURE: ${e.message}`);
    }
}

debug();
