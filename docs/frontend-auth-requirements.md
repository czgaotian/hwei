# 前端认证与权限功能需求文档

> 基于产品文档 "2. 用户与权限模型" 的前端实现需求

---

## 1. 概述

### 1.1 目标

实现单管理员博客 CMS 的前端认证与权限管理，包括：

- 首次初始化管理员账号
- 登录/登出功能
- 受保护路由访问控制
- 全局认证状态管理

### 1.2 技术栈

- React + TypeScript
- React Router（路由管理）
- Context API（全局状态）
- Ant Design（UI 组件）
- Axios（HTTP 请求）

---

## 2. 页面设计

### 2.1 管理员初始化页面 (`/setup`)

#### 2.1.1 页面说明

- **触发条件**：系统检测到未初始化管理员（首次访问）
- **目的**：创建管理员账号，设置用户名和密码
- **路由**：`/setup`

#### 2.1.2 UI 组件

**布局**：

- 居中卡片布局
- 页面标题："初始化管理员账号"
- 表单区域

**表单字段**：

| 字段     | 类型     | 规则                           | 说明         |
| -------- | -------- | ------------------------------ | ------------ |
| username | Input    | 必填，3-20字符，字母数字下划线 | 管理员用户名 |
| password | Password | 必填，至少8位，包含字母和数字  | 管理员密码   |
| confirm  | Password | 必填，需与 password 一致       | 确认密码     |

**按钮**：

- 提交按钮："创建管理员"（主按钮）
- Loading 状态处理

#### 2.1.3 交互流程

1. 用户填写表单
2. 前端验证表单规则
3. 调用 `POST /api/auth/register` 接口
4. 成功后自动跳转到登录页面，显示成功提示
5. 失败则显示错误信息（如用户名已存在）

#### 2.1.4 API 对接

```typescript
POST /api/auth/register

// 请求
{
  "username": "admin",
  "password": "******"
}

// 响应（成功）
{
  "message": "Admin account created successfully"
}

// 响应（失败）
{
  "error": "Admin already exists"
}
```

---

### 2.2 登录页面 (`/login`)

#### 2.2.1 页面说明

- **触发条件**：未登录用户访问受保护路由时重定向
- **目的**：管理员身份验证
- **路由**：`/login`

#### 2.2.2 UI 组件

**布局**：

- 居中卡片布局
- 页面标题："博客 CMS 登录"
- 表单区域

**表单字段**：

| 字段     | 类型     | 规则 | 说明               |
| -------- | -------- | ---- | ------------------ |
| username | Input    | 必填 | 用户名             |
| password | Password | 必填 | 密码               |
| remember | Checkbox | 可选 | 记住我（可选功能） |

**按钮**：

- 登录按钮："登录"（主按钮）
- Loading 状态处理

#### 2.2.3 交互流程

1. 用户输入用户名和密码
2. 点击登录按钮
3. 调用 `POST /api/auth/login` 接口
4. 成功后：
   - 更新全局认证状态（已登录）
   - 跳转到目标页面（来源页或默认首页 `/`）
5. 失败则显示错误提示（用户名或密码错误）

#### 2.2.4 API 对接

```typescript
POST /api/auth/login

// 请求
{
  "username": "admin",
  "password": "******"
}

// 响应（成功）
// Token 通过 HttpOnly Cookie 自动设置
{
  "message": "Login successful"
}

// 响应（失败 401）
{
  "error": "Invalid username or password"
}
```

**注意**：

- 需要配置 `axios.defaults.withCredentials = true` 以支持 Cookie
- Token 由后端通过 `Set-Cookie` 响应头自动管理

---

### 2.3 登出功能

#### 2.3.1 触发位置

- 顶部导航栏右侧用户信息区域
- 下拉菜单中的"退出登录"选项

#### 2.3.2 交互流程

1. 用户点击"退出登录"
2. （可选）显示二次确认弹窗："确定要退出吗？"
3. 调用 `POST /api/auth/logout` 接口
4. 成功后：
   - 清空全局认证状态
   - 跳转到登录页面 `/login`
   - 显示"已退出登录"提示

#### 2.3.3 API 对接

```typescript
POST /api/auth/logout

// 响应（成功）
// Cookie 被清除
{
  "message": "Logout successful"
}
```

---

## 3. 路由设计

### 3.1 路由类型

| 路由类型   | 说明                 | 示例路由                  |
| ---------- | -------------------- | ------------------------- |
| 公开路由   | 无需登录即可访问     | `/login`, `/register`     |
| 受保护路由 | 需要登录才能访问     | `/`, `/articles`, `/tags` |
| 重定向     | 根据认证状态自动跳转 | `/` → `/login`            |

### 3.2 受保护路由实现

