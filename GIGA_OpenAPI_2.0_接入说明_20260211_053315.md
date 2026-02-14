# GIGA Open API 接入说明（OpenAPI 2.0）

## 一、概述

GIGA 平台提供 Open API 能力，开放平台 Buyer、Seller 数据，具备自研系统或使用第三方系统（ERP）的 Buyer、Seller，可通过接入 GIGA Open API 获取相应数据，实现自定义应用的开发。

---

## 二、API 申请流程

### 1）Buyer 接入（自助申请）

菜单路径：

- Buyer个人中心 → APIs → API应用市场 → OpenAPI

申请完成后在“管理我的API”中查看详情，获取：

- Client ID
- Client Secret

### 2）Seller 接入（客服开通）

Seller 需要对接 OpenAPI：联系在线客服开通并获取：

- Client ID
- Client Secret

注意：目前仅支持 On-Site Seller。

### 3）接入流程简述

1. Buyer：在 B2B 平台申请配置 Open API 应用，获取 API key  
2. Seller：联系在线客服申请开通，获取 API key（仅支持 On-Site Seller）  
3. 按本文档配置公共参数，并按签名规则生成签名  
4. 调试上线；如需 GIGA 协助测试，请联系在线客服寻求技术支持  

---

## 三、版本说明

- 本文档提及的规则均适用于所有 OpenAPI 2.0 的接口。
- 建议开发者尽快切换到本版本：接口功能更完善、报错信息更标准且更丰富。
- 旧版本（OpenAPI 1.0）接口不久后会下线，届时无法再使用。

### 兼容性提示

- 在 2025 年 8 月 28 日前，Buyer 在页面申请的 API key 通常可用于请求所有 OpenAPI 2.0 接口（极少数线下申请用户除外）。
- 若遇到旧 API key 无法调用新 OpenAPI 2.0 接口，请尽快在：
  - Buyer个人中心 → APIs → API应用市场 → OpenAPI  
  重新配置 OpenAPI 应用以获取新的 API key。

---

## 四、域名

测试环境域名：
- https://openapi-sandbox.gigab2b.com

生产环境域名：
- https://openapi.gigab2b.com

> 注：以上为 OpenAPI 2.0 版本接口域名（非 1.0）。OpenAPI 1.0 文档请在帮助中心查看《GIGA Open API 1.0文档》，请勿混淆。

---

## 五、签名规则说明

### 前提

用户需先获取 GIGA B2B 平台的 API key（Client ID、Client Secret）。  
- Buyer：在 B2B 平台页面申请获取  
- Seller：联系人工客服开通申请获取  
- 注意：需要是**生产环境**的 Client ID / Client Secret

### 签名生成步骤

1. **构造字符串1**：用“&”拼接  
   - `Client ID & API路径 & timestamp & nonce`  
   例：`ClientID&/api/v1/test&timestamp&nonce`

2. **构造秘钥**：用“&”拼接  
   - `Client ID & Client Secret & nonce`

3. **密串1**：用秘钥对字符串1做 `HMAC + SHA256` 加密，并转 16 进制得到密串1

4. **sign 值**：对密串1进行 base64 编码得到最终 sign（作为入参）

### Java 代码示例（原文保留）

```java
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

/**
 * api签名工具类
 */
public class ApiSignUtil {
    public static final String NAME = "HmacSHA256";

    public static String encrypt(String message, String secretKey) {
        try {
            Mac hmacSHA256 = Mac.getInstance(NAME);
            SecretKeySpec spec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), NAME);
            hmacSHA256.init(spec);
            byte[] bytes = hmacSHA256.doFinal(message.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexStr = new StringBuilder();
            for (byte b : bytes) {
                hexStr.append(String.format("%02x", b));
            }
            return hexStr.toString();
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new RuntimeException(e);
        }
    }

    public String getApiSign(String clientId, Long timestamp, String nonce, String uri, String clientSecret) {
        String msg = clientId + "&" + uri + "&" + timestamp + "&" + nonce;
        String key = clientId + "&" + clientSecret + "&" + nonce;
        byte[] result = encrypt(msg, key).getBytes(StandardCharsets.UTF_8);
        return Base64.getEncoder().encodeToString(result);
    }
}
```

---

## 六、公共参数说明

| 参数名称 | 数据类型 | 是否必填 | 描述 | 默认值 |
|---|---|---:|---|---|
| Content-Type | String | 是 | 输入参数数据类型说明，默认支持 application/json | application/json |
| client-id | String | 是 | Client ID（B2B 平台申请 OpenAPI 应用得到的 API key） | - |
| timestamp | String | 是 | 毫秒时间戳（只处理 20 分钟以内的请求） | - |
| nonce | String | 是 | 随机值，要求 10 位 | - |
| sign | String | 是 | 签名 | - |

---

## 七、查询参数说明（GET）

示例：

- `GET /api-b2b-v1/product/skus?orderId=123`
- `GET /api/items?item_id=123&sort=desc`

---

## 八、请求体参数说明（POST / PUT）

```json
{
  "skus": [
    "W59463028"
  ]
}
```

---

## 九、返回参数说明（通用结构）

| 参数名称 | 数据类型 | 是否必填 | 描述 |
|---|---|---:|---|
| success | bool | 是 | 判断请求响应是否成功 |
| code | string | 是 | 错误码；成功返回 200，失败返回相应错误码 |
| data | object[] | 否 | 响应请求的信息 |
| requestId | string | 是 | 请求唯一标识，便于客户端跟进异常处理 |
| msg | string | 是 | 错误信息描述；响应成功返回 success |
| subMsg | string | 否 | 明细错误场景描述（存在二级错误时返回） |
| recommend | string | 否 | 错误诊断链接（可复制 URL 跳转到错误诊断页） |

---

## 十、请求频率限制

为提高接口性能并保障稳定性，接口会做频率限制。每个接口的具体请求频率限制，请查阅对应接口文档。
