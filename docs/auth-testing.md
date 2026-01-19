# 认证功能测试指南

本文档提供了一些测试命令，用于验证认证功能是否正常工作。

## 前提条件

1. 确保已经启动开发服务器：`pnpm dev`
2. 确保已经运行数据库迁移：`pnpm db:migrate`
3. 确保 `.dev.vars` 文件中已设置 `JWT_SECRET`

## 测试步骤

### 1. 注册初始管理员

```bash
curl -X POST http://localhost:5173/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }' \
  -v
```

预期响应：

```json
{
  "message": "Admin user created successfully"
}
```

状态码：201

### 2. 测试重复注册（应该失败）

```bash
curl -X POST http://localhost:5173/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }' \
  -v
```

预期响应：

```json
{
  "error": "FORBIDDEN",
  "message": "User already exists. Registration is disabled."
}
```

状态码：403

### 3. 登录

```bash
curl -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }' \
  -c cookies.txt \
  -v
```

预期响应：

```json
{
  "message": "Login successful"
}
```

状态码：200

检查响应头应该包含：

```
Set-Cookie: auth_token=...; HttpOnly; Secure; SameSite=Strict; Max-Age=1800; Path=/
```

### 4. 测试错误的密码

```bash
curl -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "wrongpassword"
  }' \
  -v
```

预期响应：

```json
{
  "error": "INVALID_CREDENTIALS",
  "message": "Invalid username or password"
}
```

状态码：401

### 5. 验证登录状态

```bash
curl -X GET http://localhost:5173/api/auth/verify \
  -b cookies.txt \
  -v
```

预期响应：

```json
{
  "valid": true,
  "expiresIn": 1500
}
```

状态码：200

### 6. 访问受保护的接口（文章列表）

```bash
curl -X GET http://localhost:5173/api/admin/articles \
  -b cookies.txt \
  -v
```

预期响应：文章列表（具体内容取决于数据库中的数据）

状态码：200

### 7. 测试未认证访问受保护接口

```bash
curl -X GET http://localhost:5173/api/admin/articles \
  -v
```

预期响应：

```json
{
  "error": "MISSING_TOKEN",
  "message": "Missing authentication token"
}
```

状态码：401

### 8. 修改密码

```bash
curl -X POST http://localhost:5173/api/auth/change-password \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "admin123",
    "newPassword": "newpassword123"
  }' \
  -b cookies.txt \
  -v
```

预期响应：

```json
{
  "message": "Password changed successfully"
}
```

状态码：200

### 9. 用新密码登录

```bash
curl -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "newpassword123"
  }' \
  -c cookies2.txt \
  -v
```

预期响应：

```json
{
  "message": "Login successful"
}
```

状态码：200

### 10. 登出

```bash
curl -X POST http://localhost:5173/api/auth/logout \
  -b cookies2.txt \
  -v
```

预期响应：

```json
{
  "message": "Logout successful"
}
```

状态码：200

检查响应头应该包含：

```
Set-Cookie: auth_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/
```

### 11. 验证登出后无法访问受保护接口

```bash
curl -X GET http://localhost:5173/api/admin/articles \
  -b cookies2.txt \
  -v
```

预期响应：

```json
{
  "error": "MISSING_TOKEN",
  "message": "Missing authentication token"
}
```

状态码：401

## 使用 HTTPie 测试（可选）

如果安装了 HTTPie，可以使用更友好的命令：

```bash
# 注册
http POST http://localhost:5173/api/auth/register username=admin password=admin123

# 登录
http POST http://localhost:5173/api/auth/login username=admin password=admin123 --session=admin

# 访问受保护接口
http GET http://localhost:5173/api/admin/articles --session=admin

# 登出
http POST http://localhost:5173/api/auth/logout --session=admin
```

## 使用 Postman/Insomnia 测试

1. 创建一个新的请求集合
2. 设置 Base URL 为 `http://localhost:5173/api`
3. 在设置中启用 "Automatically follow redirects"
4. 在设置中启用 "Send cookies with requests"
5. 按照上述测试步骤依次执行

## 常见问题

### Cookie 未被设置

检查响应头中是否有 `Set-Cookie`，如果没有：

1. 确认 CORS 配置正确
2. 确认使用了正确的 Origin（localhost:5173）
3. 检查浏览器控制台是否有错误

### Token 验证失败

1. 检查 JWT_SECRET 是否配置
2. 确认 Token 未过期
3. 检查 Cookie 是否正确传递

### 无法注册用户

1. 确认数据库迁移已执行
2. 检查是否已有用户存在
3. 查看服务器日志获取详细错误信息

## 自动化测试脚本

你也可以创建一个 shell 脚本来自动运行所有测试：

```bash
#!/bin/bash

BASE_URL="http://localhost:5173/api"

echo "1. 注册管理员..."
curl -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -s | jq

echo "\n2. 登录..."
curl -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -c cookies.txt \
  -s | jq

echo "\n3. 验证登录状态..."
curl -X GET $BASE_URL/auth/verify \
  -b cookies.txt \
  -s | jq

echo "\n4. 访问受保护接口..."
curl -X GET $BASE_URL/admin/articles \
  -b cookies.txt \
  -s | jq

echo "\n5. 登出..."
curl -X POST $BASE_URL/auth/logout \
  -b cookies.txt \
  -s | jq

echo "\n测试完成！"
```

保存为 `test-auth.sh` 并执行：

```bash
chmod +x test-auth.sh
./test-auth.sh
```