#### 3.2.1 ProtectedRoute 组件

**功能**：

- 检查用户登录状态
- 未登录时重定向到 `/login`
- 已登录时渲染目标组件

**实现要点**：

```typescript
// ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@frontend/context/authContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>加载中...</div>; // 或 Spin 组件
  }

  if (!isAuthenticated) {
    // 保存当前路径，登录后可返回
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
```

#### 3.2.2 路由配置

```typescript
// routes/index.tsx
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import Login from '@frontend/pages/Login';
import Setup from '@frontend/pages/Setup';
import Layout from '@frontend/Layout';
// ... 其他页面导入

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/setup',
    element: <Setup />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />, // 首页/仪表盘
      },
      {
        path: 'articles',
        element: <ArticleList />,
      },
      {
        path: 'articles/new',
        element: <ArticleEditor />,
      },
      {
        path: 'articles/:id/edit',
        element: <ArticleEditor />,
      },
      {
        path: 'tags',
        element: <TagManagement />,
      },
      {
        path: 'categories',
        element: <CategoryManagement />,
      },
      {
        path: 'media',
        element: <MediaManagement />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);
```

---

## 4. 全局状态管理

### 4.1 AuthContext 设计

**目的**：

- 管理全局认证状态
- 提供登录/登出方法
- 自动检查认证状态
- 提供用户信息

#### 4.1.1 状态结构

```typescript
interface AuthState {
  isAuthenticated: boolean; // 是否已登录
  isLoading: boolean; // 状态加载中
  user: User | null; // 用户信息
}

interface User {
  username: string;
  role: "admin";
}
```

#### 4.1.2 Context API

```typescript
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}
```

#### 4.1.3 实现要点

**AuthProvider 组件**：

```typescript
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  // 检查认证状态
  const checkAuth = async () => {
    try {
      // 调用 GET /api/auth/me 验证当前 Cookie 有效性
      const response = await axios.get('/api/auth/me');
      setState({
        isAuthenticated: true,
        isLoading: false,
        user: response.data.user,
      });
    } catch (error) {
      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });
    }
  };

  // 登录
  const login = async (username: string, password: string) => {
    const response = await axios.post('/api/auth/login', {
      username,
      password,
    });
    await checkAuth(); // 登录成功后重新检查状态
  };

  // 登出
  const logout = async () => {
    await axios.post('/api/auth/logout');
    setState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });
  };

  // 应用启动时检查认证状态
  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}
```

**useAuth Hook**：

```typescript
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
```

---

## 5. HTTP 请求配置

### 5.1 Axios 配置

**全局配置**：

```typescript
// lib/axios.ts
import axios from "axios";

// 创建 axios 实例
export const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
  withCredentials: true, // 重要：允许携带 Cookie
});

// 响应拦截器：处理 401 未授权
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token 失效，跳转到登录页
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
```

### 5.2 API 封装

```typescript
// api/auth.ts
import { api } from "@frontend/lib/axios";

export const authApi = {
  // 登录
  login: (username: string, password: string) =>
    api.post("/auth/login", { username, password }),

  // 登出
  logout: () => api.post("/auth/logout"),

  // 检查认证状态
  me: () => api.get("/auth/me"),

  // 初始化管理员
  register: (username: string, password: string) =>
    api.post("/auth/register", { username, password }),
};
```

---

## 6. UI/UX 细节

### 6.1 页面布局

#### 6.1.1 登录/初始化页面布局

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│         ┌──────────────┐            │
│         │   Logo/Title │            │
│         │              │            │
│         │  [表单区域]  │            │
│         │              │            │
│         │   [按钮]     │            │
│         └──────────────┘            │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

**样式要求**：

- 居中显示
- 卡片阴影效果
- 响应式设计（移动端适配）
- 卡片宽度：最大 400px

#### 6.1.2 主应用布局（已登录）

```
┌─────────────────────────────────────────┐
│  Header [Logo] [User] [Logout]         │
├──────┬──────────────────────────────────┤
│      │                                  │
│ Side │      Content Area                │
│ Menu │                                  │
│      │                                  │
│      │                                  │
└──────┴──────────────────────────────────┘
```

**Header 右侧用户区**：

- 用户名显示
- 下拉菜单：
  - 修改密码（可选）
  - 退出登录

### 6.2 加载状态

| 场景           | 状态处理              |
| -------------- | --------------------- |
| 登录中         | 按钮显示 Loading 状态 |
| 检查认证状态中 | 全屏 Spin 或骨架屏    |
| 页面跳转中     | 路由过渡动画（可选）  |

### 6.3 错误处理

