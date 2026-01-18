# 数据库设计说明

更新时间：2026-01-18

本文档基于 @product.md 和 @auth.md 需求，设计了适用于单管理员博客 CMS 的数据库模型，采用简洁的关系型设计。

## 设计原则

- **单管理员系统**：仅支持一个管理员账号
- **JWT 认证**：无需 session 表，使用 HttpOnly Cookie + JWT
- **软删除支持**：文章支持软删除，便于恢复和审计
- **Cloudflare 优先**：静态资源存储在 R2，数据库仅存元数据
- **类型安全**：使用 Drizzle ORM 确保类型约束

## 命名与约定

- **表命名**：使用复数形式，如 `articles`、`categories`、`tags`
- **时间字段**：使用 `integer` 存储 Unix 时间戳（秒级）
  - `created_at`：创建时间
  - `updated_at`：更新时间
  - `deleted_at`：软删除时间（NULL 表示未删除）
- **主键**：自增整型 `id`（除 user 表使用固定值）
- **布尔值**：使用 `integer` (0/1) 映射
- **枚举值**：使用 `text` 存储，应用层校验
- **唯一约束**：为关键字段（如分类名称、标签名称、slug）设置唯一约束

## 数据库模型

### 1. users（用户表）

**说明**：单管理员系统，仅存储一个管理员账号。

| 字段名       | 类型    | 约束             | 说明                       |
| ------------ | ------- | ---------------- | -------------------------- |
| `id`         | text    | PRIMARY KEY      | 用户标识，固定为 `"admin"` |
| `username`   | text    | NOT NULL, UNIQUE | 用户名，固定为 `"admin"`   |
| `password`   | text    | NOT NULL         | 密码哈希（bcrypt）         |
| `created_at` | integer | NOT NULL         | 创建时间（Unix 时间戳）    |
| `updated_at` | integer | NOT NULL         | 更新时间（Unix 时间戳）    |

**约束**：

- `UNIQUE(username)`

**初始化**：

- 首次部署时通过初始化接口创建管理员账号
- 密码使用 bcrypt 哈希存储（成本因子 10）

**认证方式**：

- 使用 JWT + HttpOnly Cookie（详见 @auth.md）
- 不需要 session 表

---

### 2. articles（文章表）

**说明**：博客文章核心表，支持草稿/发布状态、软删除、置顶等功能。

| 字段名           | 类型    | 约束                               | 说明                            |
| ---------------- | ------- | ---------------------------------- | ------------------------------- |
| `id`             | integer | PRIMARY KEY, AUTOINCREMENT         | 文章 ID                         |
| `title`          | text    | NOT NULL                           | 文章标题                        |
| `subtitle`       | text    | NULL                               | 文章副标题（可选）              |
| `slug`           | text    | NOT NULL, UNIQUE                   | URL 别名（用于 SEO）            |
| `summary`        | text    | NULL                               | 文章摘要（可选）                |
| `content`        | text    | NOT NULL                           | 文章正文（HTML 格式，Tiptap）   |
| `status`         | text    | NOT NULL, CHECK                    | 文章状态：`draft` / `published` |
| `pinned`         | integer | NOT NULL, DEFAULT 0                | 是否置顶（0/1）                 |
| `category_id`    | integer | FOREIGN KEY → categories(id), NULL | 所属分类                        |
| `cover_media_id` | integer | FOREIGN KEY → media(id), NULL      | 封面图片                        |
| `created_at`     | integer | NOT NULL                           | 创建时间                        |
| `updated_at`     | integer | NOT NULL                           | 更新时间                        |
| `deleted_at`     | integer | NULL                               | 软删除时间（NULL 表示未删除）   |

**约束**：

- `UNIQUE(slug)`
- `CHECK(status IN ('draft', 'published'))`

**索引建议**：

- `status`：按状态查询
- `pinned`：按置顶状态查询
- `category_id`：按分类查询
- `created_at`：按时间排序
- `deleted_at`：软删除筛选

---

### 3. categories（分类表）

**说明**：文章分类，一个文章只能属于一个分类。

