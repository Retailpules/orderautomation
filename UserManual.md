# Giga-Youge Sync: Business User Manual

Welcome to the **Giga-Youge Order Automation System**. This guide is designed for business users to help you understand how the system works, how to monitor it, and how to handle exceptions using the new **Web Console**.

---

## 1. System Overview
The system automatically transfers "Pending" orders from the Sanyu Youge ERP into GigaB2B for fulfillment. It also syncs tracking information and GIGA order statuses back into Youge as they progress.

### Key Benefits
- **Zero Manual Entry**: Orders flow automatically from Youge to GigaB2B.
- **Accurate Tracking**: Shipment details are updated in Youge as soon as they are available.
- **Bi-directional Sync**: Order statuses (Paid, Being Processed, Completed) are mirrored in both systems.
- **Real-time Monitoring**: Use the Web Console to see system health at a glance.

---

## 2. The Web Console
The Web Console is your central hub for monitoring and manual control.

**URL:** [https://giga-shipment-sync-worker-production.jim-yang-3c5.workers.dev/console](https://giga-shipment-sync-worker-production.jim-yang-3c5.workers.dev/console)
> [!NOTE]
> The default subdomain for this account is `jim-yang-3c5.workers.dev`. If you use a custom domain later, please update this URL.

### Features:
- **Real-time Stats**: View the number of Pending, Processed, error, and Completed orders.
- **Trigger Order Sync**: Manually push all "Pending" and "Error" orders to GIGA immediately.
- **Trigger Status & Shipment Sync**: Force an update of order statuses and tracking numbers from GIGA.

---

## 3. Automated Sync Schedule
The system runs automatically three times daily:

| Time (JST) | Operation | Purpose |
|------------|-----------|---------|
| **11:00 AM** | Order Sync | Processes all "Pending" and "Error" orders. |
| **02:00 PM** | Order Sync | Processes the second batch of the day. |
| **06:00 PM** | Status & Shipment Sync | Updates tracking numbers and final order statuses. |

---

## 4. How to Use (For Operations)

### 4.1 Marking Orders for Sync
1. Ensure shipping details are complete in Youge.
2. Set the **Status** field to `Pending`.
3. The next scheduled run or a manual trigger from the console will process it.

### 4.2 Checking Sync Status
Track progress using the **Status** field in Youge:
- **Pending**: Waiting for sync.
- **Processed**: Successfully created in GigaB2B.
- **Paid / Being Processed**: Mirrors the current state in GIGA.
- **Completed**: Tracking number has been synced back.
- **Error**: Sync failed. Check "Order Comments" for details.

---

## 5. Troubleshooting

### 5.1 Handling Errors
1. Read the error message in the **Order Comments** field.
2. Fix the data in Youge (e.g., zip code format).
3. Either wait for the next run (Errors are retried automatically once a day) or use the **Trigger Order Sync** button in the Console for immediate retry.

### 5.2 Manual Retry for Specific Order
If you need to retry just one specific order, you can use the following URL pattern:
`https://[worker-url]/retry?orderId=[Your_Order_ID]`

---

## 6. Support
For technical issues, contact the development team with the **Order ID** and the **Error Message** from Youge or the Console output.
