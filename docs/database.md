# 数据库设计说明

更新时间：2026-01-18

本文档基于产品文档需求，设计了适用于单管理员博客CMS的数据库模型，采用简洁的单语言关系型设计。

## 命名与约定

- 表命名：使用复数与下划线，如 `articles`、`categories`、`tags`。
- 时间字段：使用 `integer` 存储 Unix epoch 秒；字段名 `created_at`、`updated_at`、`deleted_at`（软删除，NULL 表示未删除）。
- 布尔值：使用 `integer`（0/1）或 Drizzle boolean mode 映射。
- 唯一约束：为关键字段如分类名称、标签名称设置唯一约束。

## 数据库模型

基于产品文档的单语言设计，采用以下简化的数据库模型：

### 1) articles（文章）

- 字段：
  - `id` (integer, PK, autoIncrement)
  - `title` (text, NOT NULL) - 文章标题
  - `subtitle` (text, NULL) - 文章副标题，可选
  - `slug` (text, UNIQUE, NOT NULL) - 文章别名，用于 URL
  - `summary` (text, NULL) - 文章摘要，可选
  - `content` (text, NOT NULL) - 文章正文，HTML格式
  - `status` (text, enum: `draft`/`published`) - 文章状态
  - `pinned` (integer, NOT NULL, default: 0) - 是否置顶（0/1）
  - `category_id` (integer, FK → categories.id, NULL) - 所属分类
  - `cover_media_id` (integer, FK → media.id, NULL) - 封面图片
  - `created_at` (integer, NOT NULL)
  - `updated_at` (integer, NOT NULL)
  - `deleted_at` (integer, NULL) - 软删除时间
- 说明：包含文章的完整信息

### 2) categories（分类）

- 字段：
  - `id` (integer, PK, autoIncrement)
  - `name` (text, UNIQUE, NOT NULL) - 分类名称
  - `color` (text, NULL) - 分类颜色，用于前端展示
  - `created_at` (integer, NOT NULL)
  - `updated_at` (integer, NOT NULL)
- 约束：UNIQUE(`name`) - 分类名称唯一
- 说明：分类表，直接存储名称和颜色

### 3) tags（标签）

- 字段：
  - `id` (integer, PK, autoIncrement)
  - `name` (text, UNIQUE, NOT NULL) - 标签名称
  - `color` (text, NULL) - 标签颜色，用于前端展示
  - `created_at` (integer, NOT NULL)
  - `updated_at` (integer, NOT NULL)
- 约束：UNIQUE(`name`) - 标签名称唯一
- 说明：标签表，直接存储名称和颜色

### 4) article_tags（文章-标签关联）

- 字段：
  - `article_id` (integer, FK → articles.id)
  - `tag_id` (integer, FK → tags.id)
- 主键：复合 PK(`article_id`, `tag_id`)
- 说明：文章与标签的多对多关系

### 5) media（静态资源）

- 字段：
  - `id` (integer, PK, autoIncrement)
  - `type` (text, NOT NULL) - 资源类型: image/video/audio/file
  - `r2_key` (text, UNIQUE, NOT NULL) - R2存储的对象键
  - `url` (text, NOT NULL) - 可访问的URL
  - `filename` (text, NOT NULL) - 原始文件名
  - `mime_type` (text, NULL) - MIME类型
  - `size` (integer, NULL) - 文件大小（字节）
  - `width` (integer, NULL) - 图片宽度（仅图片）
  - `height` (integer, NULL) - 图片高度（仅图片）
  - `duration` (integer, NULL) - 媒体时长（仅音视频，秒）
  - `created_at` (integer, NOT NULL)
- 约束：UNIQUE(`r2_key`)
- 说明：存储静态资源元数据，文件本体存储在Cloudflare R2

### 6) article_media（文章-媒体关联）

- 字段：
  - `article_id` (integer, FK → articles.id)
  - `media_id` (integer, FK → media.id)
  - `purpose` (text, NULL) - 用途说明，如 'content' 或 'attachment'
- 主键：复合 PK(`article_id`, `media_id`)
- 说明：记录文章中引用的媒体资源

### 7) user（用户）

- 字段：
  - `id` (text, PK) - 用户ID
  - `email` (text, UNIQUE, NOT NULL) - 邮箱地址
  - `password` (text, NOT NULL) - 密码哈希
  - `created_at` (integer, NOT NULL)
  - `updated_at` (integer, NOT NULL)
- 约束：UNIQUE(`email`)
- 说明：单管理员用户表

### 8) session（会话）

- 字段：
  - `id` (text, PK) - 会话ID
  - `expires_at` (integer, NOT NULL) - 过期时间
  - `user_id` (text, FK → user.id, NOT NULL) - 关联用户
  - `fresh` (integer, NOT NULL, default: 1) - 会话是否新鲜
- 说明：用户会话管理

## 关键设计原则

### 1) 软删除支持

- 文章支持软删除（`deleted_at` 字段）
- 便于恢复误删数据和审计

### 2) 颜色支持

- 分类和标签都支持颜色设置
- 用于前端视觉区分和品牌化

### 3) 媒体管理

- 文件本体存储在 Cloudflare R2
- 数据库只存储元数据和访问信息
- 支持图片、视频、音频、文件等多种类型

### 4) 关系设计

- 文章与分类：一对多关系（一个文章属于一个分类）
- 文章与标签：多对多关系（通过 article_tags 中间表）
- 文章与媒体：多对多关系（通过 article_media 中间表）

## 关系图

```
user 1 ──* session

articles * ── 1 categories
articles * ──* tags (via article_tags)
articles * ──* media (via article_media)
articles * ── 1 media (cover_media_id)
```

## 典型查询模式

### 1) 获取文章列表（带分类、标签）

```sql
SELECT a.*, c.name as category_name, c.color as category_color
FROM articles a
LEFT JOIN categories c ON a.category_id = c.id
WHERE a.deleted_at IS NULL
ORDER BY a.created_at DESC;
```

### 2) 获取文章的标签

```sql
SELECT t.*
FROM tags t
JOIN article_tags at ON t.id = at.tag_id
WHERE at.article_id = ?;
```

### 3) 按分类筛选文章

```sql
SELECT a.*
FROM articles a
JOIN categories c ON a.category_id = c.id
WHERE c.name = ? AND a.deleted_at IS NULL;
```

## 索引建议

为提高查询性能，建议创建以下索引：

- `articles.status` - 按状态查询
- `articles.pinned` - 按置顶状态查询
- `articles.category_id` - 按分类查询
- `articles.created_at` - 按时间排序
- `articles.deleted_at` - 软删除筛选
- `article_tags.article_id` - 标签关联查询
- `article_media.article_id` - 媒体关联查询

## 总结

- 采用简化的单语言设计，大幅降低复杂度
- 直接存储内容，减少不必要的表结构
- 支持核心功能：文章管理、分类标签、媒体管理
- 为个人博客场景优化，便于开发和维护
- 保留扩展性，后期如需要可以适当调整