| 字段名       | 类型    | 约束                       | 说明                        |
| ------------ | ------- | -------------------------- | --------------------------- |
| `id`         | integer | PRIMARY KEY, AUTOINCREMENT | 分类 ID                     |
| `name`       | text    | NOT NULL, UNIQUE           | 分类名称                    |
| `color`      | text    | NULL                       | 分类颜色（HEX，如 #FF6B6B） |
| `created_at` | integer | NOT NULL                   | 创建时间                    |
| `updated_at` | integer | NOT NULL                   | 更新时间                    |

**约束**：

- `UNIQUE(name)`

**业务规则**：

- 删除分类时，需检查是否有文章引用
- 被引用的分类不可删除（或将文章的 `category_id` 设为 NULL）

---

### 4. tags（标签表）

**说明**：文章标签，与文章为多对多关系。

| 字段名       | 类型    | 约束                       | 说明                        |
| ------------ | ------- | -------------------------- | --------------------------- |
| `id`         | integer | PRIMARY KEY, AUTOINCREMENT | 标签 ID                     |
| `name`       | text    | NOT NULL, UNIQUE           | 标签名称                    |
| `color`      | text    | NULL                       | 标签颜色（HEX，如 #4ECDC4） |
| `created_at` | integer | NOT NULL                   | 创建时间                    |
| `updated_at` | integer | NOT NULL                   | 更新时间                    |

**约束**：

- `UNIQUE(name)`

---

### 5. article_tags（文章-标签关联表）

**说明**：文章与标签的多对多关系。

| 字段名       | 类型    | 约束                       | 说明    |
| ------------ | ------- | -------------------------- | ------- |
| `article_id` | integer | FOREIGN KEY → articles(id) | 文章 ID |
| `tag_id`     | integer | FOREIGN KEY → tags(id)     | 标签 ID |

**约束**：

- `PRIMARY KEY(article_id, tag_id)`
- 级联删除：删除文章或标签时，自动删除关联记录

**索引建议**：

- `article_id`：查询文章的标签
- `tag_id`：查询标签下的文章

---

### 6. media（静态资源表）

**说明**：存储静态资源元数据，文件本体存储在 Cloudflare R2。

| 字段名       | 类型    | 约束                       | 说明                                           |
| ------------ | ------- | -------------------------- | ---------------------------------------------- |
| `id`         | integer | PRIMARY KEY, AUTOINCREMENT | 资源 ID                                        |
| `type`       | text    | NOT NULL, CHECK            | 资源类型：`image` / `video` / `audio` / `file` |
| `r2_key`     | text    | NOT NULL, UNIQUE           | R2 对象键（唯一标识）                          |
| `url`        | text    | NOT NULL                   | 公开访问 URL                                   |
| `filename`   | text    | NOT NULL                   | 原始文件名                                     |
| `mime_type`  | text    | NULL                       | MIME 类型（如 `image/jpeg`）                   |
| `size`       | integer | NULL                       | 文件大小（字节）                               |
| `width`      | integer | NULL                       | 图片宽度（仅图片类型）                         |
| `height`     | integer | NULL                       | 图片高度（仅图片类型）                         |
| `duration`   | integer | NULL                       | 媒体时长（秒，仅音视频）                       |
| `created_at` | integer | NOT NULL                   | 创建时间                                       |

**约束**：

- `UNIQUE(r2_key)`
- `CHECK(type IN ('image', 'video', 'audio', 'file'))`

**业务规则**：

- 上传接口需要管理员认证（详见 @auth.md）
- 删除资源时，同步删除 R2 中的文件
- 建议校验文件类型和大小限制

---

### 7. article_media（文章-媒体关联表）

**说明**：记录文章中引用的媒体资源（如正文中的图片）。

| 字段名       | 类型    | 约束                       | 说明                                    |
| ------------ | ------- | -------------------------- | --------------------------------------- |
| `article_id` | integer | FOREIGN KEY → articles(id) | 文章 ID                                 |
| `media_id`   | integer | FOREIGN KEY → media(id)    | 媒体 ID                                 |
| `purpose`    | text    | NULL                       | 用途说明（如 `content` / `attachment`） |

**约束**：

- `PRIMARY KEY(article_id, media_id)`

**索引建议**：

- `article_id`：查询文章引用的媒体

---

## 关系图

