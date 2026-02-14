# BRD v1.1 Patch 增补章节

## GIGA Order Automation - Shipment Sync Application

---

# 16. Idempotency & Duplicate Prevention Design

## 16.1 Order Idempotency Strategy

为防止重复创建 GIGA 订单，系统采用以下幂等控制策略：

1. 使用 Youge Order ID 作为 GIGA orderNo
2. GIGA 若返回“订单已存在”错误，则视为成功同步
3. 同步成功后更新 Youge 本地状态字段（仅表示“已提交至 GIGA”），不影响 GIGA 订单状态
4. Worker 不重复拉取已非 Pending 状态订单

## 16.2 Cron 重复执行保护

- 同一订单仅允许状态为 Pending 时进入创建流程
- 若状态已更新为其他，则自动跳过

---

# 17. Pagination Handling Strategy

## 17.1 Youge 数据分页处理

由于 Youge API 单次查询最大 limit 为 100 条：

系统必须：

- 使用 offset + limit 方式循环查询
- 直至返回数据量小于 limit
- 或达到 totalCount

伪逻辑：

```
offset = 0
limit = 100
while true:
  fetch records
  if records < limit:
      break
  offset += limit
```

---

# 18. Order Status Synchronization Enhancement

## 18.1 GIGA Order Status Mapping

系统 SHALL 调用 GIGA Order Status API 获取订单状态，并以 GIGA 返回结果为唯一真实来源（Single Source of Truth）。

原则说明：

- Youge 不得修改 GIGA 订单状态。
- Youge 仅根据 GIGA 返回的 orderStatus 进行状态镜像更新。
- 本系统为“下游状态同步方”，而非状态控制方。

状态流说明（标准生命周期）：

GIGA 订单创建后的正常生命周期如下：

Unpaid（待支付） → Paid（已支付） → Being Processed（发运处理中） → Completed（发运完成）

其中：

- On Hold 为异常处理状态
- Canceled 为终止状态

状态映射规则：

| GIGA Status | 描述              | Youge 状态（镜像）    |
| ----------- | --------------- | --------------- |
| 1           | Unpaid          | Unpaid          |
| 8\*         | Paid            | Paid            |
| 2           | Being Processed | Being Processed |
| 4           | On Hold         | On Hold         |
| 16          | Canceled        | Canceled        |
| 32          | Completed       | Completed       |

说明：

- Youge 中的状态值应严格镜像 GIGA 当前状态。
- 正常流程必须经历 Paid 阶段后才进入 Being Processed。
- On Hold / Canceled 为特殊分支状态，不属于正常履约路径。
- 不允许因本地流程（例如下单成功）而提前将状态标记为 Completed。

---

# 19. Error Handling Enhancement

## 19.1 Retry 策略升级

- 网络错误：最多 3 次指数退避
- 429 限流：延迟重试
- 401 签名错误：立即记录并告警

---

# 20. Rate Limiting Strategy

系统必须实现：

- 单接口 10 次 / 10 秒限制控制
- 批次之间最小间隔 200ms
- 高峰期自动降速

---

# 21. Worker Execution Constraint Mitigation

## 21.1 30 秒限制应对策略

- 单次执行最大处理 20 单
- 超出订单留待下一轮 Cron
- 执行时间超过 25 秒自动终止新订单处理

---

# 22. Time Synchronization Requirement

- timestamp 必须为当前服务器时间（毫秒）
- 不允许使用缓存时间
- 服务器时间误差不得超过 5 秒

---

# 23. Failure Recovery Mechanism

## 23.1 手动重试接口

系统 SHALL 提供：

```
POST /retry?orderId=xxx
```

用于人工重试失败订单。

## 23.2 自动补偿

- 状态为 Error 的订单每日自动重试一次
- 重试 3 次仍失败则标记为 Manual Review

---

# 24. Future Phase Alignment

本 Patch 为生产级增强补丁，不改变原业务目标，仅提升：

- 稳定性
- 可扩展性
- 生产环境可运维性

---

**Version:** 1.1 Patch **Date:** 2026-02-13 **Type:** Production Stability Enhancement

