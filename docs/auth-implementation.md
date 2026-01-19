# 认证系统实现总结

本次更新实现了完整的用户认证系统，包括注册、登录、登出、修改密码等功能。

## 主要更改

### 1. 新增文件

#### 核心功能文件

- `src/worker/lib/jwt.ts` - JWT 工具函数（生成和验证 Token）
- `src/worker/routes/auth.ts` - 认证相关路由（注册、登录、登出、验证、修改密码）
- `src/worker/middleware/index.ts` - 添加了认证中间件 `authMiddleware`

#### 配置和文档文件

- `.dev.vars` - 开发环境变量配置文件（包含 JWT_SECRET）
- `.dev.vars.example` - 环境变量配置示例
- `docs/auth-setup.md` - 认证系统设置和使用指南

### 2. 修改的文件

#### 代码文件

- `src/worker/types/index.ts` - 添加了 `User` 类型，更新了 `Context` 类型以支持用户信息
- `src/worker/routes/index.ts` - 重构路由结构：
  - 公开路由：`/api/auth/*`
  - 受保护路由：`/api/admin/*`（需要认证）
- `src/worker/index.ts` - 更新 CORS 配置以支持 Cookie 认证
- `src/worker/lib/index.ts` - 导出 JWT 工具函数
- `worker-configuration.d.ts` - 添加 `JWT_SECRET` 环境变量类型定义

### 3. 依赖包

新增依赖：

- `bcryptjs` - 密码加密库
- `jose` - JWT 处理库（Cloudflare Workers 兼容）

## 功能特性

### 认证流程

1. **注册（仅首次）**：`POST /api/auth/register`
2. **登录**：`POST /api/auth/login` - 返回 HttpOnly Cookie
3. **验证**：`GET /api/auth/verify` - 检查登录状态
4. **登出**：`POST /api/auth/logout` - 清除 Cookie
5. **修改密码**：`POST /api/auth/change-password` - 需要认证

### 安全特性

- ✅ JWT Token 认证（30 分钟有效期）
- ✅ HttpOnly Cookie（防止 XSS）
- ✅ SameSite=Strict（防止 CSRF）
- ✅ bcrypt 密码加密
- ✅ 密码强度验证（最少 6 个字符）
- ✅ CORS 配置支持 Cookie

### 路由保护

所有 `/api/admin/*` 下的路由都自动受到认证保护：

- `/api/admin/articles/*` - 文章管理
- `/api/admin/categories/*` - 分类管理
- `/api/admin/tags/*` - 标签管理
- `/api/admin/media/*` - 媒体管理

## 数据库

使用现有的 `users` 表（已在迁移文件中定义）：

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s','now')) NOT NULL,
  updated_at INTEGER DEFAULT (strftime('%s','now')) NOT NULL
);
```

## 使用方法

### 1. 开发环境

```bash
# 1. 复制环境变量示例
cp .dev.vars.example .dev.vars

# 2. 编辑 .dev.vars，设置 JWT_SECRET
# JWT_SECRET=your-very-secure-secret-key

# 3. 运行数据库迁移
pnpm db:migrate

# 4. 启动开发服务器
pnpm dev
```

### 2. 首次使用

```bash
# 注册初始管理员（仅首次）
curl -X POST http://localhost:5173/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}'

# 登录
curl -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}' \
  -c cookies.txt

# 访问受保护的接口（会自动携带 Cookie）
curl http://localhost:5173/api/admin/articles \
  -b cookies.txt
```

### 3. 生产环境部署

```bash
# 1. 设置 JWT Secret（加密存储，不会暴露在代码中）
wrangler secret put JWT_SECRET
# 输入: your-very-secure-secret-key-at-least-32-characters

# 2. 部署
pnpm build && pnpm deploy
```

## 前端集成建议

### Axios 配置

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

### React Hook 示例

```typescript
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = async (username: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setIsAuthenticated(false);
  };

  return { isAuthenticated, login, logout };
};
```

## 错误处理

所有认证相关错误都遵循统一格式：

```json
{
  "error": "ERROR_CODE",
  "message": "Human readable message"
}
```

常见错误码：

- `MISSING_TOKEN` - 缺少认证 Token
- `TOKEN_EXPIRED` - Token 已过期
- `INVALID_TOKEN` - Token 无效
- `INVALID_SIGNATURE` - Token 签名无效
- `INVALID_CREDENTIALS` - 用户名或密码错误
- `FORBIDDEN` - 权限不足

## 下一步

可以考虑的改进：

1. 添加 Rate Limit（防止暴力破解）
2. 添加日志审计
3. 实现 Refresh Token（可选）
4. 添加多因素认证（可选）
5. 实现密码重置功能

## 相关文档

- [认证设计文档](./auth.md)
- [认证设置指南](./auth-setup.md)
- [产品需求文档](./product.md)
