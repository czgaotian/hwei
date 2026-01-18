# CMS 系统架构说明（Architecture）

本文档描述博客 CMS 的整体架构设计，包括：

- 前后端技术选型
- 项目目录结构说明
- 前后端数据流向

目标是作为 **工程协作 / AI 代码生成 / 长期维护** 的统一架构参考。

---

## 1. 总体架构概览

系统采用 **前后端分离 + Cloudflare 原生架构**：

```text
┌────────────┐        REST API        ┌────────────────────┐
│ React CMS  │  ─────────────────▶  │ Cloudflare Worker  │
│ (AntD)     │                       │  (Hono)            │
└────────────┘                       └─────────┬──────────┘
                                                │
                          ┌─────────────────────┴─────────────┐
                          │                                   │
                    Cloudflare D1                        Cloudflare R2
                    (关系数据)                          (静态资源)
```

---

## 2. 前端架构

### 2.1 技术选型

- **React + TypeScript**
- **Ant Design**：后台 UI 组件库
- **Vite**：构建工具
- **Tiptap**：富文本编辑器（文档 / 文章内容编辑）
- **REST API** 与后端通信

设计目标：

- 清晰的页面 / 业务 / 组件分层
- 便于 CRUD 表单与表格开发
- 适配多语言（i18n）编辑场景
- 提供强大的富文本编辑能力（Markdown、格式化、扩展）

---

### 2.2 前端目录结构

```text
src/
└── react-app/
    ├── assets/        # 静态资源（图标、样式）
    ├── components/    # 通用 UI 组件（Table、Form、Modal）
    ├── context/       # React Context（如全局状态、语言）
    ├── hooks/         # 自定义 Hooks（数据请求、权限）
    ├── Layout/        # 页面布局（Sidebar / Header）
    ├── pages/         # 页面级组件（ArticleList、Editor）
    ├── routes/        # 路由定义
    ├── App.tsx        # 应用入口
    ├── index.tsx      # React 挂载点
    └── index.css      # 全局样式
```

#### 设计说明

- **pages**：一页对应一个业务模块（文章、标签、分类、媒体库）
- **components**：不包含业务逻辑，仅负责 UI
- **hooks**：封装 REST 请求、分页、表单逻辑
- **context**：如语言选择、全局配置

---

## 3. 后端架构（Cloudflare Worker）

### 3.1 技术选型

- **Cloudflare Workers**：运行环境
- **Hono**：HTTP / REST 框架
- **Drizzle ORM**：数据库 ORM
- **Cloudflare D1**：关系型数据库（SQLite）
- **Cloudflare R2**：对象存储（静态资源）
- **Wrangler**：部署与环境管理

设计目标：

- 无状态 API
- 清晰的模块与路由拆分
- 严格类型约束

---

### 3.2 后端目录结构

```text
src/
└── worker/
    ├── db/            # Drizzle schema / 数据库实例
    ├── lib/           # 工具函数（response、error、r2）
    ├── middleware/    # 中间件（鉴权、日志、错误处理）
    ├── module/        # 业务模块（article、tag、category、media）
    ├── routes/        # REST 路由定义
    ├── types/         # 共享类型定义
    └── index.ts       # Worker 入口
```

#### 设计说明

- **routes/**：只做路由与 HTTP 层逻辑
- **module/**：承载核心业务逻辑（CRUD / 校验）
- **db/**：集中管理 Drizzle schema 与 D1 连接
- **middleware/**：横切关注点（权限、错误）

---

## 4. 数据层设计

### 4.1 Cloudflare D1（关系数据）

负责存储：

- Article
- ArticleTranslation（i18n）
- Category / CategoryTranslation
- Tag / TagTranslation
- ArticleTag（多对多关系）
- Media（静态资源元数据）

特点：

- 使用 Drizzle ORM
- 强类型 schema
- 所有业务“真相”存储于 D1

---

### 4.2 Cloudflare R2（静态资源）

负责存储：

- 图片
- 视频
- 音频
- 其他附件

特点：

- Worker 不直接处理大文件
- D1 中仅保存 R2 object key 与元数据
- 支持 public 或 signed URL

---

## 5. 前后端数据流向

### 5.1 文章 CRUD 流程

```text
Frontend (React)
  → REST API (/articles)
    → Hono Route
      → Module (业务逻辑)
        → Drizzle ORM
          → D1
```

---

### 5.2 多语言内容流程（i18n）

```text
Frontend
  → /articles/{id}/translations/{lang}
    → 保存 / 查询
      → ArticleTranslation 表
```

前端可通过 Tab / 下拉框切换语言编辑。

---

### 5.3 静态资源上传流程（R2）

```text
Frontend
  → 请求上传凭证
    → Worker 生成 upload URL
      → 前端直传 R2
        → 上传完成
          → 创建 Media 记录（D1）
```

优势：

- Worker 无大文件压力
- 上传稳定、可扩展

---

## 6. 环境与部署

### 6.1 Wrangler 配置

- 使用 `wrangler.json`
- 区分：
  - dev
  - prod

- 每个环境独立：
  - D1 Database
  - R2 Bucket

---

## 7. 架构设计原则总结

- **前后端彻底分离**
- **REST 语义清晰**
- **i18n 一致性设计**（文章 / 分类 / 标签）
- **D1 存关系，R2 存文件**
- **模块化、可长期演进**

该架构可支撑个人博客长期演进，并可自然扩展为多用户 CMS。
