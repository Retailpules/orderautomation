/**
 * Youge (Sanyu) API Client
 * Handles fetching Shipment Orders and updating their status
 */

export class YougeClient {
    constructor(appToken, appCode, schemaCode, engineCode, baseUrl) {
        if (!baseUrl) throw new Error("YOUGE_BASE_URL is not defined in environment variables.");
        this.appToken = appToken;
        this.appCode = appCode;
        this.schemaCode = schemaCode;
        this.engineCode = engineCode;
        // Standardize Base URL to include /openapi as per official documentation
        this.baseUrl = baseUrl.replace(/\/$/, '') + '/openapi';

        // Field Mappings
        this.FIELDS = {
            STATUS: 'F00000AL3',      // Status
            ORDER_ID: 'F00000ALE',    // *OrderId
            SHIP_NAME: 'F00000AL8',   // *ShipToName
            SHIP_ADDR: 'F00000ALC',   // *ShipToAddressDetail
            SHIP_CITY: 'F00000ALD',   // *ShipToCity
            SHIP_STATE: 'F00000ALF',  // *ShipToState
            SHIP_ZIP: 'F00000ALB',    // *ShipToPostalCode
            SHIP_COUNTRY: 'F00000ALG',// *ShipToCountry
            SHIP_PHONE: 'F00000ALA',  // *ShipToPhone
            SHIP_EMAIL: 'F00000AL9',  // ShipToEmail
            SHIP_FROM: 'F00000AKT',   // ShipFrom
            ITEM_CODE: 'F00000AL5',   // *B2BItemCode
            QTY: 'F00000AL6',         // *ShipToQty
            SALES_CHANNEL: 'F00000AKS', // SalesChannel
            ORDER_DATE: 'F00000ALJ',   // OrderDate
            COMMENTS: 'F00000ALP',    // OrderComments
            ITEM_PRICE: 'F00000ALY',    // BuyerSkuCommercialValue
            LINE_NO: 'F00000AL4',       // *LineItemNumber
            CARRIER: 'F00000AZW',       // Carrier Name
            TRACKING: 'F00000AZX',      // Tracking Number
            PO_ID: 'F00000AZY',         // Purchase Order ID
            GRAND_TOTAL: 'F00000B00',   // Grand Total (JPY)
            ORDER_TOTAL: 'F00000B01',   // Order Total (JPY)
            ROW_ID: 'ObjectId'        // Internal Record ID
        };
    }

    getHeaders() {
        // Ensure a single space between Bearer and token
        const token = (this.appToken || '').trim();
        const headers = {
            'Authorization': `Bearer ${token}`,
            'X-H3-AppCode': this.appCode,
            'Content-Type': 'application/json'
        };
        if (this.engineCode) {
            headers['X-H3-EngineCode'] = this.engineCode;
        }
        return headers;
    }

    /**
     * Fetches raw records from Youge with pagination support
     */
    async getRawRecords() {
        const url = `${this.baseUrl}/records/${this.appCode}/${this.schemaCode}`;
        console.log(`Fetching Youge Records from: ${url}`);

        let allRecords = [];
        let offset = 0;
        const limit = 100;

        while (true) {
            const payload = {
                offset: offset,
                limit: limit,
                filters: []
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Youge Raw Fetch Error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const rawText = await response.text();
            let data;
            try {
                data = JSON.parse(rawText);
            } catch (e) {
                throw new Error(`Youge JSON Parse Error on: ${rawText.substring(0, 500)}`);
            }

            const records = data.data?.records || [];
            allRecords = allRecords.concat(records);

            console.log(`Fetched ${records.length} records (Offset: ${offset}). Total: ${allRecords.length}`);

            if (records.length < limit) {
                break;
            }
            offset += limit;
        }

        return allRecords;
    }

    /**
     * Fetches pending shipment orders (Status is empty or 'Pending')
     */
    async getPendingOrders() {
        const records = await this.getRawRecords();

        // Filter: Status is "Pending" (Strict as per revised BRD)
        return records.filter(r => {
            const status = r[this.FIELDS.STATUS];
            return status === 'Pending';
        }).map(r => this._mapRecord(r));
    }

    _mapRecord(r) {
        return {
            id: r[this.FIELDS.ROW_ID],
            orderNo: r[this.FIELDS.ORDER_ID],
            shipName: r[this.FIELDS.SHIP_NAME],
            shipPhone: r[this.FIELDS.SHIP_PHONE],
            shipAddress1: r[this.FIELDS.SHIP_ADDR],
            shipCity: r[this.FIELDS.SHIP_CITY],
            shipState: r[this.FIELDS.SHIP_STATE],
            shipCountry: r[this.FIELDS.SHIP_COUNTRY],
            shipZipCode: r[this.FIELDS.SHIP_ZIP],
            shipEmail: r[this.FIELDS.SHIP_EMAIL] || '',
            sku: r[this.FIELDS.ITEM_CODE],
            qty: parseInt(r[this.FIELDS.QTY] || '0', 10),
            itemPrice: parseFloat(r[this.FIELDS.ITEM_PRICE] || '0'),
            orderDetailNo: parseInt(r[this.FIELDS.LINE_NO] || '0', 10),
            salesChannel: r[this.FIELDS.SALES_CHANNEL] || 'Other',
            shipFrom: r[this.FIELDS.SHIP_FROM] || 'Mercari Lifestyle',
            orderDate: r[this.FIELDS.ORDER_DATE]
        };
    }

    /**
     * Updates the status of an order
     */
    async updateStatus(objectId, status, comment = "") {
        const url = `${this.baseUrl}/record/${this.appCode}/${this.schemaCode}/${objectId}`;
        const payload = {
            [this.FIELDS.STATUS]: status,
            [this.FIELDS.COMMENTS]: comment
        };

        await fetch(url, {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: JSON.stringify(payload)
        });
    }

    /**
     * Updates shipment and financial information in Youge
     * @param {string} objectId - The Youge Record ID
     * @param {Object} data - The shipment data (trackingNo, carrierName, purchaseOrderId, grandTotal, orderTotal)
     */
    async updateShipmentInfo(objectId, data) {
        const url = `${this.baseUrl}/record/${this.appCode}/${this.schemaCode}/${objectId}`;
        const payload = {
            [this.FIELDS.STATUS]: 'Completed',
            [this.FIELDS.CARRIER]: data.carrierName,
            [this.FIELDS.TRACKING]: data.trackingNo
        };

        const response = await fetch(url, {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Youge Update Error: ${response.status} - ${errorText}`);
        }
    }
}
