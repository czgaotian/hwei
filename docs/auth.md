# Auth 认证设计

> 本文档描述**个人使用场景**下的认证与权限设计，目标是：**简单、安全、可维护**。

---

## 1. 设计目标

- 仅供**个人使用（单管理员）**
- 适配 **Cloudflare Worker（无状态）** 架构
- 前后端分离（Admin UI + REST API）
- 不引入不必要的复杂度（如 OAuth、多角色系统）

---

## 2. 认证方案概述

### 2.1 认证方式

- **JWT（JSON Web Token）**
- 使用 **Access Token only**（无 Refresh Token）

### 2.2 适用理由

- Worker / Serverless 天然适合无状态认证
- 单用户场景，重新登录成本低
- 避免 Refresh Token 带来的存储与吊销复杂度

---

## 3. Token 设计

### 3.1 Token 类型

| 类型          | 是否使用 | 说明             |
| ------------- | -------- | ---------------- |
| Access Token  | ✅       | API 访问凭证     |
| Refresh Token | ❌       | 个人场景暂不需要 |

---

### 3.2 Access Token 规范

- 有效期：**30 分钟**（可配置）
- 签名算法：`HS256`
- 签名密钥：`JWT_SECRET`（Worker Secret）

#### Payload 示例

```json
{
  "sub": "admin",
  "role": "admin",
  "iat": 1700000000,
  "exp": 1700001800
}
```

字段说明：

| 字段 | 说明                       |
| ---- | -------------------------- |
| sub  | 用户唯一标识（固定 admin） |
| role | 用户角色（固定 admin）     |
| iat  | 签发时间                   |
| exp  | 过期时间                   |

---

## 4. 登录流程

### 4.1 登录接口

```
POST /api/auth/login
```

#### 请求体

```json
{
  "username": "admin",
  "password": "******"
}
```

#### 登录流程

1. 校验用户名是否存在
2. 使用 `bcrypt` 校验密码
3. 生成 Access Token
4. 返回 Token 给前端

#### 返回示例

```http
HTTP/1.1 200 OK
Set-Cookie: auth_token=<jwt>; HttpOnly; Secure; SameSite=Strict; Max-Age=1800; Path=/

{
  "message": "Login successful"
}
```

**说明**：

- Token 通过 `Set-Cookie` 响应头设置
- 前端无需手动存储，浏览器自动管理
- 后续请求会自动携带 Cookie

### 4.2 密码管理

#### 初始化

- 部署时通过 Worker Secret 配置初始密码哈希：`PASSWORD_HASH`
- 使用 `bcrypt` 生成哈希存储

#### 修改密码

```
POST /api/admin/auth/change-password
```

##### 请求体

```json
{
  "oldPassword": "current_password",
  "newPassword": "new_password"
}
```

##### 流程

1. 验证 Token 有效性
2. 校验旧密码
3. 使用 bcrypt 生成新密码哈希
4. 更新密码哈希（需更新 Worker Secret）
5. 返回成功或错误

---

## 5. Token 使用方式

### 5.1 Cookie 自动发送

浏览器会自动在请求中携带 Cookie：

```http
Cookie: auth_token=<jwt>
```

**前端配置**：

使用 `fetch` 或 `axios` 时需要启用 credentials：

```typescript
// fetch
fetch("/api/admin/articles", {
  credentials: "include",
});

// axios
axios.defaults.withCredentials = true;
```

### 5.2 登出

```
POST /api/admin/auth/logout
```

#### 说明

- 后端清除 Cookie（设置过期时间为过去）
- 前端无需手动操作
- 返回成功状态

#### 返回示例

```http
HTTP/1.1 200 OK
Set-Cookie: auth_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/

{
  "message": "Logout successful"
}
```

---

## 6. 鉴权与中间件设计

### 6.1 受保护接口范围

```
/api/admin/*
```

- 文章管理
- 标签 / 分类管理
- 媒体上传
- 草稿 / 发布状态变更

---

### 6.2 鉴权逻辑

1. 从 `Cookie` 请求头中提取 `auth_token`
2. 校验 JWT 签名与过期时间
3. 解析 payload 并注入上下文
4. 校验用户角色（必须为 admin）

**实现示例**：

```typescript
// 从 Cookie 中提取 token
const cookies = request.headers.get("Cookie");
const token = cookies?.match(/auth_token=([^;]+)/)?.[1];

if (!token) {
  return Response.json(
    { error: "MISSING_TOKEN", message: "Missing authentication token" },
    { status: 401 },
  );
}

// 验证 JWT
const payload = await verifyJWT(token, env.JWT_SECRET);
```

### 6.3 错误响应规范

#### 标准错误响应格式

```json
{
  "error": "error_code",
  "message": "Human readable message"
}
```

#### 常见错误码

| 错误码                | HTTP 状态码 | 说明               | 示例消息                                  |
| --------------------- | ----------- | ------------------ | ----------------------------------------- |
| `MISSING_TOKEN`       | 401         | 缺少 Token         | Missing Authorization header              |
| `INVALID_TOKEN`       | 401         | Token 格式不正确   | Invalid token format                      |
| `TOKEN_EXPIRED`       | 401         | Token 已过期       | Token has expired                         |
| `INVALID_SIGNATURE`   | 401         | Token 签名验证失败 | Invalid token signature                   |
| `INVALID_CREDENTIALS` | 401         | 用户名或密码错误   | Invalid username or password              |
| `FORBIDDEN`           | 403         | 权限不足           | Permission denied                         |
| `INVALID_REQUEST`     | 400         | 请求体格式错误     | Invalid request payload                   |
| `RATE_LIMIT_EXCEEDED` | 429         | 请求过于频繁       | Too many requests, please try again later |
| `INTERNAL_ERROR`      | 500         | 服务器错误         | Internal server error                     |

