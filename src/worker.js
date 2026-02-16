const CONSOLE_HTML = `
<!DOCTYPE html>
<html>
<head>
    <title>GIGA Sync Console</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: 'Inter', -apple-system, sans-serif; background: #f0f2f5; color: #1a1a1a; margin: 0; padding: 20px; }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
        h1 { margin: 0; color: #0056b3; font-size: 24px; }
        .badge { background: #e1f0ff; color: #0056b3; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .stat-card { background: #f8fafc; padding: 20px; border-radius: 10px; text-align: center; border: 1px solid #edf2f7; }
        .stat-value { font-size: 28px; font-weight: 800; color: #2d3748; margin-bottom: 5px; }
        .stat-label { font-size: 13px; color: #718096; text-transform: uppercase; letter-spacing: 0.5px; }
        .actions { display: flex; gap: 15px; flex-wrap: wrap; }
        .btn { padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; font-size: 14px; }
        .btn-primary { background: #0056b3; color: white; }
        .btn-primary:hover { background: #004494; transform: translateY(-1px); }
        .btn-success { background: #10b981; color: white; }
        .btn-success:hover { background: #059669; transform: translateY(-1px); }
        .btn:disabled { background: #cbd5e0; cursor: not-allowed; transform: none; }
        #results { margin-top: 40px; }
        pre { background: #1e293b; color: #e2e8f0; padding: 20px; border-radius: 8px; overflow-x: auto; font-size: 13px; line-height: 1.5; }
        .loading { display: inline-block; width: 20px; height: 20px; border: 3px solid rgba(255,255,255,.3); border-radius: 50%; border-top-color: #fff; animation: spin 1s ease-in-out infinite; margin-right: 10px; vertical-align: middle; }
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>GIGA Sync Console</h1>
            <span class="badge">V1.3</span>
        </header>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value" id="pending-count">-</div>
                <div class="stat-label">Pending / Error</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="processed-count">-</div>
                <div class="stat-label">Processed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="completed-count">-</div>
                <div class="stat-label">Completed</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" id="total-count">-</div>
              <div class="stat-label">Total Records</div>
            </div>
        </div>

        <div class="actions">
            <button id="btn-sync" class="btn btn-primary" onclick="triggerSync('/sync', 'btn-sync')">Trigger Order Sync</button>
            <button id="btn-shipment" class="btn btn-success" onclick="triggerSync('/sync-shipment', 'btn-shipment')">Trigger Status & Shipment Sync</button>
        </div>

        <div id="results" style="display:none">
            <h3 id="result-title">Execution Result</h3>
            <pre id="result-content"></pre>
        </div>
    </div>

    <script>
        async function fetchStatus() {
            try {
                const res = await fetch('/status');
                const data = await res.json();
                document.getElementById('pending-count').innerText = (data.pending || 0) + (data.error || 0);
                document.getElementById('processed-count').innerText = data.processed || 0;
                document.getElementById('completed-count').innerText = data.completed || 0;
                document.getElementById('total-count').innerText = data.total || 0;
            } catch (e) { console.error(e); }
        }

        async function triggerSync(endpoint, btnId) {
            const btn = document.getElementById(btnId);
            const originalText = btn.innerText;
            btn.disabled = true;
            btn.innerHTML = '<span class="loading"></span>' + originalText;
            
            const resultDiv = document.getElementById('results');
            const resultContent = document.getElementById('result-content');
            
            try {
                const res = await fetch(endpoint);
                const data = await res.json();
                resultDiv.style.display = 'block';
                resultContent.innerText = JSON.stringify(data, null, 2);
                await fetchStatus();
            } catch (e) {
                resultDiv.style.display = 'block';
                resultContent.innerText = 'Error: ' + e.message;
            } finally {
                btn.disabled = false;
                btn.innerText = originalText;
            }
        }

        fetchStatus();
    </script>
</body>
</html>
`;

/**
 * Validates an assembled order payload before submission to GigaB2B.
 * Returns an array of validation error strings. Empty array = valid.
 * (BRD FR-022, FR-023, FR-024)
 */
