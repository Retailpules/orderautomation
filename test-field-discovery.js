/**
 * Field Discovery Test Worker
 * Fetches real records from Youge to identify F-codes for LineItemNumber and ItemPrice
 */

import { YougeClient } from './src/youge-client.js';

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        if (url.pathname === '/discover-fields') {
            return await discoverFields(env);
        }

        return new Response('Test endpoints: /discover-fields');
    }
};

async function discoverFields(env) {
    const youge = new YougeClient(
        env.YOUGE_APP_TOKEN,
        env.YOUGE_APP_CODE,
        env.YOUGE_SCHEMA_CODE,
        env.YOUGE_ENGINE_CODE,
        env.YOUGE_BASE_URL
    );

    try {
        // Fetch raw records directly to see all keys
        const fetchUrl = `${env.YOUGE_BASE_URL}/openapi/records/${env.YOUGE_APP_CODE}/${env.YOUGE_SCHEMA_CODE}`;
        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: youge.getHeaders(),
            body: JSON.stringify({ offset: 0, limit: 1 })
        });

        if (!response.ok) {
            return new Response(`Youge API Error: ${response.statusText}`, { status: response.status });
        }

        const data = await response.json();
        const records = data.data?.records || [];

        if (records.length === 0) {
            return new Response(JSON.stringify({ message: "No records found in Youge to discover fields." }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            message: "Successfully fetched sample record for field discovery",
            sampleRecord: records[0]
        }, null, 2), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