---

## 7. 权限模型

### 7.1 角色定义

| 角色  | 说明       |
| ----- | ---------- |
| admin | 唯一管理员 |

> 当前版本不支持多角色 / 多用户

---

### 7.2 权限规则

- 所有创建，更新，删除接口仅允许 `admin`
- 展示接口（如博客列表、文章详情）无需认证

---

## 8. Token 存储策略（前端）

### HttpOnly Cookie

#### 设计思路

1. **登录时**：后端设置 HttpOnly Cookie，浏览器自动存储
2. **请求时**：浏览器自动在请求中携带 Cookie
3. **页面刷新**：Cookie 持久化，无需额外处理
4. **登出时**：后端清除 Cookie

#### Cookie 配置

```http
Set-Cookie: auth_token=<jwt>; HttpOnly; Secure; SameSite=Strict; Max-Age=1800; Path=/
```

**属性说明**：

| 属性     | 值     | 说明                                 |
| -------- | ------ | ------------------------------------ |
| HttpOnly | true   | 防止 JavaScript 访问，避免 XSS 攻击  |
| Secure   | true   | 仅通过 HTTPS 传输                    |
| SameSite | Strict | 防止 CSRF 攻击                       |
| Max-Age  | 1800   | 30 分钟有效期（与 JWT 过期时间一致） |
| Path     | /      | Cookie 作用于整个站点                |

#### 前端实现

```typescript
// useAuth Hook
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 登录
  const login = async (username: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // 重要：允许发送和接收 Cookie
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  // 登出
  const logout = async () => {
    await fetch("/api/admin/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setIsAuthenticated(false);
  };

  // 验证登录状态（页面初始化时调用）
  const verifyAuth = async () => {
    try {
      const response = await fetch("/api/admin/auth/verify", {
        credentials: "include",
      });
      setIsAuthenticated(response.ok);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  return { isAuthenticated, isLoading, login, logout, verifyAuth };
};
```

#### React App 初始化

```typescript
function App() {
  const { isAuthenticated, isLoading, verifyAuth } = useAuth();

  useEffect(() => {
    verifyAuth();
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return <Router />;
}
```

#### Axios 全局配置

```typescript
import axios from "axios";

// 允许跨域携带 Cookie
axios.defaults.withCredentials = true;

// 响应拦截器：处理 401 自动跳转登录
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
```

### 优点

- ✅ **安全性最高**：HttpOnly 防止 XSS，SameSite=Strict 防止 CSRF
- ✅ **用户体验好**：浏览器关闭后仍保持登录（Max-Age 内）
- ✅ **自动管理**：无需手动存储和发送 Token
- ✅ **跨标签页同步**：多个标签页共享登录状态
- ✅ **页面刷新不丢失**：Cookie 持久化存储

### 缺点

- ⚠️ **CORS 配置**：需要正确配置跨域（见下文）
- ⚠️ **开发调试**：Cookie 不如 Header 直观（可用浏览器开发工具查看）

### CORS 配置

#### Worker 端配置

```typescript
// 允许携带 Cookie 的 CORS 配置
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://your-domain.com", // 不能使用 *
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// OPTIONS 预检请求处理
if (request.method === "OPTIONS") {
  return new Response(null, { headers: corsHeaders });
}

// 正常响应添加 CORS 头
const response = await handleRequest(request);
Object.entries(corsHeaders).forEach(([key, value]) => {
  response.headers.set(key, value);
});
return response;
```

**重要**：

- `Access-Control-Allow-Origin` 必须指定具体域名，不能使用 `*`
- 必须设置 `Access-Control-Allow-Credentials: true`

### 后端支持接口

#### Token 验证接口

```
GET /api/admin/auth/verify
```

**说明**：验证 Cookie 中的 Token 是否有效

**响应示例**

```json
{
  "valid": true,
  "expiresIn": 1500
}
```

**错误响应**

```json
{
  "valid": false,
  "error": "TOKEN_EXPIRED"
}
```

## 9. 安全注意事项

### 9.1 基本安全

- `JWT_SECRET` 仅存在于 Worker Secret
- 所有 Admin API 启用 HTTPS
- 登录接口启用 Rate Limit

### 9.2 Rate Limit 配置

#### 登录接口

```
POST /api/auth/login
```

- **限制**：10 次请求 / 15 分钟
- **维度**：按 IP 地址
- **响应**：429 Too Many Requests

```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many login attempts. Please try again in 15 minutes.",
  "retryAfter": 900
}
```

#### 修改密码接口

```
POST /api/admin/auth/change-password
```

- **限制**：5 次请求 / 1 小时
- **维度**：按 Token 中的用户 ID

#### 实现方案

- 使用 Cloudflare KV 存储请求计数
- 键格式：`rate_limit:{endpoint}:{identifier}:{timestamp_bucket}`
- 过期时间：自动清理（TTL）

### 9.3 上传接口

- 上传接口必须走 Admin 鉴权
- 校验文件类型（image / video / audio）
- 推荐使用 R2 Presigned URL

---

## 10. 未来扩展（非当前版本）

以下内容**当前不实现**，仅作为演进方向：

- Refresh Token + 吊销机制
- 多用户 / 多角色（editor）
- OAuth（GitHub / Google）
- 操作审计日志

---

## 11. 版本说明

- v1：SessionStorage + Authorization Header（轻量级替代方案）
- v2：HttpOnly Cookie（当前推荐）

---

> 本认证方案刻意保持简单，适合**个人博客 CMS**，避免过度工程化。