function validateOrder(payload) {
    const errors = [];

    if (!payload.orderNo || !payload.orderNo.trim()) {
        errors.push('orderNo is missing or empty');
    }
    if (!payload.shipName || !payload.shipName.trim()) {
        errors.push('shipName is missing or empty');
    }
    if (!payload.shipAddress1 || !payload.shipAddress1.trim()) {
        errors.push('shipAddress1 is missing or empty');
    }
    if (!payload.shipCity || !payload.shipCity.trim()) {
        errors.push('shipCity is missing or empty');
    }
    if (!payload.shipZipCode || !payload.shipZipCode.trim()) {
        errors.push('shipZipCode is missing or empty');
    }

    if (!payload.orderLines || payload.orderLines.length === 0) {
        errors.push('Order has no line items');
    } else {
        for (let i = 0; i < payload.orderLines.length; i++) {
            const line = payload.orderLines[i];
            const lineLabel = `orderLine[${i}]`;

            if (!line.sku || !line.sku.trim()) {
                errors.push(`${lineLabel}: sku is missing or empty`);
            }
            if (!line.qty || line.qty <= 0) {
                errors.push(`${lineLabel}: qty must be > 0 (got ${line.qty})`);
            }
            if (!line.itemPrice || line.itemPrice <= 0) {
                errors.push(`${lineLabel}: itemPrice must be > 0 (got ${line.itemPrice})`);
            }
        }
    }

    return errors;
}

async function processOrders(request, env) {
    const startTime = Date.now();
    const giga = new GigaClient(env.GIGA_CLIENT_ID, env.GIGA_CLIENT_SECRET, env.GIGA_API_BASE_URL);
    const youge = new YougeClient(env.YOUGE_APP_TOKEN, env.YOUGE_APP_CODE, env.YOUGE_SCHEMA_CODE, env.YOUGE_ENGINE_CODE, env.YOUGE_BASE_URL);

    const allRecords = await youge.getRawRecords();

    // Filter "Pending" and "Error" for auto-compensation (BRD 23.2)
    const normalizedPending = allRecords.map(r => youge._mapRecord(r));
    const pendingRecords = normalizedPending.filter(r => {
        const status = r.status;
        return status === 'Pending' || status === 'Error';
    });

    if (pendingRecords.length === 0) {
        return { success: 0, failed: 0, message: "No pending or error orders to process." };
    }

    // Constraint: Limit to 20 orders per run (BRD 21.1)
    const uniqueOrderNos = [...new Set(pendingRecords.map(r => r.orderNo))].slice(0, 20);
    const results = { success: 0, failed: 0, skipped: 0, errors: [], message: "" };

    // Grouping logic
    const ordersMap = {};
    for (const rec of pendingRecords) {
        if (!uniqueOrderNos.includes(rec.orderNo)) continue;

        if (!ordersMap[rec.orderNo]) {
            ordersMap[rec.orderNo] = { header: rec, lines: [], ids: [] };
        }
        ordersMap[rec.orderNo].lines.push({
            sku: rec.sku,
            qty: rec.qty,
            orderDetailNo: rec.orderDetailNo || (ordersMap[rec.orderNo].lines.length + 1),
            itemPrice: rec.itemPrice || null,
            currency: 'JPY'
        });
        ordersMap[rec.orderNo].ids.push(rec.id);
    }

    for (const orderNo of Object.keys(ordersMap)) {
        // Constraint: Check 25s limit (BRD 21.1)
        if (Date.now() - startTime > 25000) {
            results.message = "Partial execution. Stopped at 25s limit.";
            break;
        }

        const order = ordersMap[orderNo];
        const h = order.header;
        const payload = {
            orderNo: h.orderNo,
            orderDate: h.orderDate || new Date().toISOString().slice(0, 19).replace('T', ' '),
            shipName: h.shipName,
            shipPhone: h.shipPhone,
            shipAddress1: h.shipAddress1,
            shipCity: h.shipCity,
            shipState: h.shipState,
            shipCountry: h.shipCountry || 'JP',
            shipZipCode: h.shipZipCode,
            salesChannel: h.salesChannel || 'Mercari',
            shipFrom: h.shipFrom || 'Mercari Lifestyle',
            orderLines: order.lines,
            hasOtherLabel: "false"
        };

        // Pre-submission validation (BRD FR-022, FR-023, FR-024)
        const validationErrors = validateOrder(payload);
        if (validationErrors.length > 0) {
            const errorMsg = `Validation failed: ${validationErrors.join('; ')}`;
            console.warn(`Skipping order ${orderNo}: ${errorMsg}`);
            results.skipped++;
            results.errors.push(`${orderNo}: ${errorMsg}`);
            for (const id of order.ids) {
                await youge.updateStatus(id, "Error", errorMsg);
            }
            continue;
        }

        try {
            const apiRes = await giga.createOrder(payload);
            console.log(`Order ${orderNo} created. GIGA ID: ${apiRes.data?.orderId}`);

            for (const id of order.ids) {
                await youge.updateStatus(id, "Processed", `GIGA Created. ID: ${apiRes.data?.orderId}`);
            }
            results.success++;
        } catch (e) {
            // Idempotency: Handle "Order already exists" (BRD 16.1)
            if (e.message.includes("exists") || e.message.includes("重复")) {
                console.log(`Order ${orderNo} skip: already exists in GIGA.`);
                for (const id of order.ids) {
                    await youge.updateStatus(id, "Processed", "Order already existed in GIGA.");
                }
                results.success++;
                continue;
            }

            console.error(`Error processing ${orderNo}: ${e.message}`);
            results.failed++;
            results.errors.push(`${orderNo}: ${e.message}`);
            for (const id of order.ids) {
                await youge.updateStatus(id, "Error", e.message);
            }
        }
    }

    results.message = results.message || `Processed ${results.success} successfully, ${results.failed} failed, ${results.skipped} skipped (validation).`;
    return results;
}

