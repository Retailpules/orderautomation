cr001. Change Request – Web Console Interface

## 25.1 Background

当前系统仅通过 Cron 与日志进行运行，缺乏可视化控制与业务透明度。为提升运营可控性与系统可观测性，新增 Web Console 页面。

本变更为功能增强，不影响现有 API 稳定运行逻辑。

---

## 25.2 Scope

新增一个 Web 页面（Web Console），提供以下能力：

1. 手动触发订单创建同步
2. 手动触发物流信息回传同步
3. 展示程序运行状态与执行记录

---

## 25.3 Functional Requirements

### 25.3.1 手动触发 – 订单创建

系统 SHALL 提供按钮：

- "Trigger Order Sync"

行为：

- 调用现有 Worker /sync endpoint
- 返回执行结果摘要（成功数 / 失败数 / 跳过数）
- 展示执行耗时

限制：

- 同一时间仅允许一个执行任务运行
- 若已有执行任务，则按钮置灰

---

### 25.3.2 手动触发 – 物流回传

系统 SHALL 提供按钮：

- "Trigger Shipment Sync"

行为：

- 调用物流回传逻辑
- 展示更新订单数量
- 展示异常订单数量

---

### 25.3.3 运行状态展示

页面 SHALL 展示以下信息：

1. 当前系统状态
   - Idle / Running / Error
2. 最近一次执行时间
3. 最近一次执行结果摘要
4. 当前待处理订单数量
5. 当前 Error 状态订单数量

---

### 25.3.4 执行日志摘要

展示最近 20 条执行记录：

\| 时间 | 类型 | 成功数 | 失败数 | 状态 |

支持点击查看详细日志（只读）。

按照时间倒序排列。

---

## 25.4 Non-Functional Requirements

- 无需身份认证
- 不暴露 API Secret
- 页面加载时间 < 2 秒

---

## 25.5 Technical Approach (建议)

- 前端：简单 HTML + JS 或轻量 React
- 后端：复用现有 Worker
- 新增 endpoint：
  - GET /status
  - GET /logs

---

## 25.6 Business Value

- 提供业务可控性
- 减少技术依赖
- 降低排查成本
- 为未来产品化做准备

---

**Version:** 1.2 Change Request **Date:** 2026-02-13 **Type:** Web Console Enhancement