| 错误类型         | 处理方式                   |
| ---------------- | -------------------------- |
| 网络错误         | Message.error 全局提示     |
| 401 未授权       | 自动跳转到登录页           |
| 表单验证错误     | 表单项下方显示错误信息     |
| 服务器错误 (500) | Message.error 显示错误信息 |

### 6.4 成功反馈

| 操作       | 反馈方式                     |
| ---------- | ---------------------------- |
| 登录成功   | Message.success + 跳转       |
| 登出成功   | Message.success + 跳转登录页 |
| 初始化成功 | Message.success + 跳转登录页 |

---

## 7. 实现检查清单

### 7.1 页面开发

- [ ] Setup 页面（管理员初始化）
  - [ ] 表单组件
  - [ ] 表单验证
  - [ ] API 对接
  - [ ] 成功/失败处理
- [ ] Login 页面
  - [ ] 表单组件
  - [ ] 记住用户名（可选）
  - [ ] API 对接
  - [ ] 跳转逻辑
- [ ] 顶部导航栏登出功能
  - [ ] 用户信息显示
  - [ ] 下拉菜单
  - [ ] 登出 API 对接

### 7.2 路由与权限

- [ ] ProtectedRoute 组件
  - [ ] 认证状态检查
  - [ ] 未登录重定向
  - [ ] 加载状态处理
- [ ] 路由配置
  - [ ] 公开路由
  - [ ] 受保护路由
  - [ ] 404 页面

### 7.3 状态管理

- [ ] AuthContext 实现
  - [ ] 状态定义
  - [ ] login 方法
  - [ ] logout 方法
  - [ ] checkAuth 方法
  - [ ] 初始化检查
- [ ] useAuth Hook

### 7.4 HTTP 配置

- [ ] Axios 实例配置
  - [ ] withCredentials 启用
  - [ ] 响应拦截器（401 处理）
  - [ ] 错误处理
- [ ] API 封装
  - [ ] auth 相关接口

### 7.5 UI/UX

- [ ] 登录/注册页面布局
- [ ] 加载状态
- [ ] 错误提示
- [ ] 成功反馈
- [ ] 响应式适配

---

## 8. 测试场景

### 8.1 功能测试

| 测试场景             | 预期结果                   |
| -------------------- | -------------------------- |
| 首次访问系统         | 重定向到 Setup 页面        |
| 初始化管理员成功     | 跳转到登录页               |
| 使用正确账号密码登录 | 登录成功，进入主页         |
| 使用错误密码登录     | 显示错误提示，停留在登录页 |
| 未登录访问受保护路由 | 重定向到登录页             |
| 登录后访问受保护路由 | 正常显示页面内容           |
| 点击登出             | 退出登录，跳转到登录页     |
| Token 过期后访问     | 自动重定向到登录页         |

### 8.2 边界测试

| 测试场景         | 预期结果                 |
| ---------------- | ------------------------ |
| 表单提交空值     | 显示验证错误，不发送请求 |
| 网络请求超时     | 显示网络错误提示         |
| 后端服务不可用   | 显示服务错误提示         |
| 重复初始化管理员 | 显示"管理员已存在"错误   |

---

## 9. 注意事项

### 9.1 安全性

1. **密码输入**：使用 `<Input.Password>` 组件，自动隐藏密码
2. **Cookie 安全**：后端设置 HttpOnly、Secure、SameSite 属性
3. **HTTPS**：生产环境必须使用 HTTPS
4. **XSS 防护**：React 自动转义，但需注意 dangerouslySetInnerHTML 使用

### 9.2 用户体验

1. **自动聚焦**：登录页面自动聚焦用户名输入框
2. **回车提交**：表单支持回车键提交
3. **记住来源页**：登录后返回之前访问的页面
4. **Token 过期提示**：Token 过期时友好提示"登录已过期，请重新登录"

### 9.3 开发规范

1. **TypeScript 严格模式**：所有代码使用 TypeScript strict 模式
2. **组件拆分**：登录表单、Setup 表单可抽取为独立组件
3. **错误边界**：添加 Error Boundary 捕获组件错误
4. **代码复用**：登录和 Setup 页面可共享表单布局组件

---

## 10. 后续扩展（可选）

### 10.1 密码修改功能

- 添加"修改密码"页面
- 要求输入旧密码验证
- 修改后需重新登录

### 10.2 记住登录状态

- Token 有效期延长
- 使用 Refresh Token（如需要）

### 10.3 多因素认证（MFA）

- 未来如需加强安全性
- 可添加 TOTP 二次验证

---

## 附录：技术依赖

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^6.x",
    "antd": "^5.x",
    "axios": "^1.x"
  },
  "devDependencies": {
    "@types/react": "^18.x",
    "@types/react-dom": "^18.x",
    "typescript": "^5.x"
  }
}
```