/**
 * Status Mirroring & Shipment Sync (BRD 18.1 & 13)
 */
async function syncDownstream(env) {
    const youge = new YougeClient(env.YOUGE_APP_TOKEN, env.YOUGE_APP_CODE, env.YOUGE_SCHEMA_CODE, env.YOUGE_ENGINE_CODE, env.YOUGE_BASE_URL);
    const giga = new GigaClient(env.GIGA_CLIENT_ID, env.GIGA_CLIENT_SECRET, env.GIGA_API_BASE_URL);

    try {
        const allRecords = await youge.getRawRecords();
        const mappedRecords = allRecords.map(r => youge._mapRecord(r));

        const activeRecords = mappedRecords.filter(r => {
            const s = r.status;
            return s === 'Processed' || s === 'Being Processed' || s === 'Paid' || s === 'Unpaid';
        });

        const stats = {
            fetched: allRecords.length,
            matched: activeRecords.length,
            updated: 0,
            failed: 0,
            errors: []
        };

        if (activeRecords.length === 0) return { ...stats, message: "No active orders to sync status." };

        const orderNoMap = {};
        for (const r of activeRecords) {
            const orderNo = r.orderNo;
            if (!orderNoMap[orderNo]) orderNoMap[orderNo] = [];
            orderNoMap[orderNo].push(r.id);
        }

        const orderNos = Object.keys(orderNoMap);
        stats.checked = orderNos.length;

        // Batch Tracking Update
        const startTime = Date.now();
        for (let i = 0; i < orderNos.length; i += 20) {
            // Constraint: Check 40s limit (Safe buffer for 30s-60s limit workers)
            if (Date.now() - startTime > 40000) {
                console.warn("Sync Downstream timed out (40s limit reached). Stopping batch.");
                stats.message = "Partial execution. Stopped at 40s limit.";
                break;
            }

            const batch = orderNos.slice(i, i + 20);
            try {
                const res = await giga.getTrackingInfo(batch);
                const trackingDatas = res.data || [];

                for (const td of trackingDatas) {
                    const oids = orderNoMap[td.orderNo] || [];
                    for (const oid of oids) {
                        // If we have tracking info, consider it 'Completed' (BRD 13)
                        if (td.shipTrackInfo?.length > 0) {
                            const carrier = [...new Set(td.shipTrackInfo.map(t => t.carrierName || 'Unknown'))].join(' / ');
                            const tracking = td.shipTrackInfo.map(t => `${t.carrierName || 'Unknown'}: ${t.trackingNum}`).join('; ');
                            await youge.updateShipmentInfo(oid, { carrierName: carrier, trackingNo: tracking });
                            await youge.updateStatus(oid, 'Completed', `Tracking info synced: ${tracking}`);
                            stats.updated++;
                        }
                    }
                }
            } catch (e) {
                console.error(`Error in tracking batch: ${e.message}`);
                let userFriendlyError = e.message;
                if (e.message.includes('404')) {
                    userFriendlyError = "System Error: Connection to GIGA Tracking Service failed (404).";
                }

                for (const orderNo of batch) {
                    const oids = orderNoMap[orderNo] || [];
                    for (const oid of oids) {
                        await youge.updateStatus(oid, 'Error', userFriendlyError);
                        stats.failed++;
                        stats.errors.push(`${orderNo}: ${userFriendlyError}`);
                    }
                }
            }
        }
        return stats;
    } catch (e) {
        return { error: e.message };
    }
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        try {
            if (url.pathname === '/console') {
                return new Response(CONSOLE_HTML, { headers: { 'Content-Type': 'text/html' } });
            }

            if (url.pathname === '/status') {
                const youge = new YougeClient(env.YOUGE_APP_TOKEN, env.YOUGE_APP_CODE, env.YOUGE_SCHEMA_CODE, env.YOUGE_ENGINE_CODE, env.YOUGE_BASE_URL);
                const all = await youge.getRawRecords();
                const mapped = all.map(r => youge._mapRecord(r));
                return new Response(JSON.stringify({
                    pending: mapped.filter(r => r.status === 'Pending').length,
                    processed: mapped.filter(r => r.status === 'Processed').length,
                    error: mapped.filter(r => r.status === 'Error').length,
                    completed: mapped.filter(r => r.status === 'Completed').length,
                    total: all.length
                }), { headers: { 'Content-Type': 'application/json' } });
            }

            if (url.pathname === '/sync') {
                const results = await processOrders(request, env);
                return new Response(JSON.stringify(results, null, 2), { headers: { 'Content-Type': 'application/json' } });
            }

            if (url.pathname === '/sync-shipment') {
                const results = await syncDownstream(env);
                return new Response(JSON.stringify(results, null, 2), { headers: { 'Content-Type': 'application/json' } });
            }

            if (url.pathname === '/diag') {
                const youge = new YougeClient(env.YOUGE_APP_TOKEN, env.YOUGE_APP_CODE, env.YOUGE_SCHEMA_CODE, env.YOUGE_ENGINE_CODE, env.YOUGE_BASE_URL);
                const results = {
                    config: {
                        YOUGE_BASE_URL: env.YOUGE_BASE_URL,
                        RESOLVED_YOUGE_BASE: youge.baseUrl,
                        YOUGE_APP_CODE: env.YOUGE_APP_CODE,
                        YOUGE_SCHEMA_CODE: env.YOUGE_SCHEMA_CODE
                    },
                    diagnostics: {}
                };

                try {
                    const allRecords = await youge.getRawRecords();
                    results.diagnostics.totalFetched = allRecords.length;

                    // Show ALL records with raw vs normalized status
                    results.diagnostics.allRecords = allRecords.map(r => {
                        const mapped = youge._mapRecord(r);
                        return {
                            id: mapped.id,
                            orderNo: mapped.orderNo,
                            rawStatus: mapped.rawStatus,
                            rawStatusType: typeof mapped.rawStatus + (Array.isArray(mapped.rawStatus) ? '[]' : ''),
                            normalizedStatus: mapped.status,
                            carrier: r[youge.FIELDS.CARRIER],
                            tracking: r[youge.FIELDS.TRACKING]
                        };
                    });

                    // Status distribution
                    const statusCounts = {};
                    results.diagnostics.allRecords.forEach(r => {
                        const s = r.normalizedStatus || '(empty)';
                        statusCounts[s] = (statusCounts[s] || 0) + 1;
                    });
                    results.diagnostics.statusDistribution = statusCounts;
                } catch (e) {
                    results.diagnostics.error = e.message;
                    results.diagnostics.stack = e.stack;
                }

                return new Response(JSON.stringify(results, null, 2), { headers: { 'Content-Type': 'application/json' } });
            }

            if (url.pathname === '/retry') {
                const orderId = url.searchParams.get('orderId');
                const youge = new YougeClient(env.YOUGE_APP_TOKEN, env.YOUGE_APP_CODE, env.YOUGE_SCHEMA_CODE, env.YOUGE_ENGINE_CODE, env.YOUGE_BASE_URL);
                const all = await youge.getRawRecords();
                const recs = all.filter(r => {
                    const mapped = youge._mapRecord(r);
                    return mapped.orderNo === orderId;
                });
                for (const r of recs) {
                    const id = r[youge.FIELDS.ROW_ID];
                    await youge.updateStatus(id, "Pending", "Manual retry.");
                }
                return new Response(JSON.stringify({ message: `Retrying order ${orderId}` }), { headers: { 'Content-Type': 'application/json' } });
            }

            return new Response(`GIGA Sync Worker (V1.3). Access /console for management.`, { status: 200 });
        } catch (e) {
            return new Response(JSON.stringify({ error: e.message, stack: e.stack }), { status: 500 });
        }
    },

    async scheduled(event, env, ctx) {
        const scheduledTime = new Date(event.scheduledTime);
        const hour = scheduledTime.getUTCHours();
        console.log(`Scheduled Event Triggered: ${scheduledTime.toISOString()} (UTC Hour: ${hour})`);

        // Safety: Log if the hour is unexpected
        if (![2, 5, 9].includes(hour)) {
            console.warn(`Warning: Scheduled event fired at unexpected hour: ${hour}`);
        }

        if (hour === 2 || hour === 5) {
            console.log("Executing Order Sync (processOrders)");
            ctx.waitUntil(processOrders(null, env));
        } else if (hour === 9) {
            console.log("Executing Tracking/Shipment Sync (syncDownstream)");
            ctx.waitUntil(syncDownstream(env));
        }
    }
};

import { GigaClient } from './giga-client.js';
import { YougeClient } from './youge-client.js';
