/**
 * Giga B2B API Client
 * Handles Drop Shipping Order Creation
 */

export class GigaClient {
    constructor(clientId, clientSecret, baseUrl) {
        if (!baseUrl) throw new Error("GIGA_API_BASE_URL is not defined in environment variables.");
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        // Use the Overseas API path
        this.baseUrl = baseUrl.replace(/\/$/, '');
    }

    /**
     * Generates the signature for the API request.
     * Based on GIGA OpenAPI 2.0 specification:
     * 1. Construct message: clientId & apiPath & timestamp & nonce
     * 2. Construct key: clientId & clientSecret & nonce
     * 3. HMAC-SHA256 encrypt and convert to hex
     * 4. Base64 encode the result
     * 
     * @param {string} timestamp - Current timestamp in ms
     * @param {string} nonce - Random 10-digit string
     * @param {string} apiPath - API endpoint path (e.g., /b2b-overseas-api/v1/buyer/order/dropShip-sync/v1)
     * @returns {Promise<string>} The calculated signature
     */
    async generateSignature(timestamp, nonce, apiPath) {
        // Step 1: Construct message string
        const message = `${this.clientId}&${apiPath}&${timestamp}&${nonce}`;

        // Step 2: Construct secret key
        const key = `${this.clientId}&${this.clientSecret}&${nonce}`;

        // Step 3: HMAC-SHA256 encryption and convert to hex
        const encoder = new TextEncoder();
        const keyData = encoder.encode(key);
        const messageData = encoder.encode(message);

        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);

        // Convert to hex string
        const hexString = Array.from(new Uint8Array(signature))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        // Step 4: Base64 encode the hex string
        const base64Signature = btoa(hexString);

        return base64Signature;
    }

    /**
     * Creates a Drop Shipping Order in GigaB2B
     * @param {Object} orderData - The order payload
     * @returns {Promise<Object>} API Response
     */
    async createOrder(orderData) {
        const apiPath = '/b2b-overseas-api/v1/buyer/order/dropShip-sync/v1';
        return await this._request('POST', apiPath, orderData);
    }

    /**
     * Fetches tracking information from GigaB2B
     * @param {string[]} orderNos - Array of GigaB2B Order Numbers
     */
    async getTrackingInfo(orderNos) {
        const apiPath = '/b2b-overseas-api/v1/buyer/order/track-no/v1';
        const payload = { orderNo: orderNos };
        return await this._request('POST', apiPath, payload);
    }

    async _request(method, apiPath, body = null, fullUrl = null) {
        const url = fullUrl || `${this.baseUrl}${apiPath}`;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount <= maxRetries) {
            const timestamp = Date.now().toString();
            const nonce = Math.random().toString().substring(2, 12);
            const signature = await this.generateSignature(timestamp, nonce, apiPath);

            const headers = {
                'Content-Type': 'application/json',
                'client-id': this.clientId,
                'timestamp': timestamp,
                'nonce': nonce,
                'sign': signature
            };

            const options = {
                method,
                headers
            };
            if (body) options.body = JSON.stringify(body);

            try {
                const response = await fetch(url, options);
                const result = await response.json();

                if (!response.ok || (result.success === false)) {
                    const errorMsg = result.subMsg || result.msg || response.statusText;
                    const errorCode = result.code;

                    // Retry logic for transient errors (429 Too Many Requests, 5xx Server Errors)
                    if (retryCount < maxRetries && (response.status === 429 || response.status >= 500)) {
                        retryCount++;
                        const delay = Math.pow(2, retryCount) * 1000;
                        console.warn(`Giga API Retry ${retryCount}/${maxRetries} after ${delay}ms due to status ${response.status}: ${errorMsg}`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }

                    throw new Error(`Giga API Error (${apiPath}): ${errorMsg} (Code: ${errorCode})`);
                }

                return result;
            } catch (e) {
                // Network errors (e.g., fetch failure) should also be retried
                if (retryCount < maxRetries && !e.message.includes('Code:')) {
                    retryCount++;
                    const delay = Math.pow(2, retryCount) * 1000;
                    console.warn(`Giga API Network Retry ${retryCount}/${maxRetries} after ${delay}ms: ${e.message}`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                throw e;
            }
        }
    }
}
