# Tracking Number Query API

## Overview

**Method:** `POST`\
**API Path:** `/b2b-overseas-api/v1/buyer/order/track-no/v1`

------------------------------------------------------------------------

## Update Log

  Date         Details
  ------------ ---------------------
  08/28/2025   New interface added

------------------------------------------------------------------------

## Use Case

Query the tracking number of packages.

------------------------------------------------------------------------

## Rate Limiting

-   20 requests per 10 seconds

------------------------------------------------------------------------

## Header Parameters

  ---------------------------------------------------------------------------------
  Parameter Name   Data Type    Required    Description          Default Value
  ---------------- ------------ ----------- -------------------- ------------------
  Content-Type     string       true        Must be              application/json
                                            `application/json`   

  timestamp        string       true        Milliseconds since   ---
                                            January 1, 1970      
                                            (UTC). Only requests 
                                            within 20 minutes    
                                            are processed.       

  nonce            string       true        10-digit random      ---
                                            string               

  sign             string       true        Request signature    ---

  client-id        string       true        Open API account     ---
                                            applied by user      
  ---------------------------------------------------------------------------------

------------------------------------------------------------------------

## Query Parameters

None

------------------------------------------------------------------------

## Request Body Parameters

  -----------------------------------------------------------------------
  Parameter Name        Data Type       Required       Description
  --------------------- --------------- -------------- ------------------
  orderNo               string\[\]      false          Shipment ID.
                                                       Maximum 100 order
                                                       numbers per
                                                       request.

  -----------------------------------------------------------------------

### Example Request

``` json
{
  "orderNo": [
    "DSR202507241513"
  ]
}
```

------------------------------------------------------------------------

## Response Parameters

  -----------------------------------------------------------------------
  Parameter Name        Data Type       Required       Description
  --------------------- --------------- -------------- ------------------
  success               boolean         true           Indicates whether
                                                       the request was
                                                       successful

  code                  string          true           Error code
                                                       (included in both
                                                       success and
                                                       failure responses)

  data                  array           false          Response data

  requestId             string          true           Unique identifier
                                                       of the request

  msg                   string          false          Error message

  subMsg                string          false          Detailed error
                                                       message
                                                       description

  recommend             string          false          Error diagnostics
                                                       URL
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## Example Response

``` json
{
  "success": true,
  "code": "200",
  "data": [
    {
      "orderNo": "DSR202507241513",
      "shipTrackInfo": [
        {
          "sku": "W2727P199353",
          "skuQty": 1,
          "isCombo": true,
          "comboSku": "W2727S00005",
          "trackingNum": "794891243280",
          "carrierName": "Fedex"
        }
      ],
      "returnTrackInfo": []
    }
  ],
  "requestId": "783a16a76d6c3704",
  "msg": "success",
  "subMsg": null,
  "recommend": null
}
```

------------------------------------------------------------------------

## Error Codes

See API documentation table for complete list of error codes and
solutions.