```
users（单记录）
  ↓（认证使用 JWT，无 session 表）

articles * ── 1 categories（一对多：一个文章属于一个分类）
articles * ──* tags（多对多，通过 article_tags）
articles * ──* media（多对多，通过 article_media，正文中引用）
articles * ── 1 media（一对一：cover_media_id，封面图）
```

**说明**：

- 用户认证通过 JWT + HttpOnly Cookie 实现，不需要 session 表
- 文章与分类为一对多关系（可选，`category_id` 可为 NULL）
- 文章与标签为多对多关系，通过 `article_tags` 关联
- 文章与媒体为多对多关系，通过 `article_media` 记录正文中引用的媒体
- 文章的封面图通过 `cover_media_id` 外键直接关联

---

## 典型查询模式

### 1) 获取已发布文章列表（带分类信息）

```sql
SELECT
  a.id, a.title, a.subtitle, a.slug, a.summary,
  a.status, a.pinned, a.created_at, a.updated_at,
  c.id as category_id, c.name as category_name, c.color as category_color
FROM articles a
LEFT JOIN categories c ON a.category_id = c.id
WHERE a.deleted_at IS NULL AND a.status = 'published'
ORDER BY a.pinned DESC, a.created_at DESC;
```

### 2) 获取文章详情（含标签、封面图）

```sql
-- 文章基本信息
SELECT a.*, c.name as category_name, m.url as cover_url
FROM articles a
LEFT JOIN categories c ON a.category_id = c.id
LEFT JOIN media m ON a.cover_media_id = m.id
WHERE a.id = ? AND a.deleted_at IS NULL;

-- 文章的标签
SELECT t.id, t.name, t.color
FROM tags t
JOIN article_tags at ON t.id = at.tag_id
WHERE at.article_id = ?;

-- 文章引用的媒体
SELECT m.*, am.purpose
FROM media m
JOIN article_media am ON m.id = am.media_id
WHERE am.article_id = ?;
```

### 3) 按分类筛选文章

```sql
SELECT a.*
FROM articles a
WHERE a.category_id = ?
  AND a.deleted_at IS NULL
  AND a.status = 'published'
ORDER BY a.created_at DESC;
```

### 4) 按标签筛选文章

```sql
SELECT DISTINCT a.*
FROM articles a
JOIN article_tags at ON a.id = at.article_id
WHERE at.tag_id = ?
  AND a.deleted_at IS NULL
  AND a.status = 'published'
ORDER BY a.created_at DESC;
```

### 5) 搜索文章（标题、摘要）

```sql
SELECT a.*, c.name as category_name
FROM articles a
LEFT JOIN categories c ON a.category_id = c.id
WHERE a.deleted_at IS NULL
  AND a.status = 'published'
  AND (a.title LIKE ? OR a.summary LIKE ?)
ORDER BY a.created_at DESC;
```

### 6) 获取分类列表（含文章数量）

```sql
SELECT
  c.id, c.name, c.color, c.created_at,
  COUNT(a.id) as article_count
FROM categories c
LEFT JOIN articles a ON c.id = a.category_id
  AND a.deleted_at IS NULL
  AND a.status = 'published'
GROUP BY c.id
ORDER BY article_count DESC;
```

### 7) 获取标签云（含文章数量）

```sql
SELECT
  t.id, t.name, t.color,
  COUNT(at.article_id) as article_count
FROM tags t
LEFT JOIN article_tags at ON t.id = at.tag_id
LEFT JOIN articles a ON at.article_id = a.id
  AND a.deleted_at IS NULL
  AND a.status = 'published'
GROUP BY t.id
HAVING article_count > 0
ORDER BY article_count DESC;
```

---

## 索引建议

为提高查询性能，建议在 Drizzle 迁移中创建以下索引：

**articles 表**：

- `idx_articles_status` ON `status`
- `idx_articles_pinned` ON `pinned`
- `idx_articles_category_id` ON `category_id`
- `idx_articles_created_at` ON `created_at`
- `idx_articles_deleted_at` ON `deleted_at`
- `idx_articles_slug` ON `slug`（已通过 UNIQUE 约束自动创建）

**article_tags 表**：

- `idx_article_tags_article_id` ON `article_id`
- `idx_article_tags_tag_id` ON `tag_id`

