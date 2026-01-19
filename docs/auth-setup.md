# 认证系统设置指南

本项目实现了基于 JWT + HttpOnly Cookie 的认证系统。以下是设置和使用说明。

## 开发环境设置

### 1. 配置环境变量

复制示例配置文件：

```bash
cp .dev.vars.example .dev.vars
```

编辑 `.dev.vars` 文件，设置你的 JWT 密钥（建议至少 32 个字符）：

```bash
JWT_SECRET=your-very-secure-secret-key-at-least-32-characters-long
```

### 2. 运行数据库迁移

确保数据库已创建并运行迁移：

```bash
pnpm db:migrate
```

### 3. 启动开发服务器

```bash
pnpm dev
```

## 生产环境部署

### 1. 设置 JWT Secret

在 Cloudflare Workers 中设置密钥（这样不会暴露在代码中）：

```bash
wrangler secret put JWT_SECRET
```

执行命令后，输入你的密钥（建议使用强密码生成器生成）。

### 2. 部署应用

```bash
pnpm build && pnpm deploy
```

## API 接口

### 公开接口（无需认证）

#### 注册初始管理员

**仅在首次部署时可用**，如果已存在用户则会返回错误。

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "admin",
  "password": "your-secure-password"
}
```

#### 登录

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "your-password"
}
```

成功后会在响应头中设置 `auth_token` Cookie。

#### 登出

```http
POST /api/auth/logout
```

会清除 `auth_token` Cookie。

### 受保护接口（需要认证）

所有以 `/api/admin/*` 开头的接口都需要认证。

#### 验证登录状态

```http
GET /api/auth/verify
```

返回示例：

```json
{
  "valid": true,
  "expiresIn": 1500
}
```

#### 修改密码

```http
POST /api/auth/change-password
Content-Type: application/json

{
  "oldPassword": "current-password",
  "newPassword": "new-password"
}
```

## 前端集成

### 配置 Axios 或 Fetch

需要启用 `credentials: 'include'` 以便自动发送和接收 Cookie：

```typescript
// Axios
import axios from "axios";

axios.defaults.withCredentials = true;

// Fetch
fetch("/api/admin/articles", {
  credentials: "include",
});
```

### CORS 配置

开发环境 CORS 已配置允许以下来源：

- `http://localhost:5173`
- `http://localhost:3000`
- `http://127.0.0.1:5173`
- `http://127.0.0.1:3000`

生产环境需要在 [src/worker/index.ts](src/worker/index.ts#L13-L32) 中配置你的实际域名。

## 安全注意事项

1. **JWT_SECRET** 必须保密，不要提交到代码仓库
2. 使用强密码（至少 6 个字符，建议更长）
3. 生产环境必须使用 HTTPS
4. Token 有效期为 30 分钟，过期后需要重新登录
5. HttpOnly Cookie 防止 XSS 攻击
6. SameSite=Strict 防止 CSRF 攻击

## 错误码参考

| 错误码                | 说明             |
| --------------------- | ---------------- |
| `MISSING_TOKEN`       | 缺少认证 Token   |
| `INVALID_TOKEN`       | Token 格式无效   |
| `TOKEN_EXPIRED`       | Token 已过期     |
| `INVALID_SIGNATURE`   | Token 签名无效   |
| `INVALID_CREDENTIALS` | 用户名或密码错误 |
| `FORBIDDEN`           | 权限不足         |
| `INVALID_REQUEST`     | 请求格式错误     |

## 首次使用流程

1. 部署应用并配置 JWT_SECRET
2. 访问 `/api/auth/register` 注册初始管理员账号
3. 使用 `/api/auth/login` 登录
4. 浏览器会自动保存 Cookie，之后的请求会自动携带认证信息
5. 访问受保护的接口（如 `/api/admin/articles`）

## 路由结构

```
/api
  /auth                  # 认证相关（公开）
    POST /register       # 注册初始管理员
    POST /login          # 登录
    POST /logout         # 登出
    GET  /verify         # 验证 Token
    POST /change-password # 修改密码（需认证）
  /admin                 # 管理接口（需认证）
    /articles            # 文章管理
    /categories          # 分类管理
    /tags                # 标签管理
    /media               # 媒体管理
```

## 故障排查

### Cookie 未被设置

1. 检查 CORS 配置是否正确
2. 确保前端请求使用了 `credentials: 'include'`
3. 确认前端域名在 CORS 允许列表中

### Token 验证失败

1. 检查 JWT_SECRET 是否正确配置
2. 确认 Token 未过期（30 分钟有效期）
3. 检查浏览器控制台是否有 Cookie 相关错误

### 无法注册用户

注册接口仅在首次部署时可用。如果已有用户存在，需要：

1. 使用现有账号登录
2. 或者清空数据库后重新注册

## 更多信息

详细认证设计请参考：[docs/auth.md](docs/auth.md)