**article_media 表**：

- `idx_article_media_article_id` ON `article_id`
- `idx_article_media_media_id` ON `media_id`

**media 表**：

- `idx_media_type` ON `type`
- `idx_media_created_at` ON `created_at`

---

## 认证与安全

### 认证方式

根据 @auth.md 设计：

- **JWT（JSON Web Token）**：无状态认证
- **HttpOnly Cookie**：存储 Access Token
  - 属性：`HttpOnly; Secure; SameSite=Strict`
  - 有效期：30 分钟
- **不使用 session 表**：Cloudflare Workers 天然适合无状态架构

### 密码管理

- **哈希算法**：bcrypt（成本因子 10）
- **初始化**：首次部署时通过初始化接口创建管理员
- **修改密码**：通过 `/api/admin/auth/change-password` 接口

### 权限控制

- **单管理员**：`users` 表仅一条记录（`id = "admin"`）
- **受保护路由**：`/api/admin/*` 需要 JWT 验证
- **中间件**：从 Cookie 中提取 JWT，验证签名和过期时间

---

## 业务规则总结

### 文章（Articles）

1. **状态机**：
   - `draft` → `published`：发布文章
   - `published` → `draft`：下线文章
2. **软删除**：删除时设置 `deleted_at`，不物理删除
3. **置顶**：`pinned = 1` 的文章在列表中优先展示
4. **Slug 唯一性**：用于 SEO 友好的 URL

### 分类（Categories）

1. **唯一性**：分类名称不可重复
2. **删除限制**：被文章引用的分类不可删除
3. **可选关联**：文章的 `category_id` 可为 NULL

### 标签（Tags）

1. **唯一性**：标签名称不可重复
2. **自动清理**：删除标签时，自动删除 `article_tags` 中的关联记录
3. **多对多**：一个文章可以有多个标签，一个标签可以关联多个文章

### 媒体（Media）

1. **分离存储**：文件本体存储在 Cloudflare R2，数据库仅存元数据
2. **唯一键**：`r2_key` 确保 R2 对象唯一性
3. **类型校验**：上传时需校验 `type` 和 MIME 类型
4. **级联删除**：删除媒体记录时，同步删除 R2 文件

---

## D1 特性与限制

### D1 数据库特点

- **基于 SQLite**：完全兼容 SQLite 语法
- **Serverless**：运行在 Cloudflare 边缘网络
- **时间旅行**：支持 Point-in-Time Recovery
- **限制**：
  - 单库大小：2GB（Free）/ 10GB（Paid）
  - 并发写入：有限制，适合读多写少场景

### Drizzle ORM 集成

- **类型安全**：TypeScript 类型推断
- **迁移管理**：`drizzle-kit generate` 生成迁移文件
- **查询构建**：链式 API，避免 SQL 注入

### 开发环境

- **本地开发**：使用 `wrangler dev --local --persist`
- **迁移执行**：`wrangler d1 migrations apply <database_name>`
- **数据查看**：`wrangler d1 execute <database_name> --command "SELECT * FROM users"`

---

## 未来扩展方向（非当前版本）

以下功能**当前不实现**，仅作为演进参考：

### 多管理员支持

- 扩展 `users` 表，添加 `role` 字段（admin / editor）
- 添加权限控制表（RBAC）

### 评论系统

- 添加 `comments` 表
- 支持嵌套评论（parent_comment_id）

### 多语言支持

- 添加 `article_translations` 表
- 支持国际化（i18n）

### 文章版本管理

- 添加 `article_versions` 表
- 记录每次修改历史

### 统计与分析

- 添加 `article_views` 表
- 记录阅读量、访问来源

---

## 总结

本数据库设计遵循以下原则：

✅ **简洁实用**：仅包含核心功能，避免过度设计  
✅ **类型安全**：使用 Drizzle ORM 确保类型约束  
✅ **性能优先**：合理索引，优化常见查询  
✅ **安全第一**：JWT 认证，bcrypt 密码哈希  
✅ **Cloudflare 原生**：充分利用 D1 + R2 + Workers 生态  
✅ **可扩展**：预留扩展空间，支持未来演进

本设计完全符合 @product.md 和 @auth.md 的需求，适合个人博客 CMS 长期维护。
